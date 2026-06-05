# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependencias del sistema
RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc libpq-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copiar todo el código fuente
WORKDIR /backend
COPY . .

# Instalar dependencias (outer + asthma-predictor-api)
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r app/asthma-predictor-api/requirements.txt

# Ejecutar la API principal desde su propio directorio
WORKDIR /backend/app/asthma-predictor-api
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
