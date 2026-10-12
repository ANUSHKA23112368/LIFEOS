from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid
from app.models.user import (
    UserRegisterRequest, 
    UserLoginRequest, 
    UserResponse, 
    TokenResponse, 
    UpdateProfileRequest,
    UserPreferences
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.demo_data import DemoDataService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest):
    db = get_db()
    email = request.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    default_prefs = UserPreferences().model_dump()

    user_doc = {
        "id": user_id,
        "name": request.name.strip(),
        "email": email,
        "hashed_password": get_password_hash(request.password),
        "preferences": default_prefs,
        "created_at": now
    }
    await db.users.insert_one(user_doc)

    token = create_access_token({"sub": user_id, "email": email})
    user_response = UserResponse(
        id=user_id,
        name=user_doc["name"],
        email=email,
        preferences=UserPreferences(**default_prefs),
        created_at=now
    )
    return TokenResponse(access_token=token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    db = get_db()
    email = request.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(request.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": user["id"], "email": email})
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        preferences=UserPreferences(**user.get("preferences", {})),
        created_at=user.get("created_at", "")
    )
    return TokenResponse(access_token=token, user=user_response)

@router.post("/demo-login", response_model=TokenResponse)
async def demo_login():
    """Allows instant preview with pre-seeded sample data, clearly isolated."""
    db = get_db()
    demo_email = "demo@lifeos.app"
    user = await db.users.find_one({"email": demo_email})
    now = datetime.now(timezone.utc).isoformat()

    if not user:
        user_id = str(uuid.uuid4())
        prefs = UserPreferences(
            occupation="professional",
            onboarding_completed=True
        ).model_dump()
        user = {
            "id": user_id,
            "name": "Alex Mercer (Demo)",
            "email": demo_email,
            "hashed_password": get_password_hash("LifeOSDemo2026!"),
            "preferences": prefs,
            "created_at": now
        }
        await db.users.insert_one(user)

        # Prepopulate demo dataset for today
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        dataset = DemoDataService.generate_demo_dataset(user_id, today_str)
        for act in dataset["activities"]:
            await db.activities.insert_one(act)
        for tsk in dataset["tasks"]:
            await db.tasks.insert_one(tsk)
        for foc in dataset["focus_sessions"]:
            await db.focus_sessions.insert_one(foc)
        for hab in dataset["habits"]:
            await db.habits.insert_one(hab)
        for gol in dataset["goals"]:
            await db.goals.insert_one(gol)
        for rev in dataset["daily_reviews"]:
            await db.daily_reviews.insert_one(rev)

    token = create_access_token({"sub": user["id"], "email": demo_email})
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=demo_email,
        preferences=UserPreferences(**user.get("preferences", {})),
        created_at=user.get("created_at", now)
    )
    return TokenResponse(access_token=token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        preferences=UserPreferences(**current_user.get("preferences", {})),
        created_at=current_user.get("created_at", "")
    )

@router.put("/me", response_model=UserResponse)
async def update_profile(request: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {}
    if request.name:
        update_data["name"] = request.name.strip()
    if request.preferences:
        update_data["preferences"] = request.preferences.model_dump()

    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
        updated = await db.users.find_one({"id": current_user["id"]})
        current_user = updated or current_user

    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        preferences=UserPreferences(**current_user.get("preferences", {})),
        created_at=current_user.get("created_at", "")
    )

@router.post("/onboarding", response_model=UserResponse)
async def complete_onboarding(prefs: UserPreferences, current_user: dict = Depends(get_current_user)):
    db = get_db()
    prefs.onboarding_completed = True
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"preferences": prefs.model_dump()}}
    )
    updated = await db.users.find_one({"id": current_user["id"]})
    return UserResponse(
        id=updated["id"],
        name=updated["name"],
        email=updated["email"],
        preferences=UserPreferences(**updated["preferences"]),
        created_at=updated.get("created_at", "")
    )
