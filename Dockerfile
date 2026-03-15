FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir .

# Copy source code
COPY src/ src/
COPY config.yaml ./
COPY scripts/ scripts/

# Create data directory (will be overridden by Railway Volume)
RUN mkdir -p /data

ENV DATABASE_PATH=/data/research_bot.db
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn src.api.__main__:app --host 0.0.0.0 --port ${PORT:-8000}"]
