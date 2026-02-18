from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, create_engine, Session


# 1. データの型を定義
class AnalysisHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")  # 誰が実行したか
    filename: str
    result_json: str  # JSON文字列として保存
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str


# 2. DBとの接続設定
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})


# 3. テーブルの作成
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
