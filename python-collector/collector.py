import traceback
import requests 
import json
import time
import pika
from datetime import datetime

RABBITMQ_URL = "amqp://gdash:gdash@rabbitmq:5672/"
QUEUE_NAME = "gdash.weather.logs"

LATITUDE = -16.6869
LONGITUDE = -49.2648
CITY_NAME = "Goiânia"

def get_weather():
    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "current_weather": True,
    }

    response = requests.get(url, params=params)
    data = response.json()

    weather = {
        "timestamp": datetime.utcnow().isoformat(),
        "location": CITY_NAME,
        "temperature": data["current_weather"]["temperature"],
        "humidity": 60,
        "windSpeed": data["current_weather"]["windspeed"],
        "condition": "N/A",
        "source": "python-collector"
    }

    print("Coleta realizada:", weather)
    return weather


def send_to_rabbit(weather):
    params = pika.URLParameters(RABBITMQ_URL)

    while True:
        try:
            connection = pika.BlockingConnection(params)
            break
        except Exception as e:
            print("🔁 RabbitMQ indisponível, tentando novamente em 5s...", e)
            time.sleep(5)

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    channel.basic_publish(
        exchange="",
        routing_key=QUEUE_NAME,
        body=json.dumps(weather),
        properties=pika.BasicProperties(delivery_mode=2)
    )

    print(f"Mensagem enviada para RabbitMQ ({QUEUE_NAME}):", weather)
    connection.close()

def loop():
    print("🚀 Python Collector iniciado (Goiânia)...")

    while True:
        try:
            weather = get_weather()
            send_to_rabbit(weather)
        except Exception as e:
            print("❌ Erro no collector:")
            traceback.print_exc()

        print("⏳ Aguardando 60 segundos...\n")
        time.sleep(60)


if __name__ == "__main__":
    loop()
