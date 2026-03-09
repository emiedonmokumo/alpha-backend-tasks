FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD python -m app.db.run_migrations up && \
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000