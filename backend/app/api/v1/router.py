from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, attendance

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Hierarchy"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
