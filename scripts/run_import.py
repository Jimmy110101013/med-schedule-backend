import os
from database.db_setup import engine
from database.models import Base
from services.course_service import import_pdf_to_db
from services.exam_service import import_exam_rules_from_file

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

PDF_FILE_NAME = "114-2 醫四週課表-20260212.pdf"
PDF_PATH = os.path.join(BASE_DIR, PDF_FILE_NAME)  # 保持你原本放在根目錄的設定

# 🚀 讀取我們剛剛建立的考試範圍檔案
EXAM_FILE_NAME = "exam_schedule.txt"
EXAM_PATH = os.path.join(DATA_DIR, EXAM_FILE_NAME)

if __name__ == "__main__":
    print("🔨 正在檢查並建立資料庫結構...")
    Base.metadata.create_all(bind=engine)
    
    print("\n📥 [1/2] 讀取實體檔案，建立考試範圍規則...")
    import_exam_rules_from_file(EXAM_PATH)

    print("\n📥 [2/2] 開始解析 PDF 並匯入課表資料...")
    import_pdf_to_db(PDF_PATH)