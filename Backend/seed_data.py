"""Script to seed initial data for SDMIS 69"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# SDMIS 69 Stations
STATIONS = [
    {"name": "CIS Lyon Duchère", "type": "caserne", "groupement": "Centre"},
    {"name": "CIS Lyon Gerland", "type": "caserne", "groupement": "Sud"},
    {"name": "CIS Lyon Croix-Rousse", "type": "caserne", "groupement": "Nord"},
    {"name": "CIS Villeurbanne", "type": "caserne", "groupement": "Est"},
    {"name": "CIS Caluire", "type": "caserne", "groupement": "Nord"},
    {"name": "CIS Vénissieux", "type": "caserne", "groupement": "Sud"},
    {"name": "CIS Bron", "type": "caserne", "groupement": "Est"},
    {"name": "CIS Décines", "type": "caserne", "groupement": "Est"},
    {"name": "CIS Givors", "type": "caserne", "groupement": "Sud"},
    {"name": "CIS Tarare", "type": "caserne", "groupement": "Ouest"},
    {"name": "Direction Départementale", "type": "service", "groupement": None},
    {"name": "Service RH", "type": "service", "groupement": None},
    {"name": "Service Matériel", "type": "service", "groupement": None},
    {"name": "Service Formation", "type": "service", "groupement": None},
]

async def seed_stations():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if stations already exist
    existing_count = await db.stations.count_documents({})
    if existing_count > 0:
        print(f"Stations already exist ({existing_count} found). Skipping seed.")
        client.close()
        return
    
    # Insert stations
    stations_to_insert = []
    for station in STATIONS:
        station['created_at'] = datetime.utcnow()
        stations_to_insert.append(station)
    
    result = await db.stations.insert_many(stations_to_insert)
    print(f"Successfully seeded {len(result.inserted_ids)} stations for SDMIS 69")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_stations())
