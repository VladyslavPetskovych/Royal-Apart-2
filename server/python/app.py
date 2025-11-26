import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime, timedelta
import json

# Шляхи до файлів
REAL_CSV = "../data2025/realPrice.csv"
TARIF_CSV = "../data2025/tarifPrice.csv"
REAL_DAILY_CACHE = "../data2025/realPrice_daily.csv"  # Кеш конвертованих даних
MODEL_DIR = "models"
PRICE_NORMALITY_MODEL = os.path.join(MODEL_DIR, "price_normality_model.pkl")
PRICE_PREDICTION_MODEL = os.path.join(MODEL_DIR, "price_prediction_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)


def load_tarif_data():
    """Завантажує дані тарифів"""
    try:
        # Спробуємо різні кодування
        encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'latin-1']
        df = None
        
        for encoding in encodings:
            try:
                # Спробуємо прочитати з заголовками
                df = pd.read_csv(TARIF_CSV, encoding=encoding)
                if 'price' in df.columns or 'Price' in df.columns:
                    price_col = 'price' if 'price' in df.columns else 'Price'
                    date_col = 'date' if 'date' in df.columns else 'Date'
                    room_col = 'roomName' if 'roomName' in df.columns else 'room'
                    
                    df = df.rename(columns={
                        price_col: 'price_tarif',
                        date_col: 'date',
                        room_col: 'room'
                    })
                    break
                elif len(df.columns) == 4:
                    # Читаємо без заголовків
                    df = pd.read_csv(TARIF_CSV, header=None, names=["room_id", "room", "date", "price_tarif"], encoding=encoding)
                    break
            except (UnicodeDecodeError, pd.errors.EmptyDataError):
                continue
        
        if df is None or len(df) == 0:
            # Остання спроба - без заголовків
            df = pd.read_csv(TARIF_CSV, header=None, names=["room_id", "room", "date", "price_tarif"], encoding='latin-1')
        
        df["room"] = df["room"].astype(str).str.strip()
        df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors='coerce')
        df["price_tarif"] = pd.to_numeric(df["price_tarif"], errors='coerce')
        
        # Видаляємо рядки де ціна порожня або 0
        df = df.dropna(subset=["date"])
        df = df[df["price_tarif"].notna() & (df["price_tarif"] > 0)]
        
        return df
    except Exception as e:
        print(f"Помилка завантаження тарифів: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def load_real_data(use_cache=True):
    """Завантажує дані реальних бронювань та розбиває на дні з ціною за день"""
    try:
        # Перевіряємо чи є кеш
        if use_cache and os.path.exists(REAL_DAILY_CACHE):
            try:
                cache_df = pd.read_csv(REAL_DAILY_CACHE)
                if 'room' in cache_df.columns and 'date' in cache_df.columns and 'price_real' in cache_df.columns:
                    cache_df['date'] = pd.to_datetime(cache_df['date'], dayfirst=True, errors='coerce')
                    cache_df['room'] = cache_df['room'].astype(str).str.strip()
                    cache_df['price_real'] = pd.to_numeric(cache_df['price_real'], errors='coerce')
                    cache_df = cache_df.dropna(subset=["date", "price_real"])
                    print(f"Завантажено з кешу: {len(cache_df)} днів")
                    return cache_df
            except Exception as e:
                print(f"Помилка завантаження кешу, продовжуємо з оригінальним файлом: {e}")
        
        # Спробуємо різні кодування та роздільники
        encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'latin-1']
        delimiters = [';', ',', '\t']
        df = None
        
        for encoding in encodings:
            for delimiter in delimiters:
                try:
                    df = pd.read_csv(REAL_CSV, encoding=encoding, delimiter=delimiter)
                    if len(df.columns) > 5:  # Перевіряємо що файл прочитався правильно
                        break
                except:
                    continue
            if df is not None and len(df.columns) > 5:
                break
        
        if df is None:
            # Остання спроба
            df = pd.read_csv(REAL_CSV, encoding='latin-1', delimiter=';')
        
        # Перевіряємо чи файл вже в форматі day-by-day (має колонки room, date, price_real)
        if 'room' in df.columns and 'date' in df.columns and 'price_real' in df.columns:
            # Файл вже конвертований, просто обробляємо
            df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
            df['room'] = df['room'].astype(str).str.strip()
            df['price_real'] = pd.to_numeric(df['price_real'], errors='coerce')
            df = df.dropna(subset=["date", "price_real"])
            # Зберігаємо в кеш
            if use_cache:
                df.to_csv(REAL_DAILY_CACHE, index=False)
            return df
        
        # Якщо файл в оригінальному форматі (з From, To, Price, Nights)
        # Розбиваємо бронювання на дні
        
        # Обробка дат
        if 'From' in df.columns and 'To' in df.columns:
            df['From'] = pd.to_datetime(df['From'], dayfirst=True, errors='coerce')
            df['To'] = pd.to_datetime(df['To'], dayfirst=True, errors='coerce')
        else:
            print("Помилка: не знайдено колонок From/To або файл вже в форматі day-by-day")
            return pd.DataFrame()
        
        # Обробка кімнат
        if 'Room Name' in df.columns:
            df['room'] = df['Room Name'].astype(str).str.strip()
        elif 'room' in df.columns:
            df['room'] = df['room'].astype(str).str.strip()
        else:
            print("Помилка: не знайдено колонку з назвою кімнати")
            return pd.DataFrame()
        
        # Обчислюємо ціну за день
        if 'Room daily price' in df.columns:
            df['price_per_day'] = pd.to_numeric(df['Room daily price'], errors='coerce')
        elif 'Price' in df.columns and 'Nights' in df.columns:
            df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
            df['Nights'] = pd.to_numeric(df['Nights'], errors='coerce')
            df['price_per_day'] = df['Price'] / df['Nights']
        else:
            print("Помилка: не знайдено колонки для розрахунку ціни за день")
            return pd.DataFrame()
        
        # Видаляємо рядки без дат або ціни
        df = df.dropna(subset=["From", "To", "price_per_day"])
        df = df[df['price_per_day'] > 0]
        
        # Розбиваємо кожне бронювання на окремі дні
        daily_rows = []
        
        for idx, row in df.iterrows():
            start_date = row['From']
            end_date = row['To']
            room = row['room']
            daily_price = row['price_per_day']
            
            if pd.isna(start_date) or pd.isna(end_date) or pd.isna(daily_price):
                continue
            
            # Генеруємо рядок для кожного дня бронювання
            current_date = start_date
            while current_date < end_date:
                daily_rows.append({
                    'room': room,
                    'date': current_date,
                    'price_real': daily_price
                })
                current_date += timedelta(days=1)
        
        # Створюємо DataFrame з денними даними
        daily_df = pd.DataFrame(daily_rows)
        
        if len(daily_df) == 0:
            print("Попередження: не вдалося створити денні дані")
            return pd.DataFrame()
        
        # Видаляємо дублікати (якщо є)
        daily_df = daily_df.drop_duplicates(subset=['room', 'date'])
        
        print(f"Розбито {len(df)} бронювань на {len(daily_df)} днів")
        
        # Зберігаємо в кеш для швидшої роботи в майбутньому
        if use_cache:
            daily_df.to_csv(REAL_DAILY_CACHE, index=False)
            print(f"Збережено конвертовані дані в {REAL_DAILY_CACHE}")
        
        return daily_df
        
    except Exception as e:
        print(f"Помилка завантаження реальних даних: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def find_similar_bookings(tarif_row, real_df, days_window=30, price_tolerance=None):
    """
    Знаходить схожі бронювання у realPrice
    Спочатку шукає за кімнатою та датою, потім аналізує ціни
    
    Args:
        tarif_row: рядок з тарифом (room, date, price_tarif)
        real_df: DataFrame з реальними бронюваннями
        days_window: вікно днів для пошуку (±days_window)
        price_tolerance: толерантність ціни (None = не фільтруємо за ціною)
    
    Returns:
        DataFrame зі схожими бронюваннями
    """
    room = tarif_row['room']
    date = tarif_row['date']
    price = tarif_row['price_tarif']
    
    # Фільтруємо за кімнатою (більш гнучкий пошук)
    # Спробуємо точний збіг, потім частковий
    room_exact = real_df[real_df['room'].str.strip() == room.strip()]
    if len(room_exact) == 0:
        # Частковий збіг
        room_matches = real_df[real_df['room'].str.contains(room, case=False, na=False, regex=False)]
    else:
        room_matches = room_exact
    
    if len(room_matches) == 0:
        return pd.DataFrame()
    
    # Фільтруємо за датою (±days_window днів)
    date_start = date - timedelta(days=days_window)
    date_end = date + timedelta(days=days_window)
    date_matches = room_matches[
        (room_matches['date'] >= date_start) & 
        (room_matches['date'] <= date_end)
    ]
    
    if len(date_matches) == 0:
        return pd.DataFrame()
    
    # Якщо вказано толерантність ціни - фільтруємо, інакше повертаємо всі
    if price_tolerance is not None:
        price_min = price * (1 - price_tolerance)
        price_max = price * (1 + price_tolerance)
        similar = date_matches[
            (date_matches['price_real'] >= price_min) & 
            (date_matches['price_real'] <= price_max)
        ]
    else:
        similar = date_matches
    
    return similar


def create_features(tarif_df, real_df):
    """
    Створює ознаки для навчання моделі
    """
    features_list = []
    
    for idx, row in tarif_df.iterrows():
        # Базові ознаки
        day_of_week = row['date'].dayofweek
        month = row['date'].month
        day_of_month = row['date'].day
        price_tarif = row['price_tarif']
        
        # Знаходимо схожі бронювання (без фільтрації за ціною для кращого покриття)
        similar = find_similar_bookings(row, real_df, days_window=30, price_tolerance=None)
        
        # Ознаки зі схожих бронювань
        if len(similar) > 0:
            avg_real_price = similar['price_real'].mean()
            min_real_price = similar['price_real'].min()
            max_real_price = similar['price_real'].max()
            median_real_price = similar['price_real'].median()
            std_real_price = similar['price_real'].std()
            count_similar = len(similar)
            
            # Відстань до найближчого бронювання
            date_diffs = abs((similar['date'] - row['date']).dt.days)
            min_date_diff = date_diffs.min() if len(date_diffs) > 0 else 30
        else:
            # Якщо не знайшли схожі, шукаємо всі бронювання цієї кімнати (ширший пошук)
            room_all = real_df[real_df['room'].str.contains(row['room'], case=False, na=False, regex=False)]
            if len(room_all) > 0:
                avg_real_price = room_all['price_real'].mean()
                min_real_price = room_all['price_real'].min()
                max_real_price = room_all['price_real'].max()
                median_real_price = room_all['price_real'].median()
                std_real_price = room_all['price_real'].std()
                count_similar = len(room_all)
                min_date_diff = 60  # Велика відстань якщо немає близьких дат
            else:
                avg_real_price = price_tarif
                min_real_price = price_tarif
                max_real_price = price_tarif
                median_real_price = price_tarif
                std_real_price = 0
                count_similar = 0
                min_date_diff = 60
        
        # Знаходимо реальну ціну для цієї кімнати і дати
        exact_match = real_df[
            (real_df['room'].str.contains(row['room'], case=False, na=False, regex=False)) &
            (real_df['date'] == row['date'])
        ]
        
        if len(exact_match) > 0:
            real_price = exact_match['price_real'].iloc[0]
            has_real_price = 1
        else:
            real_price = avg_real_price
            has_real_price = 0
        
        # Визначаємо чи ціна нормальна
        # Нормальна: ±15% від середньої реальної ціни
        # Низька: < -15%
        # Висока: > +15%
        if has_real_price:
            price_diff_pct = ((price_tarif - real_price) / real_price) * 100
            if price_diff_pct < -15:
                price_status = 0  # Низька
            elif price_diff_pct > 15:
                price_status = 2  # Висока
            else:
                price_status = 1  # Нормальна
        else:
            # Якщо немає точної ціни, порівнюємо з середньою схожих
            if count_similar > 0:
                price_diff_pct = ((price_tarif - avg_real_price) / avg_real_price) * 100
                if price_diff_pct < -15:
                    price_status = 0
                elif price_diff_pct > 15:
                    price_status = 2
                else:
                    price_status = 1
            else:
                price_status = 1  # За замовчуванням нормальна
        
        # Розрахунок втрачених коштів та оптимальної ціни
        if count_similar > 0:
            # Оптимальна ціна - медіана реальних цін (більш стійка до викидів)
            optimal_price = median_real_price
            
            # Втрачені кошти якщо тарифна ціна нижча за оптимальну
            if price_tarif < optimal_price:
                lost_revenue = optimal_price - price_tarif
                lost_revenue_pct = ((optimal_price - price_tarif) / optimal_price) * 100
            else:
                lost_revenue = 0
                lost_revenue_pct = 0
        else:
            optimal_price = price_tarif
            lost_revenue = 0
            lost_revenue_pct = 0
        
        features_list.append({
            'day_of_week': day_of_week,
            'month': month,
            'day_of_month': day_of_month,
            'price_tarif': price_tarif,
            'avg_real_price': avg_real_price,
            'median_real_price': median_real_price,
            'min_real_price': min_real_price,
            'max_real_price': max_real_price,
            'std_real_price': std_real_price if not pd.isna(std_real_price) else 0,
            'count_similar': count_similar,
            'min_date_diff': min_date_diff,
            'has_real_price': has_real_price,
            'price_status': price_status,
            'real_price': real_price,
            'optimal_price': optimal_price,
            'lost_revenue': lost_revenue,
            'lost_revenue_pct': lost_revenue_pct
        })
    
    return pd.DataFrame(features_list)


def train_models():
    """Навчає моделі машинного навчання"""
    print("Завантаження даних...")
    tarif_df = load_tarif_data()
    real_df = load_real_data()
    
    if len(tarif_df) == 0 or len(real_df) == 0:
        print("Помилка: не вдалося завантажити дані")
        return
    
    print(f"Завантажено {len(tarif_df)} рядків тарифів та {len(real_df)} рядків реальних бронювань")
    
    print("Створення ознак...")
    features_df = create_features(tarif_df, real_df)
    
    # Ознаки для моделі
    feature_cols = [
        'day_of_week', 'month', 'day_of_month', 'price_tarif',
        'avg_real_price', 'min_real_price', 'max_real_price', 
        'std_real_price', 'count_similar', 'min_date_diff', 'has_real_price'
    ]
    
    X = features_df[feature_cols].fillna(0)
    y_classification = features_df['price_status']  # Класифікація: 0=низька, 1=нормальна, 2=висока
    y_regression = features_df['real_price']  # Регресія для передбачення ціни
    
    # Нормалізація
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Розділення на тренувальну та тестову вибірки
    X_train, X_test, y_train_cls, y_test_cls, y_train_reg, y_test_reg = train_test_split(
        X_scaled, y_classification, y_regression, test_size=0.2, random_state=42
    )
    
    # Модель класифікації (нормальна/висока/низька)
    print("Навчання моделі класифікації...")
    clf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    clf_model.fit(X_train, y_train_cls)
    
    # Модель регресії (передбачення ціни)
    print("Навчання моделі регресії...")
    reg_model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    reg_model.fit(X_train, y_train_reg)
    
    # Збереження моделей
    joblib.dump(clf_model, PRICE_NORMALITY_MODEL)
    joblib.dump(reg_model, PRICE_PREDICTION_MODEL)
    joblib.dump(scaler, SCALER_PATH)
    
    # Оцінка моделей
    clf_score = clf_model.score(X_test, y_test_cls)
    reg_score = reg_model.score(X_test, y_test_reg)
    
    print(f"\nМоделі навчено та збережено!")
    print(f"Точність класифікації: {clf_score:.2%}")
    print(f"R² регресії: {reg_score:.2%}")
    
    return clf_model, reg_model, scaler


def predict_price_normality(room, date, price_tarif, real_df=None):
    """
    Передбачає чи ціна нормальна для заданої кімнати, дати та тарифу
    
    Returns:
        dict з результатами передбачення
    """
    # Завантажуємо моделі
    if not os.path.exists(PRICE_NORMALITY_MODEL):
        print("Моделі не навчено. Запустіть train_models() спочатку.")
        return None
    
    clf_model = joblib.load(PRICE_NORMALITY_MODEL)
    reg_model = joblib.load(PRICE_PREDICTION_MODEL)
    scaler = joblib.load(SCALER_PATH)
    
    # Завантажуємо дані якщо не передано
    if real_df is None:
        real_df = load_real_data()
    
    # Створюємо рядок тарифу
    tarif_row = pd.Series({
        'room': room,
        'date': pd.to_datetime(date, dayfirst=True),
        'price_tarif': price_tarif
    })
    
    # Знаходимо схожі бронювання (без фільтрації за ціною)
    similar = find_similar_bookings(tarif_row, real_df, days_window=30, price_tolerance=None)
    
    # Створюємо ознаки
    date_obj = tarif_row['date']
    day_of_week = date_obj.dayofweek
    month = date_obj.month
    day_of_month = date_obj.day
    
    if len(similar) > 0:
        avg_real_price = similar['price_real'].mean()
        median_real_price = similar['price_real'].median()
        min_real_price = similar['price_real'].min()
        max_real_price = similar['price_real'].max()
        std_real_price = similar['price_real'].std()
        count_similar = len(similar)
        date_diffs = abs((similar['date'] - date_obj).dt.days)
        min_date_diff = date_diffs.min()
    else:
        # Шукаємо всі бронювання цієї кімнати
        room_all = real_df[real_df['room'].str.contains(room, case=False, na=False, regex=False)]
        if len(room_all) > 0:
            avg_real_price = room_all['price_real'].mean()
            median_real_price = room_all['price_real'].median()
            min_real_price = room_all['price_real'].min()
            max_real_price = room_all['price_real'].max()
            std_real_price = room_all['price_real'].std()
            count_similar = len(room_all)
            min_date_diff = 60
        else:
            avg_real_price = price_tarif
            median_real_price = price_tarif
            min_real_price = price_tarif
            max_real_price = price_tarif
            std_real_price = 0
            count_similar = 0
            min_date_diff = 60
    
    # Перевіряємо точне співпадіння
    exact_match = real_df[
        (real_df['room'].str.contains(room, case=False, na=False, regex=False)) &
        (real_df['date'] == date_obj)
    ]
    has_real_price = 1 if len(exact_match) > 0 else 0
    
    # Розрахунок оптимальної ціни та втрачених коштів
    if count_similar > 0:
        optimal_price = median_real_price  # Медіана більш стійка до викидів
        if price_tarif < optimal_price:
            lost_revenue = optimal_price - price_tarif
            lost_revenue_pct = ((optimal_price - price_tarif) / optimal_price) * 100
        else:
            lost_revenue = 0
            lost_revenue_pct = 0
    else:
        optimal_price = price_tarif
        lost_revenue = 0
        lost_revenue_pct = 0
    
    # Формуємо ознаки (використовуємо avg_real_price для сумісності з моделлю)
    features = np.array([[
        day_of_week, month, day_of_month, price_tarif,
        avg_real_price, min_real_price, max_real_price,
        std_real_price if not pd.isna(std_real_price) else 0,
        count_similar, min_date_diff, has_real_price
    ]])
    
    # Нормалізуємо
    features_scaled = scaler.transform(features)
    
    # Передбачення
    price_status = clf_model.predict(features_scaled)[0]
    predicted_price = reg_model.predict(features_scaled)[0]
    price_proba = clf_model.predict_proba(features_scaled)[0]
    
    status_names = {0: "Низька", 1: "Нормальна", 2: "Висока"}
    
    result = {
        'room': room,
        'date': date_obj.strftime('%d/%m/%Y'),
        'price_tarif': round(price_tarif, 2),
        'predicted_price': round(predicted_price, 2),
        'status': status_names[price_status],
        'status_code': int(price_status),
        'confidence': {
            'low': round(price_proba[0] * 100, 2),
            'normal': round(price_proba[1] * 100, 2),
            'high': round(price_proba[2] * 100, 2)
        },
        'similar_bookings_count': int(count_similar),
        'avg_similar_price': round(avg_real_price, 2) if count_similar > 0 else None,
        'median_similar_price': round(median_real_price, 2) if count_similar > 0 else None,
        'optimal_price': round(optimal_price, 2) if count_similar > 0 else None,
        'lost_revenue': round(lost_revenue, 2) if lost_revenue > 0 else 0,
        'lost_revenue_pct': round(lost_revenue_pct, 2) if lost_revenue > 0 else 0,
        'price_range': {
            'min': round(min_real_price, 2) if count_similar > 0 else None,
            'max': round(max_real_price, 2) if count_similar > 0 else None
        },
        'warning': f'⚠️ Втрачено {round(lost_revenue, 2)} грн ({round(lost_revenue_pct, 2)}%)' if lost_revenue > 0 else None
    }
    
    return result


if __name__ == "__main__":
    print("=== Навчання моделей машинного навчання ===")
    train_models()
    
    print("\n=== Приклад використання ===")
    # Приклад передбачення
    if os.path.exists(PRICE_NORMALITY_MODEL):
        result = predict_price_normality(
            room="Кімната 23",
            date="01/09/2024",
            price_tarif=3000
        )
        if result:
            print(json.dumps(result, indent=2, ensure_ascii=False))
