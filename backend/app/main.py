from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, admin, transports, reports, warehouses, details, plants, vehicles, trailers, employees


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Система учета автоперевозок", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    https_only=False,
    same_site="lax"
)

app.include_router(auth.router)
app.include_router(transports.router)
app.include_router(reports.router)

app.include_router(warehouses.router)
app.include_router(details.router)
app.include_router(plants.router)
app.include_router(vehicles.router)
app.include_router(trailers.router)
app.include_router(employees.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}