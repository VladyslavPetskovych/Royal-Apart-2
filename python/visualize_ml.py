import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
from sklearn.metrics import confusion_matrix, classification_report
from app import (
    load_tarif_data, load_real_data, build_training_data, create_features_for_training,
    PRICE_NORMALITY_MODEL, PRICE_PREDICTION_MODEL, SCALER_PATH, MODEL_DIR
)

# Налаштування для української мови
plt.rcParams['font.family'] = 'DejaVu Sans'
sns.set_style("whitegrid")

def plot_feature_importance():
    """Графік важливості ознак для моделей"""
    if not os.path.exists(PRICE_NORMALITY_MODEL):
        print("Моделі не навчені! Спочатку запустіть train_models()")
        return
    
    clf_model = joblib.load(PRICE_NORMALITY_MODEL)
    reg_model = joblib.load(PRICE_PREDICTION_MODEL)
    
    feature_names = [
        'day_of_week', 'month', 'day_of_month', 'week_of_year', 'price_tarif',
        'avg_real_price', 'min_real_price', 'max_real_price', 
        'std_real_price', 'count_similar', 'min_date_diff', 'has_real_price',
        'occupancy_rate', 'total_booked_days', 'avg_booking_duration',
        'bookings_per_month', 'demand_volatility', 'demand_count',
        'demand_intensity', 'price_trend', 'recent_demand_ratio'
    ]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # Важливість ознак для класифікації
    importances_clf = clf_model.feature_importances_
    indices_clf = np.argsort(importances_clf)[::-1][:15]  # Топ 15
    
    ax1.barh(range(len(indices_clf)), importances_clf[indices_clf], color='steelblue')
    ax1.set_yticks(range(len(indices_clf)))
    ax1.set_yticklabels([feature_names[i] for i in indices_clf])
    ax1.set_xlabel('Важливість ознаки', fontsize=12)
    ax1.set_title('Топ-15 найважливіших ознак\n(Модель класифікації)', fontsize=14, fontweight='bold')
    ax1.invert_yaxis()
    ax1.grid(axis='x', alpha=0.3)
    
    # Важливість ознак для регресії
    importances_reg = reg_model.feature_importances_
    indices_reg = np.argsort(importances_reg)[::-1][:15]  # Топ 15
    
    ax2.barh(range(len(indices_reg)), importances_reg[indices_reg], color='coral')
    ax2.set_yticks(range(len(indices_reg)))
    ax2.set_yticklabels([feature_names[i] for i in indices_reg])
    ax2.set_xlabel('Важливість ознаки', fontsize=12)
    ax2.set_title('Топ-15 найважливіших ознак\n(Модель регресії)', fontsize=14, fontweight='bold')
    ax2.invert_yaxis()
    ax2.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'feature_importance.png'), dpi=300, bbox_inches='tight')
    print(f"Графік збережено: {os.path.join(MODEL_DIR, 'feature_importance.png')}")
    plt.show()


