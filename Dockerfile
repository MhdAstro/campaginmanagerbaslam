# syntax=docker/dockerfile:1.6

# 1. Base Image
FROM python:3.12-slim

# 2. Environment Variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set Working Directory
WORKDIR /app

# 4. Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# 5. Copy Application Code
# This copies everything EXCEPT what's in .dockerignore
COPY . .

# 6. Create a non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 7. Expose the port Gunicorn will run on
EXPOSE 8000

# 8. Run the application (using your app.py file)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]