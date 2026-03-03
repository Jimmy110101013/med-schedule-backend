from database.db_setup import SessionLocal
from database.models import Course

def inspect_database():
    db = SessionLocal()
    
    # 將所有課程按照日期與時間排序撈出
    courses = db.query(Course).order_by(Course.date, Course.time_slot).all()
    
    if not courses:
        print("⚠️ 資料庫目前是空的！")
        return
        
    print(f"📊 資料庫總共有 {len(courses)} 堂課\n")
    
    print("=== 📌 前 10 堂課預覽 (檢查開學週是否正確) ===")
    for c in courses[:10]:
        print(f"[{c.date} | {c.time_slot}] 【{c.category}】 代碼:{c.course_code} | {c.topic} ({c.teacher})")
        
    print("\n=== 📌 後 5 堂課預覽 (檢查期末或國考週是否抓到) ===")
    for c in courses[-5:]:
        print(f"[{c.date} | {c.time_slot}] 【{c.category}】 代碼:{c.course_code} | {c.topic} ({c.teacher})")
        
    print("\n=== 📌 分類統計 (檢查有沒有漏掉大科) ===")
    category_counts = {}
    for c in courses:
        # 如果分類為空字串，給個標記方便觀察
        cat_name = c.category if c.category else "未分類 (異常)" 
        category_counts[cat_name] = category_counts.get(cat_name, 0) + 1
        
    # 按照數量由大到小排序印出
    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"- {cat}: {count} 堂")
        
    db.close()

if __name__ == "__main__":
    inspect_database()