def plot_price_comparison():
    """Порівняння передбачених та реальних цін"""
    if not os.path.exists(PRICE_NORMALITY_MODEL):
        print("Моделі не навчені!")
        return
    
    print("Завантаження даних...")
    tarif_df = load_tarif_data()
    real_df = load_real_data()
    
    if len(tarif_df) == 0 or len(real_df) == 0:
        print("Помилка завантаження даних")
        return
    
    merged_df = build_training_data(real_df, tarif_df)
    if len(merged_df) == 0:
        print("Помилка: немає спільних даних для візуалізації")
        return
    sample_df = merged_df.head(1000)
    print("Створення ознак...")
    features_df = create_features_for_training(sample_df, real_df)
    
    # Завантажуємо моделі
    clf_model = joblib.load(PRICE_NORMALITY_MODEL)
    reg_model = joblib.load(PRICE_PREDICTION_MODEL)
    scaler = joblib.load(SCALER_PATH)
    
    feature_cols = [
        'day_of_week', 'month', 'day_of_month', 'week_of_year', 'price_tarif',
        'avg_real_price', 'min_real_price', 'max_real_price', 
        'std_real_price', 'count_similar', 'min_date_diff', 'has_real_price',
        'occupancy_rate', 'total_booked_days', 'avg_booking_duration',
        'bookings_per_month', 'demand_volatility', 'demand_count',
        'demand_intensity', 'price_trend', 'recent_demand_ratio'
    ]
    
    X = features_df[feature_cols].fillna(0)
    X_scaled = scaler.transform(X)
    
    # Передбачення
    predicted_prices = reg_model.predict(X_scaled)
    real_prices = features_df['real_price'].values
    price_status = clf_model.predict(X_scaled)
    
    # Фільтруємо тільки ті, де є реальна ціна
    mask = features_df['has_real_price'] == 1
    predicted_filtered = predicted_prices[mask]
    real_filtered = real_prices[mask]
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    # 1. Scatter plot: передбачені vs реальні
    axes[0, 0].scatter(real_filtered, predicted_filtered, alpha=0.5, s=20)
    min_price = min(real_filtered.min(), predicted_filtered.min())
    max_price = max(real_filtered.max(), predicted_filtered.max())
    axes[0, 0].plot([min_price, max_price], [min_price, max_price], 'r--', lw=2, label='Ідеальна лінія')
    axes[0, 0].set_xlabel('Реальна ціна (грн)', fontsize=12)
    axes[0, 0].set_ylabel('Передбачена ціна (грн)', fontsize=12)
    axes[0, 0].set_title('Передбачені vs Реальні ціни', fontsize=14, fontweight='bold')
    axes[0, 0].legend()
    axes[0, 0].grid(alpha=0.3)
    
    # 2. Розподіл помилок
    errors = predicted_filtered - real_filtered
    axes[0, 1].hist(errors, bins=50, color='skyblue', edgecolor='black', alpha=0.7)
    axes[0, 1].axvline(x=0, color='red', linestyle='--', linewidth=2, label='Нульова помилка')
    axes[0, 1].set_xlabel('Помилка передбачення (грн)', fontsize=12)
    axes[0, 1].set_ylabel('Частота', fontsize=12)
    axes[0, 1].set_title(f'Розподіл помилок\n(Середня: {errors.mean():.2f} грн)', fontsize=14, fontweight='bold')
    axes[0, 1].legend()
    axes[0, 1].grid(alpha=0.3)
    
    # 3. Розподіл класів
    status_names = {0: "Низька", 1: "Нормальна", 2: "Висока"}
    status_counts = pd.Series(price_status).value_counts().sort_index()
    colors = ['#ff6b6b', '#51cf66', '#ffd43b']
    axes[1, 0].bar([status_names[i] for i in status_counts.index], 
                    status_counts.values, color=colors, edgecolor='black', alpha=0.7)
    axes[1, 0].set_ylabel('Кількість', fontsize=12)
    axes[1, 0].set_title('Розподіл класифікації цін', fontsize=14, fontweight='bold')
    axes[1, 0].grid(axis='y', alpha=0.3)
    
    # 4. Ціни по місяцях
    features_df['month_name'] = pd.to_datetime(features_df.index).month if 'date' not in features_df.columns else pd.to_datetime(sample_df['date']).dt.month
    monthly_avg = features_df.groupby('month_name')['real_price'].mean()
    monthly_pred = pd.Series(predicted_prices).groupby(features_df['month_name']).mean()
    
    x = range(1, 13)
    axes[1, 1].plot(x, [monthly_avg.get(i, 0) for i in x], marker='o', label='Реальна', linewidth=2)
    axes[1, 1].plot(x, [monthly_pred.get(i, 0) for i in x], marker='s', label='Передбачена', linewidth=2)
    axes[1, 1].set_xlabel('Місяць', fontsize=12)
    axes[1, 1].set_ylabel('Середня ціна (грн)', fontsize=12)
    axes[1, 1].set_title('Середні ціни по місяцях', fontsize=14, fontweight='bold')
    axes[1, 1].set_xticks(x)
    axes[1, 1].legend()
    axes[1, 1].grid(alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'price_comparison.png'), dpi=300, bbox_inches='tight')
    print(f"Графік збережено: {os.path.join(MODEL_DIR, 'price_comparison.png')}")
    plt.show()


