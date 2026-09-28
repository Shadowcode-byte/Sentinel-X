from app.core.database import Base, engine
from app.models import SecurityEvent


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Sentinel-X database initialized successfully.")