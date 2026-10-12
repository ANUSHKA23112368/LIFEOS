import os
os.environ["TESTING"] = "1"

import pytest
from app.core.database import get_db

@pytest.fixture(autouse=True)
def clean_db():
    db = get_db()
    if hasattr(db, "clear"):
        db.clear()
    yield
    if hasattr(db, "clear"):
        db.clear()