def plot_occupancy_vs_price():
    """Залежність між occupancy rate та ціною"""
    print("Завантаження даних...")
    tarif_df = load_tarif_data()
    real_df = load_real_data()
    
    if len(tarif_df) == 0 or len(real_df) == 0:
        print("Помилка завантаження даних")
        return
    
    merged_df = build_training_data(real_df, tarif_df)
    if len(merged_df) == 0:
        print("Помилка: немає спільних даних")
        return
    sample_df = merged_df.head(500)
    print("Створення ознак...")
    features_df = create_features_for_training(sample_df, real_df)
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    # 1. Occupancy rate vs ціна
    mask = features_df['has_real_price'] == 1
    axes[0, 0].scatter(features_df.loc[mask, 'occupancy_rate'], 
                       features_df.loc[mask, 'real_price'], 
                       alpha=0.5, s=30, color='steelblue')
    axes[0, 0].set_xlabel('Occupancy Rate (коефіцієнт зайнятості)', fontsize=12)
    axes[0, 0].set_ylabel('Ціна (грн)', fontsize=12)
    axes[0, 0].set_title('Залежність ціни від зайнятості', fontsize=14, fontweight='bold')
    axes[0, 0].grid(alpha=0.3)
    
    # 2. Demand intensity vs ціна
    axes[0, 1].scatter(features_df.loc[mask, 'demand_intensity'], 
                       features_df.loc[mask, 'real_price'], 
                       alpha=0.5, s=30, color='coral')
    axes[0, 1].set_xlabel('Demand Intensity (інтенсивність попиту)', fontsize=12)
    axes[0, 1].set_ylabel('Ціна (грн)', fontsize=12)
    axes[0, 1].set_title('Залежність ціни від інтенсивності попиту', fontsize=14, fontweight='bold')
    axes[0, 1].grid(alpha=0.3)
    
    # 3. Bookings per month vs ціна
    axes[1, 0].scatter(features_df.loc[mask, 'bookings_per_month'], 
                       features_df.loc[mask, 'real_price'], 
                       alpha=0.5, s=30, color='mediumseagreen')
    axes[1, 0].set_xlabel('Бронювань на місяць', fontsize=12)
    axes[1, 0].set_ylabel('Ціна (грн)', fontsize=12)
    axes[1, 0].set_title('Залежність ціни від частоти бронювань', fontsize=14, fontweight='bold')
    axes[1, 0].grid(alpha=0.3)
    
    # 4. Price trend
    price_trend_data = features_df.loc[mask, 'price_trend']
    axes[1, 1].hist(price_trend_data, bins=50, color='plum', edgecolor='black', alpha=0.7)
    axes[1, 1].axvline(x=0, color='red', linestyle='--', linewidth=2, label='Нульовий тренд')
    axes[1, 1].set_xlabel('Price Trend (%)', fontsize=12)
    axes[1, 1].set_ylabel('Частота', fontsize=12)
    axes[1, 1].set_title('Розподіл трендів цін', fontsize=14, fontweight='bold')
    axes[1, 1].legend()
    axes[1, 1].grid(alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'occupancy_vs_price.png'), dpi=300, bbox_inches='tight')
    print(f"Графік збережено: {os.path.join(MODEL_DIR, 'occupancy_vs_price.png')}")
    plt.show()


