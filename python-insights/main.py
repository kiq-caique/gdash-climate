import os
import json
from math import isnan
from typing import List, Optional
from datetime import datetime, timezone

import httpx
import aio_pika
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv


load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://gdash:gdash@localhost:5672/")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "gdash.weather.logs")

OPEN_METEO_URL = os.getenv("OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast")
WEATHER_LAT = os.getenv("WEATHER_LAT", "-3.73")       
WEATHER_LON = os.getenv("WEATHER_LON", "-38.52")
WEATHER_CITY = os.getenv("WEATHER_CITY", "Fortaleza, BR")
WEATHER_TIMEZONE = os.getenv("WEATHER_TIMEZONE", "America/Fortaleza")

# em produção poderia ser 60 (minutos); pra testar pode por 1–5 minutos
FETCH_INTERVAL_MINUTES = int(os.getenv("FETCH_INTERVAL_MINUTES", "2"))


class WeatherLogIn(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[str] = None
    location: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    windSpeed: Optional[float] = None
    condition: Optional[str] = None
    source: Optional[str] = None
    userId: Optional[str] = None


class WeatherInsightsOut(BaseModel):
    count: int
    averageTemperature: Optional[float]
    averageHumidity: Optional[float]
    maxTemperature: Optional[float]
    minTemperature: Optional[float]
    trend: Optional[str]
    comfortIndex: Optional[float]
    summary: str


app = FastAPI(title="GDASH Climate Python Insights")


def _safe_numbers(values: List[Optional[float]]) -> List[float]:
    result: List[float] = []
    for v in values:
        if v is None:
            continue
        try:
            if isinstance(v, float) and isnan(v):
                continue
        except Exception:
            pass
        result.append(float(v))
    return result


def _calc_average(values: List[Optional[float]]) -> Optional[float]:
    nums = _safe_numbers(values)
    if not nums:
        return None
    return sum(nums) / float(len(nums))


def _calc_trend(temps: List[Optional[float]]) -> Optional[str]:
    nums = _safe_numbers(temps)
    if len(nums) < 2:
        return None

    first = nums[0]
    last = nums[-1]

    diff = last - first
    if diff > 0.5:
        return "subindo"
    if diff < -0.5:
        return "caindo"
    return "estavel"


def _calc_comfort_index(avg_temp: Optional[float],
                        avg_humidity: Optional[float]) -> Optional[float]:
    """
    Índice tosco só pra ter um numerozinho bonitinho:
    quanto mais perto de 24°C e 50% umidade, melhor (mais próximo de 100).
    """
    if avg_temp is None or avg_humidity is None:
        return None

    temp_score = max(0.0, 1.0 - abs(avg_temp - 24.0) / 15.0)
    hum_score = max(0.0, 1.0 - abs(avg_humidity - 50.0) / 50.0)

    raw = (temp_score * 0.6) + (hum_score * 0.4)
    return round(raw * 100.0, 1)


def _build_summary(count: int,
                   avg_temp: Optional[float],
                   avg_hum: Optional[float],
                   trend: Optional[str],
                   comfort: Optional[float]) -> str:
    if count == 0:
        return "Nenhum registro de clima recebido ainda."

    partes: List[str] = []

    partes.append(f"Foram analisados {count} registros de clima.")

    if avg_temp is not None:
        partes.append(f"A temperatura média foi de {avg_temp:.1f} ºC.")
    if avg_hum is not None:
        partes.append(f"A umidade média ficou em {avg_hum:.0f}%.")

    if trend == "subindo":
        partes.append("A tendência de temperatura é de alta.")
    elif trend == "caindo":
        partes.append("A tendência de temperatura é de queda.")
    elif trend == "estavel":
        partes.append("A temperatura está relativamente estável.")

    if comfort is not None:
        if comfort >= 75:
            partes.append("O índice de conforto climático está ALTO (condições agradáveis).")
        elif comfort >= 50:
            partes.append("O índice de conforto climático está MODERADO.")
        else:
            partes.append("O índice de conforto climático está BAIXO (clima mais desconfortável).")

    if not partes:
        return "Ainda não há dados suficientes para gerar insights."

    return " ".join(partes)


@app.post("/insights/from-logs", response_model=WeatherInsightsOut)
def generate_insights_from_logs(logs: List[WeatherLogIn]) -> WeatherInsightsOut:
    """
    Recebe uma lista de logs (WeatherLogIn) e devolve os insights calculados.
    Essa é a rota que o Nest vai chamar.
    """
    if not logs:
        return WeatherInsightsOut(
            count=0,
            averageTemperature=None,
            averageHumidity=None,
            maxTemperature=None,
            minTemperature=None,
            trend=None,
            comfortIndex=None,
            summary="Nenhum registro de clima recebido ainda.",
        )

    temps = [log.temperature for log in logs]
    hums = [log.humidity for log in logs]

    avg_temp = _calc_average(temps)
    avg_hum = _calc_average(hums)

    nums_t = _safe_numbers(temps)
    max_temp = max(nums_t) if nums_t else None
    min_temp = min(nums_t) if nums_t else None

    trend = _calc_trend(temps)
    comfort = _calc_comfort_index(avg_temp, avg_hum)
    summary = _build_summary(len(logs), avg_temp, avg_hum, trend, comfort)

    if avg_temp is not None:
        avg_temp = round(avg_temp, 1)
    if avg_hum is not None:
        avg_hum = round(avg_hum, 1)

    return WeatherInsightsOut(
        count=len(logs),
        averageTemperature=avg_temp,
        averageHumidity=avg_hum,
        maxTemperature=max_temp,
        minTemperature=min_temp,
        trend=trend,
        comfortIndex=comfort,
        summary=summary,
    )


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


async def fetch_weather_from_open_meteo() -> Optional[WeatherLogIn]:
    """
    Busca dados atuais de clima na Open-Meteo e converte para WeatherLogIn.
    """
    params = {
        "latitude": WEATHER_LAT,
        "longitude": WEATHER_LON,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "timezone": WEATHER_TIMEZONE,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(OPEN_METEO_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()

    current = data.get("current", {})

    temperature = current.get("temperature_2m")
    humidity = current.get("relative_humidity_2m")
    wind_speed = current.get("wind_speed_10m")
    weather_code = current.get("weather_code")

    condition = "desconhecido"
    if isinstance(weather_code, (int, float)):
        code = int(weather_code)
        if code == 0:
            condition = "clear"
        elif code in (1, 2, 3):
            condition = "clouds"
        elif 51 <= code <= 67:
            condition = "drizzle"
        elif 71 <= code <= 77:
            condition = "snow"
        elif 80 <= code <= 82:
            condition = "rain"
        elif 95 <= code <= 99:
            condition = "storm"

    log = WeatherLogIn(
        timestamp=datetime.now(timezone.utc).isoformat(),
        location=WEATHER_CITY,
        temperature=float(temperature) if temperature is not None else None,
        humidity=float(humidity) if humidity is not None else None,
        windSpeed=float(wind_speed) if wind_speed is not None else None,
        condition=condition,
        source="python-open-meteo",
        userId=None,
    )

    return log


async def send_log_to_queue(log: WeatherLogIn) -> None:
    """
    Envia o log para a fila RabbitMQ que o worker Go consome.
    """
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=10)

        queue = await channel.declare_queue(RABBITMQ_QUEUE, durable=True)

        body = json.dumps(log.dict()).encode("utf-8")

        message = aio_pika.Message(
            body=body,
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )

        await channel.default_exchange.publish(
            message,
            routing_key=queue.name,
        )


async def collect_and_enqueue_weather() -> None:
    """
    Tarefa que será executada periodicamente:
    - chama a Open-Meteo
    - monta o JSON
    - publica na fila do RabbitMQ
    """
    try:
        log = await fetch_weather_from_open_meteo()
        if log is None:
            print("[python-insights] Nenhum dado retornado da Open-Meteo.")
            return

        await send_log_to_queue(log)
        print("[python-insights] Log de clima enviado para a fila com sucesso.")
    except Exception as exc:
        print(f"[python-insights] Erro ao coletar/enfileirar clima: {exc}")


scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def on_startup() -> None:
    """
    Inicia o scheduler assim que o FastAPI sobe.
    """
    scheduler.add_job(
        collect_and_enqueue_weather,
        trigger="interval",
        minutes=FETCH_INTERVAL_MINUTES,
        id="collect_weather_job",
        replace_existing=True,
    )
    scheduler.start()
    print(
        f"[python-insights] Scheduler iniciado. Coletando clima a cada "
        f"{FETCH_INTERVAL_MINUTES} minuto(s)."
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    scheduler.shutdown(wait=False)
