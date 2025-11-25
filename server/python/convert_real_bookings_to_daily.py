import pandas as pd

input_csv = "../data2025/realPrice.csv"       # твій файл з колонками Price, From, To
output_csv = "../data2025/realPrice.csv"     # файл у форматі day-by-day

df = pd.read_csv(input_csv, delimiter=';')

# Приводимо дати
df["From"] = pd.to_datetime(df["From"], dayfirst=True, errors='coerce')
df["To"] = pd.to_datetime(df["To"], dayfirst=True, errors='coerce')

rows = []

for _, row in df.iterrows():
    room = row["Room Name"]
    price_total = row["Price"]
    start = row["From"]
    end = row["To"]
    nights = row["Nights"]

    if pd.isna(start) or pd.isna(end) or nights == 0:
        continue

    daily_price = price_total / nights

    for i in range(int(nights)):
        day = start + pd.Timedelta(days=i)
        rows.append({
            "room": room,
            "date": day.strftime("%d/%m/%Y"),
            "price_real": daily_price
        })

daily_df = pd.DataFrame(rows)
daily_df.to_csv(output_csv, index=False, header=False)

print(f"Created day-by-day file: {output_csv}")
