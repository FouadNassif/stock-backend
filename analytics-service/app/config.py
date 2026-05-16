from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str
    mongo_database: str = "stock-market"
    service_name: str = "analytics-service"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()