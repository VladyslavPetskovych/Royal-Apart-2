"""
Flask сервер для швидкого передбачення цін
Завантажує модель один раз при старті, обслуговує HTTP запити
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import sys

app = Flask(__name__)
CORS(app)  # Дозволяємо запити з інших доменів

# Отримуємо директорію, де знаходиться скрипт
script_dir = os.path.dirname(os.path.abspath(__file__))

# Глобальні змінні для моделі та даних
model = None
tarif_df = None

def load_model_and_data():
    """Завантажує модель і дані один раз при старті"""
    global model, tarif_df
    
    print("Завантаження моделі...", file=sys.stderr)
    model_path = os.path.join(script_dir, 'models', 'price_model.pkl')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    model = joblib.load(model_path)
    print("Модель завантажена", file=sys.stderr)
    
    print("Завантаження CSV з тарифами...", file=sys.stderr)
    # python тепер в корені, data2025 в server/data2025
    # В Docker: python в /python, data2025 в /app/server/data2025
    csv_path = os.path.join(script_dir, '..', 'server', 'data2025', 'tarifPrice.csv')
    if not os.path.exists(csv_path):
        csv_path = os.path.join('/app', 'server', 'data2025', 'tarifPrice.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    
    tarif_df = pd.read_csv(csv_path, header=None,
                           names=["room_id","room","date","price_tarif"])
    tarif_df["room"] = tarif_df["room"].astype(str).str.strip()
    tarif_df["date"] = pd.to_datetime(tarif_df["date"], dayfirst=True, errors='coerce')
    tarif_df = tarif_df.dropna(subset=["date","price_tarif"])
    print(f"CSV завантажено: {len(tarif_df)} рядків", file=sys.stderr)

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Endpoint для передбачення ціни"""
    try:
        if request.method == 'GET':
            room_name = request.args.get('room')
            input_price = float(request.args.get('price', 0))
            date_input = request.args.get('date')
        else:
            data = request.get_json()
            room_name = data.get('room')
            input_price = float(data.get('price', 0))
            date_input = data.get('date')
        
        if not room_name or not date_input:
            return jsonify({"error": "room and date are required"}), 400
        
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
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Перевірка стану сервера"""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "data_loaded": tarif_df is not None
    })

if __name__ == '__main__':
    try:
        load_model_and_data()
        print("Сервер готовий до роботи!", file=sys.stderr)
        # Запускаємо на порту 5001 (щоб не конфліктувати з основним сервером)
        app.run(host='127.0.0.1', port=5001, debug=False)
    except Exception as e:
        print(f"Помилка запуску: {e}", file=sys.stderr)
        sys.exit(1)

