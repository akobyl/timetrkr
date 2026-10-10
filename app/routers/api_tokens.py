from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api-tokens", tags=["api-tokens"])

# Token management requires a login session, so a leaked API token
# cannot be used to mint new tokens or revoke others.


@router.post(
    "/", response_model=schemas.ApiTokenCreated, status_code=status.HTTP_201_CREATED
)
def create_api_token(
    body: schemas.ApiTokenCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_session_user),
):
    """Create an API token. The plaintext token is only returned here."""
    token = auth.generate_api_token()
    api_token = models.ApiToken(
        user_id=current_user.id,
        name=body.name,
        token_hash=auth.hash_api_token(token),
    )
    db.add(api_token)
    db.commit()
    db.refresh(api_token)
    return {**schemas.ApiToken.model_validate(api_token).model_dump(), "token": token}


@router.get("/", response_model=List[schemas.ApiToken])
def list_api_tokens(
    current_user: models.User = Depends(auth.get_session_user),
):
    """List the current user's API tokens (without the token values)."""
    return current_user.api_tokens


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_session_user),
):
    """Revoke an API token"""
    api_token = (
        db.query(models.ApiToken)
        .filter(
            models.ApiToken.id == token_id, models.ApiToken.user_id == current_user.id
        )
        .first()
    )
    if api_token is None:
        raise HTTPException(status_code=404, detail="API token not found")
    db.delete(api_token)
    db.commit()
    return None
