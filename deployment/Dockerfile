FROM python:3.12-slim
RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY deployment/requirements-deploy.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appuser engine /app/engine
USER appuser
ENV PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["python", "-m", "uvicorn", "engine.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
