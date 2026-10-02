from typing import Optional, List, Dict, Any, Set
from collections import deque
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    manager_id: Optional[int] = None,
    search: Optional[str] = None
) -> List[User]:
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if manager_id is not None:
        query = query.where(User.manager_id == manager_id)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_filter),
                User.email.ilike(search_filter)
            )
        )
    return list(db.scalars(query.offset(skip).limit(limit)).all())

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=user_in.role,
        is_active=user_in.is_active,
        manager_id=user_in.manager_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def would_cause_cycle(db: Session, user_id: int, new_manager_id: int) -> bool:
    """Checks whether assigning new_manager_id to user_id creates a circular reporting loop."""
    if user_id == new_manager_id:
        return True
    
    # Traverse upwards from new_manager_id
    curr_id: Optional[int] = new_manager_id
    visited: Set[int] = set()
    while curr_id is not None:
        if curr_id == user_id:
            return True
        if curr_id in visited:
            break
        visited.add(curr_id)
        mgr = db.get(User, curr_id)
        curr_id = mgr.manager_id if mgr else None
    return False

def update_user(db: Session, user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data.pop("password"))
    
    if "manager_id" in update_data and update_data["manager_id"] is not None:
        new_mgr_id = update_data["manager_id"]
        if would_cause_cycle(db, user.id, new_mgr_id):
            raise ValueError("Circular reporting hierarchy detected. A user cannot report to their own subordinate.")
    
    for field, value in update_data.items():
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> bool:
    user = db.get(User, user_id)
    if not user:
        return False
    # Set direct reports' manager_id to NULL
    direct_reports = db.scalars(select(User).where(User.manager_id == user_id)).all()
    for report in direct_reports:
        report.manager_id = None
        db.add(report)
    db.delete(user)
    db.commit()
    return True

def get_subordinate_ids(
    db: Session,
    manager_id: int,
    include_self: bool = False,
    direct_only: bool = False
) -> List[int]:
    """
    Retrieves all direct and/or indirect subordinate user IDs for a manager.
    Uses BFS traversal to safely traverse hierarchy trees and prevent infinite loops.
    """
    if direct_only:
        direct_ids = list(db.scalars(select(User.id).where(User.manager_id == manager_id)).all())
        if include_self:
            direct_ids.append(manager_id)
        return direct_ids

    subordinate_ids: List[int] = []
    queue: deque[int] = deque([manager_id])
    visited: Set[int] = {manager_id}

    while queue:
        current_mgr = queue.popleft()
        children = db.scalars(select(User.id).where(User.manager_id == current_mgr)).all()
        for child_id in children:
            if child_id not in visited:
                visited.add(child_id)
                subordinate_ids.append(child_id)
                queue.append(child_id)

    if include_self:
        subordinate_ids.append(manager_id)
    return subordinate_ids

def build_hierarchy_tree(db: Session, root_user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Constructs the organizational tree as nested dicts.
    If root_user_id is given, returns subtree rooted at that user.
    Otherwise returns trees rooted at top-level managers/admins (manager_id is None).
    """
    all_users = list(db.scalars(select(User).where(User.is_active == True)).all())
    user_map: Dict[int, Dict[str, Any]] = {}
    children_map: Dict[Optional[int], List[int]] = {}

    for u in all_users:
        user_map[u.id] = {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "manager_id": u.manager_id,
            "subordinates": []
        }
        mgr_id = u.manager_id
        if mgr_id not in children_map:
            children_map[mgr_id] = []
        children_map[mgr_id].append(u.id)

    def attach_children(node_id: int) -> Dict[str, Any]:
        node = user_map[node_id]
        child_ids = children_map.get(node_id, [])
        node["subordinates"] = [attach_children(cid) for cid in child_ids if cid in user_map]
        return node

    if root_user_id:
        if root_user_id in user_map:
            return [attach_children(root_user_id)]
        return []

    # All top-level nodes (manager_id is None or manager not in active users)
    roots = []
    for u in all_users:
        if u.manager_id is None or u.manager_id not in user_map:
            roots.append(attach_children(u.id))
    return roots
