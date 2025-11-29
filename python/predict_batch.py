"""
Батч-обробка передбачень для кількох квартир одночасно
Оптимізовано: завантажує модель і CSV тільки один раз
"""
import joblib
import pandas as pd
import sys
import json
import os

# Встановлюємо UTF-8 для stdout (для Windows сумісності)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Отримуємо директорію, де знаходиться скрипт
script_dir = os.path.dirname(os.path.abspath(__file__))

# Завантажуємо модель один раз (шлях відносно місця розташування скрипта)
model_path = os.path.join(script_dir, 'models', 'price_model.pkl')
print("Завантаження моделі...", file=sys.stderr)
model = joblib.load(model_path)
print("Модель завантажено", file=sys.stderr)

# Завантажуємо CSV з тарифами один раз (python тепер в корені, data2025 в server/data2025)
# В Docker: python в /python, data2025 в /app/server/data2025
csv_path = os.path.join(script_dir, '..', 'server', 'data2025', 'tarifPrice.csv')
if not os.path.exists(csv_path):
    csv_path = os.path.join('/app', 'server', 'data2025', 'tarifPrice.csv')
print("Завантаження CSV з тарифами...", file=sys.stderr)
tarif_df = pd.read_csv(csv_path, header=None,
                       names=["room_id","room","date","price_tarif"])
tarif_df["room"] = tarif_df["room"].astype(str).str.strip()
tarif_df["date"] = pd.to_datetime(tarif_df["date"], dayfirst=True, errors='coerce')
tarif_df = tarif_df.dropna(subset=["date","price_tarif"])
print(f"CSV завантажено: {len(tarif_df)} рядків", file=sys.stderr)

# Перевірка аргументів
if len(sys.argv) < 2:
    print(json.dumps({"error": "Usage: python predict_batch.py <json_array>"}))
    sys.exit(1)

# Парсимо JSON з масивом квартир
try:
    input_data = json.loads(sys.argv[1])
except json.JSONDecodeError:
    print(json.dumps({"error": "Invalid JSON input"}))
    sys.exit(1)

if not isinstance(input_data, list):
    print(json.dumps({"error": "Input must be an array"}))
    sys.exit(1)

results = []

print(f"Обробка {len(input_data)} квартир...", file=sys.stderr)

for item in input_data:
    room_name = item.get('roomName')
    input_price = float(item.get('price', 0))
    date_input = item.get('date')
    
    if not room_name or not date_input:
        results.append({
            "room": room_name or "unknown",
            "error": "Missing roomName or date"
        })
        continue
    
    try:
        # Беремо тариф для цієї кімнати і дати
        date = pd.to_datetime(date_input)
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
        
        results.append({
            "room": room_name,
            "input_price": input_price,
            "tarif_price": round(tarif_price_input, 2),
            "predicted_price": round(predicted_price, 2),
            "coefficient": round(coefficient, 2) if coefficient else None
        })
    except Exception as e:
        results.append({
            "room": room_name,
            "error": str(e)
        })

# Виводимо результат як JSON
# Використовуємо ensure_ascii=True для уникнення проблем з кодуванням на Windows
# Кирилиця буде в escape-послідовностях, але Node.js правильно її розпарсить
try:
    json_output = json.dumps(results, ensure_ascii=False)
    # Для Windows: використовуємо buffer для безпечного виводу
    if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
        sys.stdout.buffer.write(json_output.encode('utf-8'))
        sys.stdout.buffer.write(b'\n')
        sys.stdout.buffer.flush()
    else:
        print(json_output)
        sys.stdout.flush()
except Exception as e:
    # Якщо все ще є проблеми, використовуємо ASCII
    json_output = json.dumps(results, ensure_ascii=True)
    print(json_output)
    sys.stdout.flush()

