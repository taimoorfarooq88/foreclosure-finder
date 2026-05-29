from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{(DATA_DIR / 'foreclosures.db').as_posix()}"
    api_host: str = "127.0.0.1"
    # Port 8000 is often blocked by Windows Hyper-V reservation; 8765 is a safer default.
    api_port: int = 8765

    scraper_user_agent: str = "ForeclosureFinder/0.1 (educational research)"
    scraper_delay_seconds: float = 2.0
    scraper_max_pages: int = 50


settings = Settings()
