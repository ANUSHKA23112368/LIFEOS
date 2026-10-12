import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

logger = logging.getLogger("lifeos.database")

# In-Memory Fallback Implementation for Standalone / Offline Dev & Tests
class InMemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self._docs = list(docs)

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for key, direct in reversed(key_or_list):
                reverse = direct < 0
                self._docs.sort(key=lambda x: x.get(key, None) or "", reverse=reverse)
        elif isinstance(key_or_list, str):
            reverse = direction < 0
            self._docs.sort(key=lambda x: x.get(key_or_list, None) or "", reverse=reverse)
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return [dict(d) for d in self._docs[:length]]
        return [dict(d) for d in self._docs]

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return dict(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration


class InsertOneResult:
    def __init__(self, inserted_id: Any):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int):
        self.matched_count = matched_count
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "lifeos_database.json"

class InMemoryCollection:
    def __init__(self, name: str, parent_db=None):
        self.name = name
        self.parent_db = parent_db
        self._docs: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k.startswith("$"):
                continue
            doc_val = doc.get(k)
            if isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$gte" and not (doc_val is not None and doc_val >= op_val):
                        return False
                    if op == "$gt" and not (doc_val is not None and doc_val > op_val):
                        return False
                    if op == "$lte" and not (doc_val is not None and doc_val <= op_val):
                        return False
                    if op == "$lt" and not (doc_val is not None and doc_val < op_val):
                        return False
                    if op == "$ne" and doc_val == op_val:
                        return False
                    if op == "$in" and doc_val not in op_val:
                        return False
                    if op == "$nin" and doc_val in op_val:
                        return False
            else:
                if doc_val != v:
                    return False
        return True

    async def _notify_change(self):
        if self.parent_db:
            await self.parent_db.save_to_disk()

    async def insert_one(self, document: Dict[str, Any]) -> InsertOneResult:
        async with self._lock:
            doc = dict(document)
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            self._docs.append(doc)
            await self._notify_change()
            return InsertOneResult(doc["_id"])

    async def find_one(self, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            for doc in self._docs:
                if self._matches(doc, filter):
                    return dict(doc)
            return None

    def find(self, filter: Optional[Dict[str, Any]] = None) -> InMemoryCursor:
        filter = filter or {}
        matched = [doc for doc in self._docs if self._matches(doc, filter)]
        return InMemoryCursor(matched)

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> UpdateResult:
        async with self._lock:
            for i, doc in enumerate(self._docs):
                if self._matches(doc, filter):
                    if "$set" in update:
                        doc.update(update["$set"])
                    if "$inc" in update:
                        for ik, iv in update["$inc"].items():
                            doc[ik] = doc.get(ik, 0) + iv
                    if "$push" in update:
                        for pk, pv in update["$push"].items():
                            doc.setdefault(pk, []).append(pv)
                    self._docs[i] = doc
                    await self._notify_change()
                    return UpdateResult(1, 1)

            if upsert:
                new_doc = dict(filter)
                if "$set" in update:
                    new_doc.update(update["$set"])
                if "_id" not in new_doc:
                    new_doc["_id"] = str(uuid.uuid4())
                self._docs.append(new_doc)
                await self._notify_change()
                return UpdateResult(0, 1)

            return UpdateResult(0, 0)

    async def delete_one(self, filter: Dict[str, Any]) -> DeleteResult:
        async with self._lock:
            for i, doc in enumerate(self._docs):
                if self._matches(doc, filter):
                    self._docs.pop(i)
                    await self._notify_change()
                    return DeleteResult(1)
            return DeleteResult(0)

    async def delete_many(self, filter: Dict[str, Any]) -> DeleteResult:
        async with self._lock:
            before = len(self._docs)
            self._docs = [doc for doc in self._docs if not self._matches(doc, filter)]
            if len(self._docs) != before:
                await self._notify_change()
            return DeleteResult(before - len(self._docs))

    async def count_documents(self, filter: Dict[str, Any]) -> int:
        async with self._lock:
            return sum(1 for doc in self._docs if self._matches(doc, filter))

    async def create_index(self, *args, **kwargs):
        pass


class InMemoryDatabase:
    def __init__(self, name: str):
        self.name = name
        self._collections: Dict[str, InMemoryCollection] = {}
        self._load_from_disk()

    def _load_from_disk(self):
        if os.environ.get("TESTING") == "1" or "test" in self.name.lower():
            return
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            if DATA_FILE.exists():
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        col = InMemoryCollection(col_name, parent_db=self)
                        col._docs = docs
                        self._collections[col_name] = col
                logger.info(f"Loaded persistent database from {DATA_FILE}")
        except Exception as e:
            logger.warning(f"Could not load database file: {e}")

    async def save_to_disk(self):
        if os.environ.get("TESTING") == "1" or "test" in self.name.lower():
            return
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            data = {}
            for col_name, col in self._collections.items():
                data[col_name] = col._docs
            temp_file = DATA_FILE.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
            if temp_file.exists():
                temp_file.replace(DATA_FILE)
        except Exception as e:
            logger.warning(f"Could not save database file: {e}")

    def clear(self):
        self._collections.clear()

    def __getitem__(self, item: str) -> InMemoryCollection:
        if item not in self._collections:
            self._collections[item] = InMemoryCollection(item, parent_db=self)
        return self._collections[item]

    def __getattr__(self, name: str) -> InMemoryCollection:
        return self[name]

    def get_collection(self, name: str) -> InMemoryCollection:
        return self[name]


# Global database references
client = None
db = None
is_in_memory: bool = False


async def connect_to_database():
    global client, db, is_in_memory
    from app.core.config import settings

    if settings.MONGODB_URL:
        try:
            import motor.motor_asyncio
            logger.info("Connecting to MongoDB at configured URL...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=3000
            )
            # Test connection
            await client.admin.command('ping')
            db = client[settings.DATABASE_NAME]
            is_in_memory = False
            logger.info(f"Connected to live MongoDB database: {settings.DATABASE_NAME}")
            await create_indexes()
            return
        except Exception as e:
            logger.warning(f"Could not connect to live MongoDB ({e}). Falling back to in-memory store.")

    # In-memory fallback
    logger.info("Using in-memory asynchronous storage engine.")
    db = InMemoryDatabase(settings.DATABASE_NAME)
    is_in_memory = True


async def close_database():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")


async def create_indexes():
    """Ensure database indexes exist for performance & uniqueness."""
    if db is None or is_in_memory:
        return
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.activities.create_index([("user_id", 1), ("date", 1)])
        await db.tasks.create_index([("user_id", 1), ("status", 1)])
        await db.focus_sessions.create_index([("user_id", 1), ("created_at", -1)])
        await db.habits.create_index([("user_id", 1)])
        await db.goals.create_index([("user_id", 1)])
        await db.daily_reviews.create_index([("user_id", 1), ("date", 1)], unique=True)
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


def get_db():
    global db
    if db is None:
        from app.core.config import settings
        db = InMemoryDatabase(settings.DATABASE_NAME)
    return db
