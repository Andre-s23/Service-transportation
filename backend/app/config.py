from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:qazwsx@localhost:5432/transport_db"
    SECRET_KEY: str = "qazwsx"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()