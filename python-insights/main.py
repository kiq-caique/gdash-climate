from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Lista em memória (por enquanto)
logs_buffer = []

class WeatherLog(BaseModel):
    timestamp: str
    location: str
    temperature: float
    humidity: float
    windSpeed: float
    condition: str
    source: str


@app.get("/insights/from-logs")
def get_insights():
    if len(logs_buffer) == 0:
        return {
            "count": 0,
            "items": []
        }

    temps = [l["temperature"] for l in logs_buffer]
    hums = [l["humidity"] for l in logs_buffer]

    return {
        "count": len(logs_buffer),
        "items": logs_buffer[-5:],  # últimos 5 registros
        "avg_temp": sum(temps) / len(temps),
        "avg_humidity": sum(hums) / len(hums)
    }


# Endpoint usado pelo Go Worker para enviar logs
@app.post("/insights/push")
def push_log(log: WeatherLog):
    logs_buffer.append(log.dict())
    return {"status": "ok", "stored": len(logs_buffer)}
