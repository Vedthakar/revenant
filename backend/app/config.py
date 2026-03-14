"""Application configuration loaded from environment variables."""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Symbiote API"
    app_env: str = "development"
    fastapi_debug: bool = Field(default=False, alias="FASTAPI_DEBUG")
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    anthropic_api_key: str = ""
    moorche_api_key: str = ""
    moorche_base_url: str = "https://api.moorcheh.ai/v1"
    nango_secret_key: str = ""
    nango_public_key: str = ""
    nango_base_url: str = "https://api.nango.dev"
    tavus_api_key: str = ""
    tavus_replica_id: str = "rf4e9d9790f0"
    tavus_persona_id: str = ""

    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql+asyncpg://symbiote:symbiote@localhost:5432/symbiote"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    fastapi_port: int = 8000
    fastapi_base_url: str = "http://127.0.0.1:8000"


settings = Settings()
