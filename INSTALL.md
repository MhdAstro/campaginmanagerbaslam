# راهنمای نصب و اجرا

## پیش‌نیازها
- Python 3.7 یا بالاتر
- pip (مدیر بسته‌های Python)

## مراحل نصب

### 1. فعال‌سازی محیط مجازی
```bash
# در ویندوز
venv\Scripts\activate

# در لینوکس/مک
source venv/bin/activate
```

### 2. نصب وابستگی‌ها
```bash
pip install -r requirements.txt
```

### 3. تنظیم فایل .env
```bash
# کپی کردن فایل نمونه
cp .env.example .env

# ویرایش فایل .env و اضافه کردن مقادیر:
BASALAM_CLIENT_ID=your_client_id
BASALAM_CLIENT_SECRET=your_client_secret
BASALAM_REDIRECT_URI=http://localhost:5000/auth/callback
FLASK_SECRET=your_secret_key
```

### 4. اجرای برنامه
```bash
python app.py
```

### 5. دسترسی به برنامه
در مرورگر به آدرس زیر بروید:
```
http://localhost:5000
```

## ویژگی‌های جدید

### پنل مدیریت
- **دانلود CSV**: دکمه "دانلود CSV" در پنل مدیریت برای دانلود محصولات کمپین
- **نمایش بهتر**: محصولات با عنوان کامل نمایش داده می‌شوند

### پنل وندور
- **رفع باگ**: محصولات انتخاب شده بلافاصله بعد از ذخیره نمایش داده می‌شوند

## عیب‌یابی

### خطای "ModuleNotFoundError"
اگر با خطای `ModuleNotFoundError` مواجه شدید:
```bash
pip install -r requirements.txt
```

### خطای "Invalid URL"
اگر با خطای "Invalid URL" مواجه شدید:
1. مطمئن شوید که برنامه روی `http://localhost:5000` اجرا می‌شود
2. فایل `.env` را بررسی کنید
3. مطمئن شوید که `BASALAM_REDIRECT_URI` درست تنظیم شده

### خطای "No module named 'pandas'"
این خطا دیگر رخ نمی‌دهد چون از CSV به جای Excel استفاده می‌کنیم.

