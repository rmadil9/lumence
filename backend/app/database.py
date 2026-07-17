import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine, text

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session


def ping_db() -> None:
    with Session(engine) as session:
        session.exec(text("SELECT 1"))
