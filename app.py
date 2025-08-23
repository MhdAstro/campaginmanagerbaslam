# app.py — Basalam OAuth + Campaigns + Admin-by-phone + Vendor selections + Admin view + Min discount 3%

import os, sqlite3
from urllib.parse import urlencode
from datetime import date
from dotenv import load_dotenv
from flask import (
    Flask, redirect, request, session, url_for,
    render_template, jsonify, abort, g, flash, send_file
)
import requests
import csv
from io import StringIO, BytesIO
import khayyam

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "change_me")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
)

AUTHZ_URL    = "https://basalam.com/accounts/sso"
TOKEN_URL    = "https://auth.basalam.com/oauth/token"
ME_URL       = "https://core.basalam.com/v3/users/me"
VENDOR_PRODS = "https://core.basalam.com/v3/vendors/{vendor_id}/products"

CLIENT_ID     = os.getenv("BASALAM_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("BASALAM_CLIENT_SECRET", "")
REDIRECT_URI  = os.getenv("BASALAM_REDIRECT_URI", "http://localtest.ir:5000/auth/callback")
SCOPES        = os.getenv("BASALAM_SCOPES", "customer.profile.read vendor.product.read")

ADMIN_PHONES = {"09121969038", "09226807545"}

DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")

# Jalali date helper functions
def gregorian_to_jalali(g_date):
    """Convert Gregorian date to Jalali"""
    if isinstance(g_date, str):
        try:
            g_date = date.fromisoformat(g_date)
        except:
            return g_date
    
    try:
        j_date = khayyam.JalaliDate.from_date(g_date)
        return j_date.strftime("%Y/%m/%d")
    except:
        return str(g_date)

def jalali_to_gregorian(j_date_str):
    """Convert Jalali date string to Gregorian date"""
    try:
        # Parse Jalali date string (format: YYYY/MM/DD)
        parts = j_date_str.split('/')
        if len(parts) == 3:
            j_year, j_month, j_day = map(int, parts)
            j_date = khayyam.JalaliDate(j_year, j_month, j_day)
            return j_date.to_date()
        return None
    except:
        return None

def format_jalali_date(g_date):
    """Format Gregorian date as Persian with month names"""
    if isinstance(g_date, str):
        try:
            g_date = date.fromisoformat(g_date)
        except:
            return g_date
    
    try:
        j_date = khayyam.JalaliDate.from_date(g_date)
        month_names = [
            "", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
        ]
        return f"{j_date.day} {month_names[j_date.month]} {j_date.year}"
    except:
        return str(g_date)

# Add Jinja2 filters for date formatting
@app.template_filter('jalali')
def jalali_filter(g_date):
    return gregorian_to_jalali(g_date)

@app.template_filter('jalali_pretty')
def jalali_pretty_filter(g_date):
    return format_jalali_date(g_date)

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

SCHEMA = """
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaign_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  vendor_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_title TEXT DEFAULT '',
  discount_percent REAL DEFAULT 0,
  selected_at TEXT DEFAULT (datetime('now')),
  UNIQUE (campaign_id, vendor_id, product_id)
);
"""

@app.before_request
def ensure_db():
    db = get_db()
    db.executescript(SCHEMA)
    # مایگریشن سبک: اگه ستون‌های جدید وجود نداشت، اضافه‌شان کن
    cols = [r[1] for r in db.execute("PRAGMA table_info(campaign_items)").fetchall()]
    if "discount_percent" not in cols:
        db.execute("ALTER TABLE campaign_items ADD COLUMN discount_percent REAL DEFAULT 0")
    if "product_title" not in cols:
        db.execute("ALTER TABLE campaign_items ADD COLUMN product_title TEXT DEFAULT ''")
    db.commit()

# Helpers
def is_logged_in(): return "access_token" in session and "vendor_id" in session
def is_admin():     return bool(session.get("is_admin"))
def ensure_login():
    if not is_logged_in(): abort(401)
def ensure_admin():
    if not is_logged_in() or not is_admin(): abort(403)

# Pages
@app.route("/")
def index():
    return redirect(url_for("welcome"))

@app.route("/welcome")
def welcome():
    return render_template(
        "welcome.html",
        is_logged_in=is_logged_in(),
        is_admin=is_admin(),
        user=session.get("user"),
    )

@app.route("/campaigns")
def campaigns():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM campaigns ORDER BY date(start_date) DESC"
    ).fetchall()
    # Parse date strings -> date objects for template arithmetic
    campaigns = []
    for r in rows:
        d = dict(r)
        try:
            d["start_date"] = date.fromisoformat(str(d["start_date"]))
        except Exception:
            pass
        try:
            d["end_date"] = date.fromisoformat(str(d["end_date"]))
        except Exception:
            pass
        campaigns.append(d)
    return render_template(
        "index.html",
        campaigns=campaigns,
        is_admin=is_admin(),
        now=date.today(),
        user=session.get("user"),
    )

