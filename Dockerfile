# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

# سرعت و پایداری پایتون/پیپ
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# (اختیاری) ابزارهای لازم برای healthcheck یا دیباگ
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# دایرکتوری اپ
WORKDIR /app

# مسیر سورس داخل ریپو (با توجه به زیپ شما)
ARG APP_DIR=basalam_vendor_portal/basalam_vendor_portal/basalam_vendor_portal

# اول فقط ریکوایرمنت‌ها تا لایه کش جدا باشد
COPY ${APP_DIR}/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# سپس کل سورس (به کمک .dockerignore حجم رو کم کنید)
COPY ${APP_DIR}/ /app/

# یوزر نان‌روت برای امنیت
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# پورت گونیکورن
EXPOSE 8000

# اجرای اپ با گونیکورن (ماژول: app.py، آبجکت: app)
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
