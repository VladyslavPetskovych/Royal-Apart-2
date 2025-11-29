"""
API для передбачення ціни через командний рядок
Використання: python predict_api.py <room> <date> <price_tarif>
"""
import sys
import json
import os

# Встановлюємо UTF-8 для stdout/stderr (для Windows сумісності)
# НЕ перенаправляємо stdout/stderr тут, щоб уникнути проблем з закритими файлами
# Замість цього використовуємо безпечний вивід у функціях
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

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
    
    try:
        result = predict_price_normality(room, date, price_tarif)
        
        if result:
            json_output = json.dumps(result, ensure_ascii=False)
            # Безпечний вивід JSON
            try:
                # Спробуємо використати buffer для Windows
                if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
                    try:
                        sys.stdout.buffer.write(json_output.encode('utf-8'))
                        sys.stdout.buffer.write(b'\n')
                        sys.stdout.buffer.flush()
                    except (ValueError, OSError, AttributeError):
                        # Якщо buffer не працює, використовуємо звичайний print
                        print(json_output)
                else:
                    print(json_output)
            except Exception:
                # У будь-якому випадку помилки, використовуємо print
                print(json_output)
        else:
            error_output = json.dumps({"error": "Не вдалося зробити передбачення. Моделі не навчені або помилка завантаження."})
            try:
                if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
                    try:
                        sys.stdout.buffer.write(error_output.encode('utf-8'))
                        sys.stdout.buffer.write(b'\n')
                        sys.stdout.buffer.flush()
                    except (ValueError, OSError, AttributeError):
                        print(error_output)
                else:
                    print(error_output)
            except Exception:
                print(error_output)
    except Exception as e:
        error_output = json.dumps({"error": f"Помилка: {str(e)}"})
        try:
            if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
                try:
                    sys.stdout.buffer.write(error_output.encode('utf-8'))
                    sys.stdout.buffer.write(b'\n')
                    sys.stdout.buffer.flush()
                except (ValueError, OSError, AttributeError):
                    print(error_output)
            else:
                print(error_output)
        except Exception:
            print(error_output)
        sys.exit(1)