@app.route("/rules")
def rules():
    return render_template("rules.html")


@app.route("/campaign/<int:cid>")
def campaign_detail(cid: int):
    db = get_db()
    camp = db.execute("SELECT * FROM campaigns WHERE id=?", (cid,)).fetchone()
    if not camp: abort(404)

    # انتخاب‌های من (فقط برای نمایش اولیه)
    my = []
    if is_logged_in():
        my = [
            r["product_id"]
            for r in db.execute(
                "SELECT product_id FROM campaign_items WHERE campaign_id=? AND vendor_id=?",
                (cid, session["vendor_id"]),
            ).fetchall()
        ]

    return render_template(
        "campaign_detail.html",
        campaign=camp,
        my_products=my,
        user=session.get("user"),
        is_admin=is_admin(),
    )

# Auth
@app.route("/login")
def login():
    state = os.urandom(8).hex()
    session["oauth_state"] = state
    params = {
        "client_id": CLIENT_ID,
        "scope": SCOPES,
        "redirect_uri": REDIRECT_URI,
        "state": state,
        "response_type": "code",
    }
    return redirect(f"{AUTHZ_URL}?{urlencode(params)}")

@app.route("/auth/callback")
def auth_callback():
    code  = request.args.get("code", "")
    state = request.args.get("state", "")
    if not code: return "Missing code", 400
    if state != session.get("oauth_state"): return "OAuth state mismatch.", 400

    resp = requests.post(
        TOKEN_URL,
        headers={"Accept":"application/json","Content-Type":"application/x-www-form-urlencoded"},
        data={
            "grant_type":"authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "code": code,
        },
        timeout=25
    )
    if not resp.ok: return f"Token request failed: {resp.status_code} {resp.text}", 502
    tk = resp.json()
    access = tk.get("access_token")
    if not access: return f"no access_token: {tk}", 502

    me = requests.get(ME_URL, headers={"Authorization": f"Bearer {access}","Accept":"application/json"}, timeout=20)
    if not me.ok: return f"/users/me failed: {me.text}", me.status_code
    me_json = me.json()
    vid = (me_json.get("vendor") or {}).get("id")
    if not vid: return "این حساب غرفه‌دار نیست.", 403

    phone = me_json.get("mobile") or me_json.get("phone") or me_json.get("mobile_number") or me_json.get("username")

    session.clear()
    session["access_token"] = access
    session["refresh_token"] = tk.get("refresh_token")
    session["user"] = me_json
    session["vendor_id"] = vid
    session["is_admin"] = phone in ADMIN_PHONES

    flash("ورود موفق.", "success")
    return redirect(url_for("welcome"))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("welcome"))

@app.route("/sw.js")
def service_worker():
    return app.send_static_file('sw.js')

