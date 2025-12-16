const API_BASE_URL = import.meta.env.VITE_API_URL;

async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error("Erro na API: " + response.status + " - " + text);
  }

  return response.json();
}

export async function getWeatherLogs() {
  const response = await fetch(API_BASE_URL + "/weather", {
    method: "GET"
  });

  return handleResponse(response);
}

export type CreateWeatherPayload = {
  timestamp: string;
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  source: string;
};

export async function createWeatherLog(payload: CreateWeatherPayload) {
  const response = await fetch(API_BASE_URL + "/weather", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
}
