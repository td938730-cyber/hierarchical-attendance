from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, HierarchyNode
from app.services import user_service

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[UserRole] = None,
    manager_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
) -> Any:
    """Retrieve list of users. Accessible by Admin and Manager."""
    return user_service.get_users(
        db, skip=skip, limit=limit, role=role, manager_id=manager_id, search=search
    )

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> Any:
    """Create new user. Admin only."""
    existing_user = user_service.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    if user_in.manager_id:
        mgr = user_service.get_user_by_id(db, user_in.manager_id)
        if not mgr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned manager not found."
            )
        if mgr.role == UserRole.EMPLOYEE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only ADMIN or MANAGER roles can be assigned as a manager."
            )

    return user_service.create_user(db, user_in)

@router.get("/hierarchy/tree", response_model=List[HierarchyNode])
def read_hierarchy_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get organization tree.
    Admins see full company hierarchy.
    Managers see tree rooted at themselves.
    Employees see themselves.
    """
    if current_user.role == UserRole.ADMIN:
        return user_service.build_hierarchy_tree(db, root_user_id=None)
    else:
        return user_service.build_hierarchy_tree(db, root_user_id=current_user.id)

@router.get("/hierarchy/subordinates", response_model=List[UserResponse])
def read_subordinates(
    direct_only: bool = Query(False, description="Filter for direct reports only"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
) -> Any:
    """
    Get list of subordinate user profiles.
    Default shows all downline reports (both direct & indirect).
    """
    sub_ids = user_service.get_subordinate_ids(
        db, manager_id=current_user.id, include_self=False, direct_only=direct_only
    )
    if not sub_ids:
        return []
    return [user_service.get_user_by_id(db, uid) for uid in sub_ids if user_service.get_user_by_id(db, uid)]

@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get specific user details."""
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Permission check: Self, Admin, or Manager of this user
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        sub_ids = user_service.get_subordinate_ids(db, manager_id=current_user.id, direct_only=False)
        if user_id not in sub_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> Any:
    """Update user information, role, or manager. Admin only."""
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_in.manager_id is not None:
        mgr = user_service.get_user_by_id(db, user_in.manager_id)
        if not mgr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found")
        if mgr.role == UserRole.EMPLOYEE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned manager must be Admin or Manager role")

    try:
        updated = user_service.update_user(db, user, user_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return updated

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> None:
    """Delete a user. Admin only."""
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot delete their own account")
    success = user_service.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