# Admin: create campaign
@app.route("/admin/campaigns/create", methods=["POST"])
def admin_create_campaign():
    ensure_admin()
    title = request.form.get("title","").strip()
    description = request.form.get("description","").strip()
    start_date_persian = request.form.get("start_date_persian","").strip()
    end_date_persian = request.form.get("end_date_persian","").strip()
    
    if not title or not start_date_persian or not end_date_persian:
        flash("همهٔ فیلدهای ضروری را پر کنید.", "danger")
        return redirect(url_for("campaigns"))
    
    # Convert Persian dates to Gregorian
    try:
        start_date = jalali_to_gregorian(start_date_persian)
        end_date = jalali_to_gregorian(end_date_persian)
        
        if not start_date or not end_date:
            flash("فرمت تاریخ نامعتبر است. از فرمت YYYY/MM/DD استفاده کنید.", "danger")
            return redirect(url_for("campaigns"))
            
        if start_date >= end_date:
            flash("تاریخ پایان باید بعد از تاریخ شروع باشد.", "danger")
            return redirect(url_for("campaigns"))
            
    except Exception as e:
        flash("خطا در تبدیل تاریخ. لطفاً فرمت صحیح را وارد کنید.", "danger")
        return redirect(url_for("campaigns"))
    
    db = get_db()
    db.execute(
        "INSERT INTO campaigns (title, description, start_date, end_date) VALUES (?,?,?,?)",
        (title, description, start_date.isoformat(), end_date.isoformat())
    )
    db.commit()
    flash("کمپین ایجاد شد.", "success")
    return redirect(url_for("campaigns"))

# Admin: delete campaign
@app.route("/admin/campaigns/<int:cid>/delete", methods=["POST"])
def admin_delete_campaign(cid: int):
    ensure_admin()
    db = get_db()
    
    # Check if campaign exists
    campaign = db.execute("SELECT * FROM campaigns WHERE id=?", (cid,)).fetchone()
    if not campaign:
        flash("کمپین یافت نشد.", "danger")
        return redirect(url_for("campaigns"))
    
    # Delete related campaign items first
    db.execute("DELETE FROM campaign_items WHERE campaign_id=?", (cid,))
    
    # Delete campaign
    db.execute("DELETE FROM campaigns WHERE id=?", (cid,))
    db.commit()
    
    flash(f"کمپین '{campaign['title']}' حذف شد.", "success")
    return redirect(url_for("campaigns"))

# APIs
@app.route("/api/campaigns")
def api_campaigns():
    db = get_db()
    rows = db.execute("SELECT * FROM campaigns ORDER BY date(start_date) DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/my-products")
def api_my_products():
    ensure_login()
    try:
        page = request.args.get("page", 1)
        per = request.args.get("per_page", 50)
        vid = session["vendor_id"]
        
        # Convert to integers and validate
        try:
            page = int(page)
            per = int(per)
        except (ValueError, TypeError):
            page = 1
            per = 50
        
        # Ensure reasonable limits
        per = max(1, min(100, per))  # Between 1 and 100
        page = max(1, page)  # At least 1
        
        r = requests.get(
            VENDOR_PRODS.format(vendor_id=vid),
            headers={"Authorization": f"Bearer {session['access_token']}", "Accept": "application/json"},
            params={"page": page, "per_page": per},
            timeout=30
        )
        
        if not r.ok:
            # Return empty data instead of error
            return jsonify({"data": [], "total": 0, "page": page, "per_page": per})
        
        data = r.json()
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in api_my_products: {e}")
        # Return empty data on error
        return jsonify({"data": [], "total": 0, "page": 1, "per_page": 50})

# → انتخاب‌های من (با تخفیف)
@app.route("/api/campaigns/<int:cid>/my-selections")
def api_my_selections(cid: int):
    ensure_login()
    db = get_db()
    
    rows = db.execute(
        "SELECT product_id, discount_percent FROM campaign_items WHERE campaign_id=? AND vendor_id=?",
        (cid, session["vendor_id"]),
    ).fetchall()
    
    result = [{"product_id": r["product_id"], "discount": r["discount_percent"] or 0} for r in rows]
    
    return jsonify(result)

