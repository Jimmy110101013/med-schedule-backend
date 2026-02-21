import os
import re
import json
from sqlalchemy.orm import Session
from database.db_setup import SessionLocal
from database.models import ExamRule

# 字典映射：將官方檔案的「中文」子科目，自動轉為你系統內的「英文」標準分類
CATEGORY_MAPPING = {
    "影像診斷學": "Imaging Diagnosis",
    "核子醫學": "Nuclear Medicine",
    "放射治療學": "Radiotherapy",
    "復健醫學": "Rehabilitation Medicine",
    "病理學": "Pathology&Laboratory",
    "病理學及實驗": "Pathology&Laboratory",
    "實驗診斷學": "Pathology&Laboratory"
}

def import_exam_rules_from_file(file_path: str):
    if not os.path.exists(file_path):
        print(f"⚠️ 找不到考試範圍檔案: {file_path}")
        return

    db: Session = SessionLocal()
    
    # 每次解析前，清空舊的規則表，確保資料庫 100% 聽命於這份實體檔案
    db.query(ExamRule).delete()

    success_count = 0
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or not line.startswith('['):
            continue

        # 1. 解析主科目 (提取 [] 內的文字)
        primary_match = re.search(r'\[(.*?)\]', line)
        primary_cat = primary_match.group(1).strip() if primary_match else ""

        # 2. 解析考試關鍵字 (提取 ]: 到 ( 之間的文字)
        keyword_match = re.search(r'\]:?\s*([^(\n]+)', line)
        keyword = keyword_match.group(1).strip() if keyword_match else ""

        # 3. 解析括號內的附屬科目
        categories = [primary_cat]
        sub_match = re.search(r'考科尚包括：(.*?)\)', line)
        if sub_match:
            sub_raw = sub_match.group(1)
            sub_chi_cats = sub_raw.split('、')
            for chi_cat in sub_chi_cats:
                clean_chi = chi_cat.strip()
                # 透過字典翻譯，找不到對應就維持原字串
                eng_cat = CATEGORY_MAPPING.get(clean_chi, clean_chi)
                if eng_cat not in categories:
                    categories.append(eng_cat)

        # 4. 寫入資料庫
        if keyword:
            rule = ExamRule(
                exam_keyword=keyword,
                target_categories=json.dumps(categories, ensure_ascii=False)
            )
            db.add(rule)
            success_count += 1

    db.commit()
    db.close()
    print(f"✅ 成功從檔案動態解析並載入 {success_count} 筆考試映射規則！")