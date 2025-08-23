# Basalam Vendor Portal 🏪

پنل مدیریت غرفه‌داران باسلام - مدیریت کمپین‌ها و محصولات با رابط کاربری مدرن

## ✨ ویژگی‌های جدید

### 🎨 **UI/UX بهبود یافته**
- طراحی مدرن با رنگ‌بندی حرفه‌ای
- انیمیشن‌ها و transitions نرم
- Responsive design کامل برای موبایل و تبلت
- Loading states و feedback بصری
- Accessibility بهبود یافته

### 📱 **Responsive Design**
- سازگار با تمام دستگاه‌ها
- Grid layout تطبیقی
- Typography بهینه‌شده
- Touch-friendly interface

### ⚡ **عملکرد بهتر**
- Service Worker برای PWA
- Caching هوشمند
- Keyboard shortcuts
- Auto-focus و navigation بهتر

### 🔍 **جستجو و فیلتر**
- جستجوی real-time در کمپین‌ها
- جستجو در محصولات با debounce
- نمایش تعداد نتایج
- فیلترهای پیشرفته

### 📊 **مدیریت داده**
- دانلود CSV از انتخاب‌های غرفه‌دارها
- نمایش بهتر محصولات انتخاب شده
- مدیریت تخفیف‌ها
- Validation پیشرفته

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Python 3.8+
- pip

### مراحل نصب

1. **Clone پروژه:**
```bash
git clone <repository-url>
cd basalam_vendor_portal
```

2. **نصب dependencies:**
```bash
pip install -r requirements.txt
```

3. **تنظیم متغیرهای محیطی:**
```bash
# فایل .env ایجاد کنید
BASALAM_CLIENT_ID=your_client_id
BASALAM_CLIENT_SECRET=your_client_secret
BASALAM_REDIRECT_URI=http://localhost:5000/auth/callback
FLASK_SECRET=your_secret_key
```

4. **اجرای برنامه:**
```bash
python app.py
```

5. **دسترسی به برنامه:**
```
http://localhost:5000
```

## 📁 ساختار پروژه

```
basalam_vendor_portal/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # مستندات
├── .env                  # متغیرهای محیطی
├── app.db               # SQLite database
├── static/
│   ├── style.css        # Modern CSS styles
│   ├── vendor-ui.js     # Enhanced JavaScript
│   └── sw.js           # Service Worker
└── templates/
    ├── base.html        # Base template
    ├── index.html       # Home page
    ├── login.html       # Login page
    ├── dashboard.html   # Dashboard
    └── campaign_detail.html # Campaign details
```

## 🎯 ویژگی‌های کلیدی

### 👤 **احراز هویت**
- OAuth 2.0 با باسلام
- Session management امن
- Admin access با شماره تلفن

### 📋 **مدیریت کمپین‌ها**
- ایجاد کمپین جدید (ادمین)
- مشاهده کمپین‌های فعال
- جستجو در کمپین‌ها
- نمایش وضعیت و زمان باقی‌مانده

### 🛍️ **انتخاب محصولات**
- انتخاب محصولات برای کمپین
- تنظیم درصد تخفیف (حداقل 3%)
- جستجو در محصولات
- نمایش تعداد انتخاب‌ها

### 📊 **پنل ادمین**
- مشاهده انتخاب‌های همه غرفه‌دارها
- دانلود CSV از انتخاب‌ها
- مدیریت کامل کمپین‌ها

## 🎨 طراحی و UX

### رنگ‌بندی
- **Primary:** `#6366f1` (Indigo)
- **Accent:** `#10b981` (Emerald)
- **Background:** `#0a0a0f` (Dark)
- **Card:** `#1a1a2e` (Dark Blue)

### Typography
- **Font:** Vazirmatn, IRANSans
- **Responsive:** 14px base, scalable
- **Hierarchy:** Clear heading levels

### Animations
- **Transitions:** 0.2s cubic-bezier
- **Hover effects:** Subtle transforms
- **Loading states:** Smooth spinners

## 📱 Responsive Breakpoints

- **Desktop:** > 768px
- **Tablet:** 480px - 768px
- **Mobile:** < 480px

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + K:** Focus search
- **Escape:** Close modals
- **Enter:** Submit forms

## 🔧 تنظیمات پیشرفته

### Environment Variables
```bash
BASALAM_CLIENT_ID=your_client_id
BASALAM_CLIENT_SECRET=your_client_secret
BASALAM_REDIRECT_URI=http://localhost:5000/auth/callback
BASALAM_SCOPES=customer.profile.read vendor.product.read
FLASK_SECRET=your_secret_key
```

### Admin Access
برای دسترسی ادمین، شماره تلفن خود را در `ADMIN_PHONES` در `app.py` اضافه کنید.

## 🐛 عیب‌یابی

### مشکلات رایج

1. **خطای pandas:**
```bash
pip install pandas openpyxl
```

2. **خطای OAuth:**
- بررسی صحت CLIENT_ID و CLIENT_SECRET
- تنظیم REDIRECT_URI صحیح

3. **خطای Database:**
- حذف فایل `app.db` و اجرای مجدد

## 📈 بهبودهای آینده

- [ ] PWA کامل با offline support
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Export to Excel
- [ ] API documentation
- [ ] Unit tests

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید ایجاد کنید
3. تغییرات را commit کنید
4. Pull request ارسال کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

**توسعه‌دهنده:** Basalam Team  
**نسخه:** 2.0.0  
**آخرین به‌روزرسانی:** 2024
