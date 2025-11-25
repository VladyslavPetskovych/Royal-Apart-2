import joblib
import pandas as pd
import sys
import json

# Перевірка аргументів
if len(sys.argv) < 3:
    print("Usage: python predict_price.py <room_name> <input_price> [<date>]")
    sys.exit(1)

room_name = sys.argv[1]
input_price = float(sys.argv[2])
date_input = sys.argv[3] if len(sys.argv) > 3 else None

# Завантажуємо модель
model = joblib.load('models/price_model.pkl')

# Завантажуємо CSV з тарифами
tarif_df = pd.read_csv('../data2025/tarifPrice.csv', header=None,
                       names=["room_id","room","date","price_tarif"])
tarif_df["room"] = tarif_df["room"].astype(str).str.strip()
tarif_df["date"] = pd.to_datetime(tarif_df["date"], dayfirst=True, errors='coerce')
tarif_df = tarif_df.dropna(subset=["date","price_tarif"])

# Беремо тариф для цієї кімнати і дати
date = pd.to_datetime(date_input)
tarif_row = tarif_df[(tarif_df["room"] == room_name) & (tarif_df["date"] == date)]
if len(tarif_row) == 0:
    tarif_price_input = tarif_df[tarif_df["room"]==room_name]["price_tarif"].mean()
else:
    tarif_price_input = tarif_row.iloc[0]["price_tarif"]

# Формуємо ознаки для моделі
day_of_week = date.dayofweek
X_new = pd.DataFrame([{"tarif_price": tarif_price_input, "day_of_week": day_of_week}])

# Прогноз
predicted_price = model.predict(X_new)[0]
coefficient = input_price / predicted_price if predicted_price != 0 else None

print(json.dumps({
    "room": room_name,
    "input_price": input_price,
    "tarif_price": round(tarif_price_input,2),
    "predicted_price": round(predicted_price,2),
    "coefficient": round(coefficient,2) if coefficient else None
}))
