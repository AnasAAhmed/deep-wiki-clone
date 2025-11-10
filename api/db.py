import os
import psycopg2
from fastapi import Depends
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    """
    FastAPI dependency that provides a psycopg2 connection per request.
    """
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()  # Commit changes if any
    except Exception:
        conn.rollback()  # Rollback on error
        raise
    finally:
        conn.close()  # Always close connection
