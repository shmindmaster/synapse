# ==========================================
# 🐍 Python 3.12 Backend (Context-Aware)
# ==========================================
# Build Context: Repo Root (App Platform builds from root)
# This Dockerfile assumes it's run from repository root, not apps/backend

FROM python:3.12-slim AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# ✅ COPY from Root Context logic
# We assume build context is Repo Root.
# Copy requirements from the specific subfolder to root of builder
COPY apps/backend/requirements.txt . 
RUN pip install --user --no-cache-dir -r requirements.txt

# Final Stage
FROM python:3.12-slim
WORKDIR /app

# Setup Path
ENV PATH=/home/appuser/.local/bin:$PATH
# ✅ CRITICAL: Allow Python to find 'apps.backend' imports
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    apt-get update && apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python packages
COPY --from=builder /root/.local /home/appuser/.local

# ✅ CRITICAL: Copy entire apps folder to maintain directory structure
# This allows "from apps.backend.src..." to work
COPY apps/ /app/apps/

# Fix permissions
RUN chown -R appuser:appuser /app

USER appuser
# Switch to the backend directory for execution
WORKDIR /app/apps/backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
