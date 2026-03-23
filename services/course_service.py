import os
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database.db_setup import SessionLocal
from database.models import Course
from schemas.course_schema import CourseSchema
from parser.pdf_reader import process_pdf_schedule

def import_pdf_to_db(pdf_path: str):
    """
    接收 PDF 路徑，執行解析、驗證，並寫入資料庫
    """
    allowed_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    resolved = os.path.abspath(pdf_path)
    if not resolved.startswith(allowed_dir + os.sep):
        print(f"❌ 路徑不在允許的 data/ 目錄中: {pdf_path}")
        return

    if not os.path.exists(resolved):
        print(f"❌ 找不到 PDF 檔案: {pdf_path}")
        return
        
    print(f"📂 開始解析 PDF: {os.path.basename(pdf_path)} ...這可能需要幾秒鐘")
    
    # 1. 呼叫 Phase 2 解析引擎 (轉為字典陣列)
    raw_courses = process_pdf_schedule(pdf_path)
    
    if not raw_courses:
        print("⚠️ 解析結果為空，請檢查 PDF 格式或解析邏輯。")
        return
        
    db: Session = SessionLocal()
    success_count = 0
    duplicate_count = 0
    error_count = 0

    print("💾 開始進行 Pydantic 驗證與資料庫寫入...")
    
    for raw_data in raw_courses:
        try:
            # 2. 通過 Pydantic 驗證閘門 (確保型別與必填欄位 100% 正確)
            validated_data = CourseSchema(**raw_data)
            
            # 🚀 關鍵修改：源頭清洗 (Data Sanitization)
            # 強制將科目名稱去頭去尾空白，並轉為「首字母大寫」的標準格式
            # 例如: "nuclear medicine" -> "Nuclear Medicine"
            # 特殊類別（PBL 等縮寫）保留原始大小寫
            PRESERVE_CASE_CATEGORIES = {"PBL", "Skill", "Exam", "Holiday", "國考複習"}
            raw_category = validated_data.category.strip() if validated_data.category else "Unknown"
            preserve_match = {c for c in PRESERVE_CASE_CATEGORIES if c.upper() == raw_category.upper()}
            clean_category = preserve_match.pop() if preserve_match else raw_category.title()
            
            # 3. 轉化為 SQLAlchemy 實體模型
            db_course = Course(
                date=validated_data.date,
                time_slot=validated_data.time_slot,
                category=clean_category,  # 👈 寫入清洗後的乾淨資料
                course_code=validated_data.course_code,
                topic=validated_data.topic,
                teacher=validated_data.teacher,
                # 將 Pydantic 的 Enum 物件轉回字串存入 DB
                attendance=validated_data.attendance.value, 
                study_progress="[]" # 👈 確保是乾淨的 JSON 字串陣列
            )
            
            # 4. 寫入資料庫
            db.add(db_course)
            db.commit()
            success_count += 1
            
        except IntegrityError:
            # 觸發了資料庫的「複合唯一鍵」約束，代表這堂課已經存在了
            db.rollback()
            duplicate_count += 1
        except Exception as e:
            # Pydantic 驗證失敗或其他未預期錯誤
            db.rollback()
            print(f"❌ 錯誤資料: {raw_data}\n原因: {e}")
            error_count += 1
            
    db.close()
    print("-" * 35)
    print("🎉 匯入作業結束！")
    print(f"✅ 成功新增: {success_count} 堂課")
    print(f"⏩ 重複略過: {duplicate_count} 堂課 (資料庫防呆機制生效)")
    print(f"❌ 解析錯誤: {error_count} 堂課")
    print("-" * 35)