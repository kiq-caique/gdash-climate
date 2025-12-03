from typing import List, Optional
from math import isnan

from fastapi import FastAPI
from pydantic import BaseModel


# ----------------------------
# MODELOS (devem bater com o Nest)
# ----------------------------

class WeatherLogIn(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[str] = None
    location: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    windSpeed: Optional[float] = None
    condition: Optional[str] = None
    source: Optional[str] = None
    userId: Optional[str] = None  # se um dia quiser mandar


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


# ----------------------------
# Funções helpers de cálculo
# ----------------------------

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


def _calc_comfort_index(avg_temp: Optional[float], avg_humidity: Optional[float]) -> Optional[float]:
    """
    Índice tosco só pra ter um numerozinho bonitinho:
    quanto mais perto de 24°C e 50% umidade, melhor (mais próximo de 100).
    """
    if avg_temp is None or avg_humidity is None:
        return None

    # distância "ideal"
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


# ----------------------------
# ROTA PRINCIPAL DE INSIGHTS
# ----------------------------

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
            summary="Nenhum registro de clima recebido ainda."
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

    # arredonda bonitinho
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