def plot_model_performance():
    """Оцінка продуктивності моделей"""
    if not os.path.exists(PRICE_NORMALITY_MODEL):
        print("Моделі не навчені!")
        return
    
    print("Завантаження даних...")
    tarif_df = load_tarif_data()
    real_df = load_real_data()
    
    if len(tarif_df) == 0 or len(real_df) == 0:
        print("Помилка завантаження даних")
        return
    
    merged_df = build_training_data(real_df, tarif_df)
    if len(merged_df) == 0:
        print("Помилка: немає спільних даних")
        return
    sample_df = merged_df.head(1000)
    print("Створення ознак...")
    features_df = create_features_for_training(sample_df, real_df)
    
    # Завантажуємо моделі
    clf_model = joblib.load(PRICE_NORMALITY_MODEL)
    reg_model = joblib.load(PRICE_PREDICTION_MODEL)
    scaler = joblib.load(SCALER_PATH)
    
    feature_cols = [
        'day_of_week', 'month', 'day_of_month', 'week_of_year', 'price_tarif',
        'avg_real_price', 'min_real_price', 'max_real_price', 
        'std_real_price', 'count_similar', 'min_date_diff', 'has_real_price',
        'occupancy_rate', 'total_booked_days', 'avg_booking_duration',
        'bookings_per_month', 'demand_volatility', 'demand_count',
        'demand_intensity', 'price_trend', 'recent_demand_ratio'
    ]
    
    X = features_df[feature_cols].fillna(0)
    X_scaled = scaler.transform(X)
    
    # Передбачення
    y_pred_clf = clf_model.predict(X_scaled)
    y_pred_reg = reg_model.predict(X_scaled)
    y_true_clf = features_df['price_status'].values
    y_true_reg = features_df['real_price'].values
    
    # Фільтруємо для регресії
    mask = features_df['has_real_price'] == 1
    y_pred_reg_filtered = y_pred_reg[mask]
    y_true_reg_filtered = y_true_reg[mask]
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    # 1. Confusion Matrix для класифікації
    cm = confusion_matrix(y_true_clf, y_pred_clf)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0, 0],
                xticklabels=['Низька', 'Нормальна', 'Висока'],
                yticklabels=['Низька', 'Нормальна', 'Висока'])
    axes[0, 0].set_xlabel('Передбачено', fontsize=12)
    axes[0, 0].set_ylabel('Реальність', fontsize=12)
    axes[0, 0].set_title('Матриця плутанини (Класифікація)', fontsize=14, fontweight='bold')
    
    # 2. Точність моделі регресії
    mae = np.mean(np.abs(y_pred_reg_filtered - y_true_reg_filtered))
    rmse = np.sqrt(np.mean((y_pred_reg_filtered - y_true_reg_filtered)**2))
    r2 = reg_model.score(X_scaled[mask], y_true_reg_filtered)
    
    metrics_text = f'MAE: {mae:.2f} грн\nRMSE: {rmse:.2f} грн\nR²: {r2:.4f}'
    axes[0, 1].text(0.5, 0.5, metrics_text, ha='center', va='center', 
                    fontsize=16, bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    axes[0, 1].axis('off')
    axes[0, 1].set_title('Метрики регресії', fontsize=14, fontweight='bold')
    
    # 3. Розподіл помилок по класах
    errors_by_class = []
    class_names = []
    for status in [0, 1, 2]:
        mask_class = (y_true_clf == status) & mask
        if mask_class.sum() > 0:
            errors = np.abs(y_pred_reg[mask_class] - y_true_reg[mask_class])
            errors_by_class.append(errors)
            class_names.append(['Низька', 'Нормальна', 'Висока'][status])
    
    axes[1, 0].boxplot(errors_by_class, labels=class_names)
    axes[1, 0].set_ylabel('Абсолютна помилка (грн)', fontsize=12)
    axes[1, 0].set_title('Розподіл помилок по класах', fontsize=14, fontweight='bold')
    axes[1, 0].grid(axis='y', alpha=0.3)
    
    # 4. Точність класифікації по класах
    from sklearn.metrics import precision_recall_fscore_support
    precision, recall, f1, _ = precision_recall_fscore_support(y_true_clf, y_pred_clf, average=None)
    
    x = np.arange(len(class_names))
    width = 0.25
    axes[1, 1].bar(x - width, precision, width, label='Precision', alpha=0.8)
    axes[1, 1].bar(x, recall, width, label='Recall', alpha=0.8)
    axes[1, 1].bar(x + width, f1, width, label='F1-Score', alpha=0.8)
    axes[1, 1].set_xlabel('Клас', fontsize=12)
    axes[1, 1].set_ylabel('Оцінка', fontsize=12)
    axes[1, 1].set_title('Метрики класифікації по класах', fontsize=14, fontweight='bold')
    axes[1, 1].set_xticks(x)
    axes[1, 1].set_xticklabels(class_names)
    axes[1, 1].legend()
    axes[1, 1].grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'model_performance.png'), dpi=300, bbox_inches='tight')
    print(f"Графік збережено: {os.path.join(MODEL_DIR, 'model_performance.png')}")
    plt.show()


if __name__ == "__main__":
    print("=== Створення графіків для машинного навчання ===\n")
    
    print("1. Важливість ознак...")
    plot_feature_importance()
    
    print("\n2. Порівняння цін...")
    plot_price_comparison()
    
    print("\n3. Залежність occupancy vs ціна...")
    plot_occupancy_vs_price()
    
    print("\n4. Продуктивність моделей...")
    plot_model_performance()
    
    print("\n✅ Всі графіки створено!")