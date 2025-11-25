# train_model.py
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os

# Створюємо папку models всередині поточної папки
os.makedirs("models", exist_ok=True)

# Приклад даних для навчання
data = pd.DataFrame({
    "tarif_price": [100, 120, 80, 90, 110],
    "day_of_week": [0, 1, 2, 3, 4],
    "real_price": [105, 115, 85, 95, 112]
})

X = data[["tarif_price", "day_of_week"]]
y = data["real_price"]

model = LinearRegression()
model.fit(X, y)

# Зберігаємо модель в папку models
joblib.dump(model, "models/price_model.pkl")
print("Модель збережена у python/models/price_model.pkl")
