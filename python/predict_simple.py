"""
Простий скрипт для передбачення ціни - використовує тільки навчені моделі
Без зайвих виводів, тільки JSON результат
Використання: python predict_simple.py <room_name> <input_price> <date>
"""
import joblib
import pandas as pd
import sys
import json
import os

# Прибираємо всі виводи в stderr
import warnings
warnings.filterwarnings('ignore')

# Отримуємо директорію, де знаходиться скрипт
script_dir = os.path.dirname(os.path.abspath(__file__))

# Перевірка аргументів
if len(sys.argv) < 4:
    error = json.dumps({"error": "Usage: python predict_simple.py <room_name> <input_price> <date>"})
    sys.stdout.buffer.write(error.encode('utf-8'))
    sys.stdout.buffer.write(b'\n')
    sys.exit(1)

room_name = sys.argv[1]
input_price = float(sys.argv[2])
date_input = sys.argv[3]  # Формат: DD/MM/YYYY

try:
    # Завантажуємо модель (шлях відносно місця розташування скрипта)
    model_path = os.path.join(script_dir, 'models', 'price_model.pkl')
    if not os.path.exists(model_path):
        error = json.dumps({"error": "Model file not found: price_model.pkl"})
        sys.stdout.buffer.write(error.encode('utf-8'))
        sys.stdout.buffer.write(b'\n')
        sys.exit(1)
    
    model = joblib.load(model_path)

    # Завантажуємо CSV з тарифами (python тепер в корені, data2025 в server/data2025)
    # В Docker: python в /python, data2025 в /app/server/data2025
    csv_path = os.path.join(script_dir, '..', 'server', 'data2025', 'tarifPrice.csv')
    if not os.path.exists(csv_path):
        csv_path = os.path.join('/app', 'server', 'data2025', 'tarifPrice.csv')
    if not os.path.exists(csv_path):
        error = json.dumps({"error": "CSV file not found: tarifPrice.csv"})
        sys.stdout.buffer.write(error.encode('utf-8'))
        sys.stdout.buffer.write(b'\n')
        sys.exit(1)
    
    tarif_df = pd.read_csv(csv_path, header=None,
                           names=["room_id","room","date","price_tarif"])
    tarif_df["room"] = tarif_df["room"].astype(str).str.strip()
    tarif_df["date"] = pd.to_datetime(tarif_df["date"], dayfirst=True, errors='coerce')
    tarif_df = tarif_df.dropna(subset=["date","price_tarif"])

    # Беремо тариф для цієї кімнати і дати
    date = pd.to_datetime(date_input, dayfirst=True)
    tarif_row = tarif_df[(tarif_df["room"] == room_name) & (tarif_df["date"] == date)]
    
    if len(tarif_row) == 0:
        # Якщо немає тарифу на цю дату, беремо середнє для цієї кімнати
        room_tarifs = tarif_df[tarif_df["room"] == room_name]["price_tarif"]
        if len(room_tarifs) > 0:
            tarif_price_input = room_tarifs.mean()
        else:
            tarif_price_input = 0
    else:
        tarif_price_input = tarif_row.iloc[0]["price_tarif"]

    # Формуємо ознаки для моделі
    day_of_week = date.dayofweek
    X_new = pd.DataFrame([{"tarif_price": tarif_price_input, "day_of_week": day_of_week}])

    # Прогноз
    predicted_price = model.predict(X_new)[0]
    coefficient = input_price / predicted_price if predicted_price != 0 else None

    result = {
        "room": room_name,
        "input_price": input_price,
        "tarif_price": round(tarif_price_input, 2),
        "predicted_price": round(predicted_price, 2),
        "coefficient": round(coefficient, 2) if coefficient else None
    }
    
    # Виводимо тільки JSON, без зайвих повідомлень
    json_output = json.dumps(result, ensure_ascii=False)
    sys.stdout.buffer.write(json_output.encode('utf-8'))
    sys.stdout.buffer.write(b'\n')
    sys.stdout.buffer.flush()
    
except Exception as e:
    error = json.dumps({"error": str(e)})
    sys.stdout.buffer.write(error.encode('utf-8'))
    sys.stdout.buffer.write(b'\n')
    sys.exit(1)

