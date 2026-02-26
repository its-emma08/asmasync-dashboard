from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/current")
async def get_weather():
    # San Luis Potosi (or dynamic coordinates)
    url = "https://api.open-meteo.com/v1/forecast?latitude=22.15&longitude=-100.97&current_weather=true"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json().get("current_weather", {})
        return {
            "temp": data.get("temperature", 20.0), 
            "wind": data.get("windspeed", 5.0), 
            "aqi": 45 # Simulated AQI
        }
