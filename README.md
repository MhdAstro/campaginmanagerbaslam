# Basalam Vendor Portal (Flask)

پنل خیلی مینیمال برای ورود غرفه‌دار با SSO باسلام و دیدن محصولات خودش.
**هیچ بخش تاریخچهٔ کمپینی وجود ندارد.** همه‌چیز مستقیم با API باسلام کار می‌کند.

## اجرا

```bash
python -m venv venv
source venv/bin/activate   # یا venv\Scripts\activate روی ویندوز
pip install -r requirements.txt

cp .env.example .env
# مقادیر .env را با Client ID/Secret و Redirect URI خودت پر کن

python app.py
# سپس به http://localhost:5000 برو
```

## فایل‌ها
- app.py — مسیرهای OAuth و API
- templates/ — صفحات ساده login و dashboard
- static/vendor-ui.js — فراخوانی API و رندر لیست محصولات
- .env.example — نمونه تنظیمات

## اشاره به مستندات
- شروع توسعه و OAuth، users/me، products (v3/v4) — developers.basalam.com
# campaginmanagerbaslam
