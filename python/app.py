import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
import sys
import re
from datetime import datetime, timedelta
import json

if sys.platform == 'win32':
    import io
    try:
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        os.environ['PYTHONIOENCODING'] = 'utf-8'
    except:
        pass  


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def find_data_path(filename):
  
    local_path = os.path.join(SCRIPT_DIR, "..", "server", "data2025", filename)
    if os.path.exists(local_path):
        return local_path
 
    docker_path = os.path.join("/app", "server", "data2025", filename)
    if os.path.exists(docker_path):
        return docker_path
  
    return local_path

REAL_CSV = find_data_path("realPrice.csv")
TARIF_CSV = find_data_path("tarifPrice.csv")
REAL_DAILY_CACHE = find_data_path("realPrice_daily.csv")  
MODEL_DIR = os.path.join(SCRIPT_DIR, "models")
PRICE_NORMALITY_MODEL = os.path.join(MODEL_DIR, "price_normality_model.pkl")
PRICE_PREDICTION_MODEL = os.path.join(MODEL_DIR, "price_prediction_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)


def normalize_room_name(name):

    if not name or pd.isna(name):
        return ""
    
    normalized = str(name).strip()
    
    normalized = normalized.lower()
    
    normalized = re.sub(r'[/\-_.,;:]+', ' ', normalized)
    
    normalized = re.sub(r'\s+', ' ', normalized)
    
    normalized = normalized.strip()
    
    return normalized


def find_room_matches(normalized_room, real_df):
  
    if not normalized_room:
        return pd.DataFrame()
    
    real_df_normalized = real_df.copy()
    real_df_normalized['room_normalized'] = real_df_normalized['room'].apply(normalize_room_name)
    
    exact_matches = real_df_normalized[real_df_normalized['room_normalized'] == normalized_room]
    
    if len(exact_matches) > 0:
        return exact_matches.drop(columns=['room_normalized'])
    
    room_words = [w for w in normalized_room.split() if len(w) > 1]
    
    if not room_words:
        return pd.DataFrame()
    
    mask = np.ones(len(real_df_normalized), dtype=bool)
    for word in room_words:
        mask = mask & real_df_normalized['room_normalized'].str.contains(word, case=False, na=False, regex=False).values
    
    partial_matches = real_df_normalized.loc[mask]
    
    if len(partial_matches) > 0:
        return partial_matches.drop(columns=['room_normalized'])
    
    if len(room_words) > 0:
        first_word = room_words[0]
        first_word_matches = real_df_normalized[
            real_df_normalized['room_normalized'].str.startswith(first_word, na=False)
        ]
        if len(first_word_matches) > 0:
            return first_word_matches.drop(columns=['room_normalized'])
    
    return pd.DataFrame()


def load_tarif_data():
    """Завантажує дані тарифів"""
    try:
     
        encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'latin-1']
        df = None
        
        for encoding in encodings:
            try:
            
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
               
                    df = pd.read_csv(TARIF_CSV, header=None, names=["room_id", "room", "date", "price_tarif"], encoding=encoding)
                    break
            except (UnicodeDecodeError, pd.errors.EmptyDataError):
                continue
        
        if df is None or len(df) == 0:
           
            df = pd.read_csv(TARIF_CSV, header=None, names=["room_id", "room", "date", "price_tarif"], encoding='latin-1')
        
        df["room"] = df["room"].astype(str).str.strip()
        df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors='coerce')
        df["price_tarif"] = pd.to_numeric(df["price_tarif"], errors='coerce')
        
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
        
        encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'latin-1']
        delimiters = [';', ',', '\t']
        df = None
        
        for encoding in encodings:
            for delimiter in delimiters:
                try:
                    df = pd.read_csv(REAL_CSV, encoding=encoding, delimiter=delimiter)
                    if len(df.columns) > 5:  
                        break
                except:
                    continue
            if df is not None and len(df.columns) > 5:
                break
        
        if df is None:
           
            df = pd.read_csv(REAL_CSV, encoding='latin-1', delimiter=';')
        
        if 'room' in df.columns and 'date' in df.columns and 'price_real' in df.columns:
        
            df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
            df['room'] = df['room'].astype(str).str.strip()
            df['price_real'] = pd.to_numeric(df['price_real'], errors='coerce')
            df = df.dropna(subset=["date", "price_real"])
        
            if use_cache:
                df.to_csv(REAL_DAILY_CACHE, index=False)
            return df
        
    
        if 'From' in df.columns and 'To' in df.columns:
            df['From'] = pd.to_datetime(df['From'], dayfirst=True, errors='coerce')
            df['To'] = pd.to_datetime(df['To'], dayfirst=True, errors='coerce')
        else:
            print("Помилка: не знайдено колонок From/To або файл вже в форматі day-by-day")
            return pd.DataFrame()
        
        if 'Room Name' in df.columns:
            df['room'] = df['Room Name'].astype(str).str.strip()
        elif 'room' in df.columns:
            df['room'] = df['room'].astype(str).str.strip()
        else:
            print("Помилка: не знайдено колонку з назвою кімнати")
            return pd.DataFrame()
        
        if 'Room daily price' in df.columns:
            df['price_per_day'] = pd.to_numeric(df['Room daily price'], errors='coerce')
        elif 'Price' in df.columns and 'Nights' in df.columns:
            df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
            df['Nights'] = pd.to_numeric(df['Nights'], errors='coerce')
            df['price_per_day'] = df['Price'] / df['Nights']
        else:
            print("Помилка: не знайдено колонки для розрахунку ціни за день")
            return pd.DataFrame()
        
        df = df.dropna(subset=["From", "To", "price_per_day"])
        df = df[df['price_per_day'] > 0]
        
        daily_rows = []
        
        for idx, row in df.iterrows():
            start_date = row['From']
            end_date = row['To']
            room = row['room']
            daily_price = row['price_per_day']
            
            if pd.isna(start_date) or pd.isna(end_date) or pd.isna(daily_price):
                continue
            
            current_date = start_date
            while current_date < end_date:
                daily_rows.append({
                    'room': room,
                    'date': current_date,
                    'price_real': daily_price
                })
                current_date += timedelta(days=1)
        
        daily_df = pd.DataFrame(daily_rows)
        
        if len(daily_df) == 0:
            print("Попередження: не вдалося створити денні дані")
            return pd.DataFrame()
        
        daily_df = daily_df.drop_duplicates(subset=['room', 'date'])
        
        print(f"Розбито {len(df)} бронювань на {len(daily_df)} днів")
        
        if use_cache:
            daily_df.to_csv(REAL_DAILY_CACHE, index=False)
            print(f"Збережено конвертовані дані в {REAL_DAILY_CACHE}")
        
        return daily_df
        
    except Exception as e:
        print(f"Помилка завантаження реальних даних: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def calculate_room_occupancy_metrics(room, real_df, date_ref=None, lookback_days=90):
   
    normalized_room = normalize_room_name(room)
    room_data = find_room_matches(normalized_room, real_df)
    
    if len(room_data) == 0:
        return {
            'occupancy_rate': 0.0,
            'total_booked_days': 0,
            'avg_booking_duration': 0.0,
            'bookings_per_month': 0.0,
            'demand_volatility': 0.0
        }
    
    if date_ref is None:
        date_ref = room_data['date'].max()
    
    date_start = date_ref - timedelta(days=lookback_days)
    period_data = room_data[(room_data['date'] >= date_start) & (room_data['date'] <= date_ref)]
    
    if len(period_data) == 0:
        return {
            'occupancy_rate': 0.0,
            'total_booked_days': 0,
            'avg_booking_duration': 0.0,
            'bookings_per_month': 0.0,
            'demand_volatility': 0.0
        }
    
    
    total_booked_days = period_data['date'].nunique()
    occupancy_rate = total_booked_days / lookback_days if lookback_days > 0 else 0.0
    
    unique_dates = sorted(period_data['date'].unique())
    booking_durations = []
    
    if len(unique_dates) > 0:
        current_booking_start = unique_dates[0]
        current_booking_days = 1
        
        for i in range(1, len(unique_dates)):
            prev_date = unique_dates[i-1]
            curr_date = unique_dates[i]
            
          
            if (curr_date - prev_date).days == 1:
                current_booking_days += 1
            else:
            
                if current_booking_days > 0:
                    booking_durations.append(current_booking_days)
                current_booking_start = curr_date
                current_booking_days = 1
        
        # Додаємо останнє бронювання
        if current_booking_days > 0:
            booking_durations.append(current_booking_days)
    
    avg_booking_duration = np.mean(booking_durations) if booking_durations else 0.0
    
    # Обчислюємо кількість бронювань на місяць
    total_bookings = len(booking_durations) if booking_durations else 0
    bookings_per_month = (total_bookings / lookback_days) * 30 if lookback_days > 0 else 0.0
    
    # Обчислюємо волатильність попиту (стандартне відхилення кількості бронювань по місяцях)
    period_data_copy = period_data.copy()
    period_data_copy['year_month'] = period_data_copy['date'].dt.to_period('M')
    monthly_bookings = period_data_copy.groupby('year_month').size()
    demand_volatility = monthly_bookings.std() if len(monthly_bookings) > 1 else 0.0
    
    return {
        'occupancy_rate': min(occupancy_rate, 1.0),  # Обмежуємо до 1.0
        'total_booked_days': total_booked_days,
        'avg_booking_duration': avg_booking_duration,
        'bookings_per_month': bookings_per_month,
        'demand_volatility': demand_volatility
    }


def calculate_demand_metrics(room, real_df, date_ref, days_window=30):
    """
    Обчислює метрики попиту на квартиру для конкретної дати
    
    Args:
        room: назва квартири
        real_df: DataFrame з реальними бронюваннями
        date_ref: опорна дата
        days_window: вікно для пошуку попиту (±days_window)
    
    Returns:
        dict з метриками: demand_count, demand_intensity, price_trend
    """
    # Нормалізуємо назву та знаходимо відповідні квартири
    normalized_room = normalize_room_name(room)
    room_data = find_room_matches(normalized_room, real_df)
    
    if len(room_data) == 0:
        return {
            'demand_count': 0,
            'demand_intensity': 0.0,
            'price_trend': 0.0,
            'recent_demand_ratio': 0.0
        }
    
    # Визначаємо період для аналізу попиту
    date_start = date_ref - timedelta(days=days_window)
    date_end = date_ref + timedelta(days=days_window)
    period_data = room_data[(room_data['date'] >= date_start) & (room_data['date'] <= date_end)]
    
    if len(period_data) == 0:
        return {
            'demand_count': 0,
            'demand_intensity': 0.0,
            'price_trend': 0.0,
            'recent_demand_ratio': 0.0
        }
    
    # Кількість днів з бронюваннями в періоді
    demand_count = period_data['date'].nunique()
    
    # Інтенсивність попиту (кількість днів з бронюваннями / загальна кількість днів у періоді)
    total_days_in_period = (date_end - date_start).days + 1
    demand_intensity = demand_count / total_days_in_period if total_days_in_period > 0 else 0.0
    
    # Тренд ціни (середня ціна в другій половині періоду - середня в першій)
    mid_date = date_start + timedelta(days=days_window)
    first_half = period_data[period_data['date'] < mid_date]
    second_half = period_data[period_data['date'] >= mid_date]
    
    if len(first_half) > 0 and len(second_half) > 0:
        avg_price_first = first_half['price_real'].mean()
        avg_price_second = second_half['price_real'].mean()
        price_trend = ((avg_price_second - avg_price_first) / avg_price_first * 100) if avg_price_first > 0 else 0.0
    else:
        price_trend = 0.0
    
    # Співвідношення попиту в останні 7 днів до попиту в перші 7 днів
    recent_start = date_ref - timedelta(days=7)
    old_start = date_start
    old_end = date_start + timedelta(days=7)
    
    recent_demand = period_data[period_data['date'] >= recent_start]['date'].nunique()
    old_demand = period_data[(period_data['date'] >= old_start) & (period_data['date'] < old_end)]['date'].nunique()
    
    recent_demand_ratio = (recent_demand / old_demand) if old_demand > 0 else 0.0
    
    return {
        'demand_count': demand_count,
        'demand_intensity': demand_intensity,
        'price_trend': price_trend,
        'recent_demand_ratio': recent_demand_ratio
    }


def rooms_match(room_a, room_b):
    """Перевіряє чи дві назви квартир відносяться до однієї й тієї ж"""
    if not room_a or not room_b or pd.isna(room_a) or pd.isna(room_b):
        return False
    na = normalize_room_name(room_a)
    nb = normalize_room_name(room_b)
    if na == nb:
        return True
    # Часткове співпадіння: всі слова з однієї назви є в іншій
    words_a = set(w for w in na.split() if len(w) > 1)
    words_b = set(w for w in nb.split() if len(w) > 1)
    return words_a == words_b or (words_a <= words_b) or (words_b <= words_a)


def build_training_data(real_df, tarif_df):
    """
    Будує навчальні дані з JOIN real + tarif.
    Використовує ТІЛЬКИ рядки де є і реальна ціна (бронювання) і тарифна ціна - ground truth.
    """
    tarif_clean = tarif_df.copy()
    tarif_clean['room_norm'] = tarif_clean['room'].astype(str).str.strip().apply(normalize_room_name)
    tarif_clean = tarif_clean[
        (tarif_clean['room_norm'] != '') &
        (tarif_clean['price_tarif'].notna()) &
        (tarif_clean['price_tarif'] > 0)
    ]
    tarif_clean['date'] = pd.to_datetime(tarif_clean['date']).dt.normalize()
    
    real_clean = real_df.copy()
    real_clean['room_norm'] = real_clean['room'].astype(str).str.strip().apply(normalize_room_name)
    real_clean = real_clean[
        (real_clean['room_norm'] != '') &
        (real_clean['price_real'].notna()) &
        (real_clean['price_real'] > 0)
    ]
    real_clean['date'] = pd.to_datetime(real_clean['date']).dt.normalize()
    
    # Векторизований merge замість циклу
    merged = real_clean.merge(
        tarif_clean[['room_norm', 'date', 'room', 'price_tarif']],
        on=['room_norm', 'date'],
        how='inner',
        suffixes=('_real', '_tarif')
    )
    # Якщо є дублікати (кілька room_id на одну кімнату), беремо перший
    merged = merged.drop_duplicates(subset=['room_norm', 'date'], keep='first')
    merged['room'] = merged['room_tarif']  # Назва з тарифу для консистентності
    return merged[['room', 'date', 'price_tarif', 'price_real']]


def find_similar_bookings(tarif_row, real_df, days_window=30, price_tolerance=None):
    """
    Знаходить схожі бронювання у realPrice
    Спочатку шукає за кімнатою та датою, потім аналізує ціни
    Враховує різні варіанти написання назв квартир (/, -, пробіли тощо)
    
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
    
    # Нормалізуємо назву квартири для пошуку
    normalized_room = normalize_room_name(room)
    
    # Знаходимо відповідні квартири з урахуванням різних варіантів написання
    room_matches = find_room_matches(normalized_room, real_df)
    
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


def create_features_for_training(merged_df, real_df):
    """
    Створює ознаки для навчання з merged даних (real + tarif JOIN).
    Кожен рядок має ground truth: price_real з реальних бронювань.
    """
    features_list = []
    
    for idx, row in merged_df.iterrows():
        # Базові ознаки (включаючи seasonality)
        day_of_week = row['date'].dayofweek
        month = row['date'].month
        day_of_month = row['date'].day
        week_of_year = row['date'].isocalendar()[1]  # 1-52
        price_tarif = row['price_tarif']
        
        # Обчислюємо метрики частоти здачі та попиту
        occupancy_metrics = calculate_room_occupancy_metrics(row['room'], real_df, row['date'], lookback_days=90)
        demand_metrics = calculate_demand_metrics(row['room'], real_df, row['date'], days_window=30)
        
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
            normalized_room = normalize_room_name(row['room'])
            room_all = find_room_matches(normalized_room, real_df)
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
        
        # У merged даних завжди є ground truth price_real
        real_price = row['price_real']
        has_real_price = 1
        
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
            'week_of_year': week_of_year,
            'price_tarif': price_tarif,
            'avg_real_price': avg_real_price,
            'median_real_price': median_real_price,
            'min_real_price': min_real_price,
            'max_real_price': max_real_price,
            'std_real_price': std_real_price if not pd.isna(std_real_price) else 0,
            'count_similar': count_similar,
            'min_date_diff': min_date_diff,
            'has_real_price': has_real_price,
            # Нові фічі: частота здачі та попит
            'occupancy_rate': occupancy_metrics['occupancy_rate'],
            'total_booked_days': occupancy_metrics['total_booked_days'],
            'avg_booking_duration': occupancy_metrics['avg_booking_duration'],
            'bookings_per_month': occupancy_metrics['bookings_per_month'],
            'demand_volatility': occupancy_metrics['demand_volatility'],
            'demand_count': demand_metrics['demand_count'],
            'demand_intensity': demand_metrics['demand_intensity'],
            'price_trend': demand_metrics['price_trend'],
            'recent_demand_ratio': demand_metrics['recent_demand_ratio'],
            # Цільові змінні
            'price_status': price_status,
            'real_price': real_price,
            'optimal_price': optimal_price,
            'lost_revenue': lost_revenue,
            'lost_revenue_pct': lost_revenue_pct
        })
    
    return pd.DataFrame(features_list)


def train_models():
    """Навчає моделі машинного навчання на всіх даних з data2025"""
    import sys
    print("Завантаження даних з server/data2025...", flush=True)
    tarif_df = load_tarif_data()
    # Використовуємо realPrice_daily.csv (або конвертуємо з realPrice.csv)
    real_df = load_real_data(use_cache=True)
    
    if len(tarif_df) == 0 or len(real_df) == 0:
        print("Помилка: не вдалося завантажити дані")
        return
    
    print(f"Завантажено {len(tarif_df)} рядків тарифів та {len(real_df)} рядків реальних бронювань")
    
    # Будуємо навчальні дані тільки з рядків де є І тариф І реальна ціна (ground truth)
    print("Об'єднання даних (JOIN real + tarif)...")
    merged_df = build_training_data(real_df, tarif_df)
    
    if len(merged_df) == 0:
        print("Помилка: не знайдено спільних рядків для навчання. Перевірте збіг назв квартир.")
        return
    
    print(f"Завантажено {len(merged_df)} навчальних зразків з ground truth (real + tarif)")
    
    print("Створення ознак...")
    features_df = create_features_for_training(merged_df, real_df)
    
    # Ознаки для моделі (включаючи seasonality)
    feature_cols = [
        'day_of_week', 'month', 'day_of_month', 'week_of_year', 'price_tarif',
        'avg_real_price', 'min_real_price', 'max_real_price', 
        'std_real_price', 'count_similar', 'min_date_diff', 'has_real_price',
        'occupancy_rate', 'total_booked_days', 'avg_booking_duration',
        'bookings_per_month', 'demand_volatility', 'demand_count',
        'demand_intensity', 'price_trend', 'recent_demand_ratio'
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
    
    # Модель регресії (передбачення ціни) - GradientBoosting для кращих прогнозів
    print("Навчання моделі регресії (GradientBoosting)...")
    reg_model = GradientBoostingRegressor(
        n_estimators=200, max_depth=8, learning_rate=0.1,
        min_samples_leaf=5, subsample=0.8, random_state=42
    )
    reg_model.fit(X_train, y_train_reg)
    
    # Збереження моделей
    joblib.dump(clf_model, PRICE_NORMALITY_MODEL)
    joblib.dump(reg_model, PRICE_PREDICTION_MODEL)
    joblib.dump(scaler, SCALER_PATH)
    
    # Оцінка моделей
    from sklearn.metrics import mean_absolute_error
    clf_score = clf_model.score(X_test, y_test_cls)
    reg_score = reg_model.score(X_test, y_test_reg)
    y_pred_reg = reg_model.predict(X_test)
    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    
    print(f"\nМоделі навчено та збережено!")
    print(f"Точність класифікації: {clf_score:.2%}")
    print(f"R² регресії: {reg_score:.2%}")
    print(f"MAE (середня помилка в грн): {mae:.2f}")
    
    return clf_model, reg_model, scaler


def predict_price_normality(room, date, price_tarif, real_df=None):
    """
    Передбачає чи ціна нормальна для заданої кімнати, дати та тарифу
    
    Returns:
        dict з результатами передбачення
    """
    # Завантажуємо моделі
    if not os.path.exists(PRICE_NORMALITY_MODEL):
        # Використовуємо sys.stderr для помилок (безпечніше для Windows)
        try:
            sys.stderr.write("Models not trained. Run train_models() first.\n")
        except:
            pass  # Ігноруємо помилки кодування
        return None
    
    clf_model = joblib.load(PRICE_NORMALITY_MODEL)
    reg_model = joblib.load(PRICE_PREDICTION_MODEL)
    scaler = joblib.load(SCALER_PATH)
    
    # Завантажуємо дані якщо не передано
    if real_df is None:
        real_df = load_real_data()
    
    # Створюємо рядок тарифу
    date_obj = pd.to_datetime(date, dayfirst=True)
    tarif_row = pd.Series({
        'room': room,
        'date': date_obj,
        'price_tarif': price_tarif
    })
    
    # Обчислюємо метрики частоти здачі та попиту
    occupancy_metrics = calculate_room_occupancy_metrics(room, real_df, date_obj, lookback_days=90)
    demand_metrics = calculate_demand_metrics(room, real_df, date_obj, days_window=30)
    
    # Знаходимо схожі бронювання (без фільтрації за ціною)
    similar = find_similar_bookings(tarif_row, real_df, days_window=30, price_tolerance=None)
    
    # Створюємо ознаки (порядок має збігатися з train_models)
    day_of_week = date_obj.dayofweek
    month = date_obj.month
    day_of_month = date_obj.day
    week_of_year = date_obj.isocalendar()[1]
    
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
        normalized_room = normalize_room_name(room)
        room_all = find_room_matches(normalized_room, real_df)
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
    
    # Перевіряємо точне співпадіння (room_matches може бути порожнім)
    normalized_room = normalize_room_name(room)
    room_matches = find_room_matches(normalized_room, real_df)
    has_real_price = 0
    if len(room_matches) > 0 and 'date' in room_matches.columns:
        date_norm = pd.to_datetime(date_obj).normalize()
        exact_match = room_matches[pd.to_datetime(room_matches['date']).dt.normalize() == date_norm]
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
    
    # Формуємо ознаки (порядок = feature_cols у train_models)
    features = np.array([[
        day_of_week, month, day_of_month, week_of_year, price_tarif,
        avg_real_price, min_real_price, max_real_price,
        std_real_price if not pd.isna(std_real_price) else 0,
        count_similar, min_date_diff, has_real_price,
        # Нові фічі
        occupancy_metrics['occupancy_rate'],
        occupancy_metrics['total_booked_days'],
        occupancy_metrics['avg_booking_duration'],
        occupancy_metrics['bookings_per_month'],
        occupancy_metrics['demand_volatility'],
        demand_metrics['demand_count'],
        demand_metrics['demand_intensity'],
        demand_metrics['price_trend'],
        demand_metrics['recent_demand_ratio']
    ]])
    
    # Нормалізуємо
    features_scaled = scaler.transform(features)
    
    # Передбачення
    price_status = clf_model.predict(features_scaled)[0]
    predicted_price = reg_model.predict(features_scaled)[0]
    price_proba = clf_model.predict_proba(features_scaled)[0]
    
    status_names = {0: "Низька", 1: "Нормальна", 2: "Висока"}
    
    # Визначаємо день тижня (0=Понеділок, 4=П'ятниця, 5=Субота, 6=Неділя)
    day_of_week_num = date_obj.weekday()
    is_weekend = day_of_week_num >= 4  # П'ятниця, Субота, Неділя
    is_high_demand_day = day_of_week_num == 4 or day_of_week_num == 5  # Пт або Сб
    
    # Назви днів тижня українською
    ukrainian_days = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']
    day_of_week_name = ukrainian_days[day_of_week_num] if day_of_week_num < len(ukrainian_days) else date_obj.strftime('%A')
    
    result = {
        'room': room,
        'date': date_obj.strftime('%d/%m/%Y'),
        'day_of_week': day_of_week_name,
        'day_of_week_num': day_of_week_num,
        'is_weekend': is_weekend,
        'is_high_demand_day': is_high_demand_day,
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
        # Нові метрики: частота здачі та попит
        'occupancy_metrics': {
            'occupancy_rate': round(occupancy_metrics['occupancy_rate'] * 100, 2),  # У відсотках
            'total_booked_days': int(occupancy_metrics['total_booked_days']),
            'avg_booking_duration': round(occupancy_metrics['avg_booking_duration'], 2),
            'bookings_per_month': round(occupancy_metrics['bookings_per_month'], 2),
            'demand_volatility': round(occupancy_metrics['demand_volatility'], 2)
        },
        'demand_metrics': {
            'demand_count': int(demand_metrics['demand_count']),
            'demand_intensity': round(demand_metrics['demand_intensity'] * 100, 2),  # У відсотках
            'price_trend': round(demand_metrics['price_trend'], 2),
            'recent_demand_ratio': round(demand_metrics['recent_demand_ratio'], 2)
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
