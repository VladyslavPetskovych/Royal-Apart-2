"""
API для передбачення ціни через командний рядок
Використання: python predict_api.py <room> <date> <price_tarif>
"""
import sys
import json
from app import predict_price_normality

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Потрібні параметри: room, date, price_tarif",
            "usage": "python predict_api.py <room> <date> <price_tarif>"
        }))
        sys.exit(1)
    
    room = sys.argv[1]
    date = sys.argv[2]
    price_tarif = float(sys.argv[3])
    
    result = predict_price_normality(room, date, price_tarif)
    
    if result:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps({"error": "Не вдалося зробити передбачення"}))

