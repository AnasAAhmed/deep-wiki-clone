from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from .db import get_db 


router = APIRouter(prefix="/subscription", tags=["subscription"])

# Check remaining tokens / tries
@router.get("/usage/{user_id}")
async def get_usage(user_id: int, db=Depends(get_db)):
    with db.cursor() as cur:
        cur.execute(
            "SELECT tokens_remaining, tries_remaining, plan FROM user_credits WHERE user_id=%s",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {"tokens_remaining": row[0], "tries_remaining": row[1], "plan": row[2]}

# Deduct token / try
@router.post("/use/{user_id}")
async def use_token(user_id: int, db=Depends(get_db)):
    with db.cursor() as cur:
        # Check remaining tries
        cur.execute("SELECT tokens_remaining, tries_remaining FROM user_credits WHERE user_id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        tokens, tries = row
        if tokens == 0 or tries == 0:
            raise HTTPException(status_code=403, detail="No tokens/tries remaining")
        cur.execute(
            "UPDATE user_credits SET tokens_remaining=tokens_remaining-1, tries_remaining=tries_remaining-1, last_access=NOW() WHERE user_id=%s",
            (user_id,)
        )
        return {"tokens_remaining": tokens-1, "tries_remaining": tries-1}