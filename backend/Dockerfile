FROM python:3.11-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml .

RUN uv venv && uv pip install -r pyproject.toml

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["uv", "run", "flask", "run", "--host", "0.0.0.0"]