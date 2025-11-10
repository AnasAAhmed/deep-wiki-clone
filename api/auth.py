from api.session import create_session
from fastapi import APIRouter, Depends, HTTPException, Response
from datetime import datetime
from .db import get_db 
import os
import random
import string
from pydantic import BaseModel,EmailStr
from fastapi.responses import JSONResponse
from psycopg2.extensions import connection as Conn
from passlib.context import CryptContext
from dotenv import load_dotenv
from resend import Resend

APP_URL = os.getenv("APP_URL", "http://localhost:3000")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL")
router = APIRouter(prefix="/auth", tags=["auth"])
# resend client
resend_client = Resend(api_key=os.getenv("RESEND_API_KEY"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    firstname: str
    lastname: str | None = None
    email: EmailStr
    password: str | None = None
    provider: str


class LoginRequest(BaseModel):
    email: str
    password: str


# Register
@router.post("/signup")
async def register_user(data: RegisterRequest, response: Response, db=Depends(get_db)):
    with db.cursor() as cur:
        # cCheck if user already exists
        cur.execute("SELECT id FROM users WHERE email=%s LIMIT 1", (data.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="User already exists")

        # generate a 6 digit verification code
        verification_code = "".join(random.choices(string.digits, k=6))

        if data.provider == "google":
            hashed_password = pwd_context.hash("google123")

            cur.execute(
                """
                INSERT INTO users (first_name, last_name, email, password,
                                   email_verify_token, provider, is_active,)
                VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
                RETURNING id, email
                """,
                (
                    data.firstname,
                    data.lastname or "",
                    data.email,
                    hashed_password,
                    verification_code,
                    data.provider,
                ),
            )
            new_user = cur.fetchone()
            db.commit()

            if not new_user:
                raise HTTPException(status_code=500, detail="Failed to insert Google user")

            user_id, role, is_hostVerify = new_user
            create_session(response, user_id, role or "user", is_hostVerify)
            return {"message": "User registered successfully (Google)", "status": "success"}

        # Credentials signup
        if not data.password:
            raise HTTPException(status_code=400, detail="Password required for credentials signup")

        hashed_password = pwd_context.hash(data.password)

        cur.execute(
            """
            INSERT INTO users (first_name, last_name, email, password,
                               email_verify_token)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE)
            RETURNING id, first_name, last_name, email
            """,
            (
                data.firstname,
                data.lastname or "",
                data.email,
                hashed_password,
                verification_code,
            ),
        )
        new_user = cur.fetchone()
        db.commit()

        if not new_user:
            raise HTTPException(status_code=500, detail="User creation failed")

        user_id, first_name, last_name, email = new_user

        # Send verification email
        verify_url = f"{APP_URL}/auth/forget/verify-email?email={email}&code={verification_code}"

        try:
            resend_client.emails.send(
                from_=f"WebExaltia <{RESEND_FROM_EMAIL}>",
                to=[data.email],
                subject="Email Verification Code — rrely.io",
                html=f"""
                    <h2>Welcome to rrely.io</h2>
                    <p>Your verification code is <strong>{verification_code}</strong>.</p>
                    <p>First Name: <strong>{first_name}</strong>.</p>
                    <p>Last Name: <strong>{last_name}</strong>.</p>
                    <p>Email: <strong>{email}</strong>.</p>
                    <p>Or click <a href="{verify_url}">here</a> to verify your email.</p>
                """,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

        create_session(response, user_id, email)
        return {"message": "User registered successfully", "status": "success"}


@router.post("/login")
async def login_user(data: LoginRequest, db:Conn = Depends(get_db)):
    with db.cursor() as cur:
        # Fetch user by email
        cur.execute("""
            SELECT id, email, password, role, email_verify_token
            FROM users WHERE email = %s LIMIT 1
        """, (data.email,))
        user = cur.fetchone()

        if not user:
            return JSONResponse(
                {"message": "Email Invalid", "status": "warning"}, status_code=309
            )

        user_id, password, email, email_verify_token = user

        if email_verify_token is not None:
            return JSONResponse(
                {"message": "Please Verify Your Email", "status": "warning"}, status_code=300
            )

        if not pwd_context.verify(data.password, password):
            return JSONResponse(
                {"message": "Password Invalid", "status": "warning"}, status_code=309
            )

        # Create session
        create_session(user_id,email)

        return JSONResponse(
            {"message": "Login Successfully", "status": "success"}, status_code=200
        )
