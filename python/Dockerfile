FROM python:3.12-slim

WORKDIR /python

COPY requirements-ml.txt ./
RUN pip install --no-cache-dir -r requirements-ml.txt

COPY . .

CMD ["python", "-u", "ml_price_check.py", "--loop"]
