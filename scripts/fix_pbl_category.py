"""Fix PBL category case: 'Pbl' -> 'PBL' in the database.

The .title() sanitization in course_service.py incorrectly converted 'PBL' to 'Pbl'.
Run once to correct existing records.

Usage: python -m scripts.fix_pbl_category
"""
from sqlalchemy import text
from database.db_setup import SessionLocal

def fix_pbl_category():
    db = SessionLocal()
    try:
        result = db.execute(text("UPDATE courses SET category = 'PBL' WHERE category = 'Pbl'"))
        count = result.rowcount
        db.commit()
        print(f"Updated {count} record(s) from 'Pbl' to 'PBL'.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_pbl_category()
