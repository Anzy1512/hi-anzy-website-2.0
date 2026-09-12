# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Unbuffered so logs reach docker logs as they happen rather than on flush.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as a non-root user. The image needs nothing writable at runtime.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3).status==200 else 1)"

# Bound to 0.0.0.0 inside the container only; compose maps it to loopback on
# the host, so it is not published to the network.
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