# → ذخیرهٔ انتخاب‌ها (حداقل تخفیف 3٪)
@app.route("/api/campaigns/<int:cid>/select-products", methods=["POST"])
def api_select_products(cid: int):
    ensure_login()
    payload = request.get_json(silent=True) or {}
    items = payload.get("items", [])
    if not isinstance(items, list):
        return jsonify({"error":"items must be a list"}), 400

    cleaned = []
    invalid = []
    for it in items:
        pid = (str(it.get("product_id") or "").strip())
        title = (str(it.get("title", it.get("name", "")) or "")).strip()
        try:
            disc = float(it.get("discount", 0))
        except (TypeError, ValueError):
            disc = 0
        # بُرش در 0..100
        disc = max(0.0, min(100.0, disc))
        if pid:
            # حداقل 3٪ برای هر مورد انتخاب‌شده
            if disc < 3.0:
                invalid.append({"product_id": pid, "discount": disc})
            else:
                cleaned.append((pid, title, disc))

    if invalid:
        return jsonify({
            "ok": False,
            "error": "MIN_DISCOUNT",
            "message": "تخفیف کمتر از ۳٪ مجاز نیست.",
            "items": invalid
        }), 400

    db = get_db()
    
    db.execute("DELETE FROM campaign_items WHERE campaign_id=? AND vendor_id=?", (cid, session["vendor_id"]))
    for pid, title, disc in sorted(set(cleaned)):
        db.execute(
            "INSERT OR IGNORE INTO campaign_items (campaign_id, vendor_id, product_id, product_title, discount_percent) VALUES (?,?,?,?,?)",
            (cid, session["vendor_id"], pid, title, disc),
        )
    db.commit()
    
    return jsonify({"ok": True, "count": len(set(cleaned))})

# Admin view of selections (with discounts)
@app.route("/api/admin/campaigns/<int:cid>/selections")
def api_admin_campaign_selections(cid: int):
    ensure_admin()
    db = get_db()
    rows = db.execute(
        "SELECT vendor_id, product_id, product_title, discount_percent FROM campaign_items WHERE campaign_id=? ORDER BY vendor_id",
        (cid,)
    ).fetchall()
    out = {}
    for r in rows:
        title = r["product_title"] if r["product_title"] else f"Product {r['product_id']}"
        out.setdefault(r["vendor_id"], []).append({
            "product_id": r["product_id"], 
            "discount": r["discount_percent"] or 0,
            "title": title
        })
    return jsonify(out)

# Admin API to get products from all vendors (for admin view)
@app.route("/api/admin/all-products")
def api_admin_all_products():
    ensure_admin()
    # This is a placeholder - in a real scenario, you'd need to fetch from all vendors
    # or have a centralized product database. For now, we'll return an empty structure
    # since we don't have access to other vendors' tokens
    return jsonify({"data": [], "message": "Admin product aggregation not implemented"})

# Admin CSV download for campaign products
@app.route("/api/admin/campaigns/<int:cid>/export-csv")
def api_admin_export_csv(cid: int):
    ensure_admin()
    db = get_db()
    
    # Get campaign info
    campaign = db.execute("SELECT * FROM campaigns WHERE id=?", (cid,)).fetchone()
    if not campaign:
        abort(404)
    
    # Get all products with vendor info
    rows = db.execute("""
        SELECT vendor_id, product_id, product_title, discount_percent 
        FROM campaign_items 
        WHERE campaign_id=? 
        ORDER BY vendor_id, product_id
    """, (cid,)).fetchall()
    
    if not rows:
        abort(404, description="No products found for this campaign")
    
    # Use stored product titles from database
    product_details = {}
    for row in rows:
        product_details[row['product_id']] = row['product_title'] if row['product_title'] else f"Product {row['product_id']}"
    
    # Create CSV data
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Product ID', 'Title', 'Vendor ID', 'Discount (%)'])
    
    # Write data
    for row in rows:
        writer.writerow([
            row['product_id'],
            product_details.get(row['product_id'], f"Product {row['product_id']}"),
            row['vendor_id'],
            row['discount_percent'] or 0
        ])
    
    # Convert to bytes for send_file
    csv_content = output.getvalue()
    output_bytes = BytesIO(csv_content.encode('utf-8'))
    output_bytes.seek(0)
    
    filename = f"campaign_{cid}_products_{date.today()}.csv"
    return send_file(
        output_bytes,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

@app.route("/dashboard")
def dashboard():
    return redirect(url_for("welcome"))

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
