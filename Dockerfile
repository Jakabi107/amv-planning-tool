FROM python:3.13-slim

WORKDIR /app

COPY *.html *.js *.css images/ ./

ENTRYPOINT ["python", "-m", "http.server", "8000"]