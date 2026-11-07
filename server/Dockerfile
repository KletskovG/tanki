FROM python:3.12-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /usr/local/bin/uv

WORKDIR /app

COPY . .
RUN uv sync --locked --python /usr/local/bin/python

CMD ["/app/.venv/bin/uvicorn", "main:app", "--host", "0.0.0.0"]
