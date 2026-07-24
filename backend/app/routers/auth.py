from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user, get_current_admin_user
from app.core.limiter import limiter

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse)
def signup(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(
        db,
        user_id=new_user.id,
        action="user_signup",
        resource_type="user",
        resource_id=new_user.id,
        request=request
    )

    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        log_action(
            db,
            user_id=None,
            action="login_failed",
            details={"attempted_email": credentials.email},
            request=request
        )
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    log_action(
        db,
        user_id=user.id,
        action="login_success",
        resource_type="user",
        resource_id=user.id,
        request=request
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/admin-only-test")
def admin_only_test(
    current_admin: User = Depends(get_current_admin_user)
):
    return {
        "message": f"Hello Admin {current_admin.email}, RBAC is working correctly."
    }