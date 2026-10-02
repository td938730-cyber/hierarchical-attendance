import pytest
from app.services.user_service import get_subordinate_ids, would_cause_cycle, build_hierarchy_tree
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import UserRole
from tests.conftest import get_auth_headers

def test_downline_subordinates_traversal(db_session, seed_test_hierarchy):
    data = seed_test_hierarchy
    mgr = data["manager"]
    lead = data["lead"]
    emp = data["emp"]

    # All downline reports under manager should be lead + emp
    all_downline = get_subordinate_ids(db_session, manager_id=mgr.id, direct_only=False)
    assert set(all_downline) == {lead.id, emp.id}

    # Direct reports under manager should only be lead
    direct_only = get_subordinate_ids(db_session, manager_id=mgr.id, direct_only=True)
    assert direct_only == [lead.id]

def test_cycle_prevention(db_session, seed_test_hierarchy):
    data = seed_test_hierarchy
    mgr = data["manager"]
    lead = data["lead"]
    emp = data["emp"]

    # A user cannot be their own manager
    assert would_cause_cycle(db_session, user_id=mgr.id, new_manager_id=mgr.id) is True

    # emp reports to lead, lead reports to mgr.
    # Setting mgr's manager to emp must be detected as cycle!
    assert would_cause_cycle(db_session, user_id=mgr.id, new_manager_id=emp.id) is True

    # Setting lead's manager to emp must also be detected as cycle
    assert would_cause_cycle(db_session, user_id=lead.id, new_manager_id=emp.id) is True

def test_hierarchy_tree_endpoint(client, seed_test_hierarchy):
    data = seed_test_hierarchy
    admin = data["admin"]
    mgr = data["manager"]

    # Admin gets full tree
    headers = get_auth_headers(admin)
    res = client.get("/api/v1/users/hierarchy/tree", headers=headers)
    assert res.status_code == 200
    tree = res.json()
    assert len(tree) >= 1
    # Check top node is admin
    assert tree[0]["id"] == admin.id
    assert len(tree[0]["subordinates"]) >= 1

    # Manager gets subtree rooted at manager
    mgr_headers = get_auth_headers(mgr)
    res_mgr = client.get("/api/v1/users/hierarchy/tree", headers=mgr_headers)
    assert res_mgr.status_code == 200
    mgr_tree = res_mgr.json()
    assert len(mgr_tree) == 1
    assert mgr_tree[0]["id"] == mgr.id
