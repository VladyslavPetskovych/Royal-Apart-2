import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Шляхи до CSV

real_csv = "../data2025/realPrice.csv"
tarif_csv = "../data2025/tarifPrice.csv"
model_path = "models/price_model.pkl"

# Перевірка наявності CSV

if not os.path.exists(real_csv):
    raise FileNotFoundError(f"{real_csv} not found")
if not os.path.exists(tarif_csv):
    raise FileNotFoundError(f"{tarif_csv} not found")

# Читаємо дані без заголовків та задаємо назви колонок

tarif_df = pd.read_csv(tarif_csv, header=None, names=["room_id", "room", "date", "price_tarif"])
real_df = pd.read_csv(real_csv, header=None, names=["room_id", "room", "date", "price_real"])

# Очищуємо пробіли та перетворюємо типи

tarif_df["room"] = tarif_df["room"].astype(str).str.strip()
real_df["room"] = real_df["room"].astype(str).str.strip()

# Приводимо дати до datetime

tarif_df["date"] = pd.to_datetime(tarif_df["date"], dayfirst=True, errors='coerce')
real_df["date"] = pd.to_datetime(real_df["date"], dayfirst=True, errors='coerce')

# Видаляємо рядки з некоректними датами

tarif_df = tarif_df.dropna(subset=["date"])
real_df = real_df.dropna(subset=["date"])

# Перетворюємо ціни на числа

tarif_df["price_tarif"] = pd.to_numeric(tarif_df["price_tarif"], errors='coerce')
real_df["price_real"] = pd.to_numeric(real_df["price_real"], errors='coerce')

# Об'єднуємо за кімнатою та датою

df = pd.merge(tarif_df, real_df, on=["room", "date"], how="left", suffixes=("_tarif", "_real"))

# Генеруємо прості фічі

df["day_of_week"] = df["date"].dt.dayofweek
df["tarif_price"] = df["price_tarif"]

# Створюємо таргет і замінюємо пропуски

df["target"] = df["price_real"].fillna(df["tarif_price"])

# Видаляємо рядки, де target все ще NaN

df = df.dropna(subset=["target"])

# Вибираємо ознаки та ціль

features = ["tarif_price", "day_of_week"]
X = df[features].fillna(0)
y = df["target"]

# Логування для перевірки

print(f"Rows after cleaning: {len(df)}")
print("NaN in features:\n", X.isna().sum())
print("NaN in target:", y.isna().sum())

# Тренуємо модель

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Створюємо папку models, якщо її нема

os.makedirs(os.path.dirname(model_path), exist_ok=True)

# Зберігаємо модель

joblib.dump(model, model_path)
print(f"Model trained and saved to {model_path}")
