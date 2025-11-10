import os
import time
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Request, Response, HTTPException
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SESSION_SECRET", "defaultsecret")
ALGORITHM = "HS256"
SEVEN_DAYS = 7 * 24 * 60 * 60  # 7 days in seconds


def create_session(response: Response, user_id: int, email:str):
    """
    Create a JWT token and set it as a secure, HTTP-only cookie.
    """
    exp_time = datetime.utcnow() + timedelta(seconds=SEVEN_DAYS)
    payload = {
        "userId": user_id,
        "email": email,
        "exp": int(exp_time.timestamp()),
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        secure=os.getenv("NODE_ENV") == "production",
        samesite="lax",
        expires=int(exp_time.timestamp()),
        path="/",
    )

    return {"token": token, "expiresAt": exp_time}


def get_session(request: Request):
    """
    Get and validate the JWT session token from cookies.
    """
    token = request.cookies.get("session")
    if not token:
        return {
            "success": False,
            "userId": None,
            "email": None,
            "message": "Session not found",
        }

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "success": True,
            "userId": payload.get("userId"),
           "email": payload.get("email"),
            "message": "Session successfully retrieved",
        }
    except JWTError:
        return {
            "success": False,
            "userId": None,
            "email": None,
            "message": "Invalid or expired session",
        }


def update_session(response: Response, request: Request):
    """
    Refresh session token (extend expiry by another 7 days).
    """
    token = request.cookies.get("session")
    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

    new_exp = datetime.utcnow() + timedelta(seconds=SEVEN_DAYS)
    payload["exp"] = int(new_exp.timestamp())

    new_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    response.set_cookie(
        key="session",
        value=new_token,
        httponly=True,
        secure=os.getenv("NODE_ENV") == "production",
        samesite="lax",
        expires=int(new_exp.timestamp()),
        path="/",
    )

    return {"token": new_token, "expiresAt": new_exp}


def delete_session(response: Response):
    """
    Delete session cookie (logout).
    """
    response.delete_cookie("session")
    return {"success": True, "message": "Session deleted"}
