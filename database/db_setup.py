import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# 載入 .env 檔案中的環境變數
load_dotenv()

# 讀取連線字串
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ 找不到 DATABASE_URL，請確認專案根目錄下有 .env 檔案！")

# SQLAlchemy 1.4+ 要求使用 postgresql:// 而不是 postgres://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 🚀 雲端 PostgreSQL 的引擎設定 (拔除 SQLite 專用的 check_same_thread)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()