import re
from typing import Optional, Dict

def extract_course_info(raw_text: str) -> Optional[Dict[str, str]]:
    """
    將非結構化的課表字串，解析為標準化的字典格式。
    """
    # 抹平換行符號
    text = raw_text.strip().replace('\n', ' ')
    if not text:
        return None

    text_upper = text.upper()

    # ==========================================
    # 1. 絕對黑名單攔截網 (The Blacklist)
    # ==========================================
    # 🎯 新增 "CASE WRAPUP" 攔截：直接丟棄假 PBL 與行政宣告
    if "選修" in text or "PBL一對一訪談" in text or "CASE WRAPUP" in text_upper:
        return None 

    result = {
        "category": "",
        "course_code": "",
        "topic": "",
        "teacher": ""
    }

    # ==========================================
    # 2. 正宗 PBL 專屬過濾器
    # ==========================================
    # 既然假 PBL 已經在上面被殺掉了，剩下的包含 PBL 的就全都是真貨！
    if "PBL" in text_upper:
        result["category"] = "PBL"
        result["topic"] = text
        return result
        
    # ==========================================
    # 3. 非標準格式的後援機制 (假日等)
    # ==========================================
    if any(keyword in text for keyword in ["紀念日", "放假", "連假", "活動週", "勞動節"]):
        result["category"] = "Holiday"
        result["topic"] = text
        return result

    # ==========================================
    # 4. Regex 正規表達式萃取 (最大化寬容)
    # ==========================================
    bracket_match = re.match(r"^[\[【](.+?)[\]】]\s*:?\s*(.*)$", text)
    
    if bracket_match:
        result["category"] = bracket_match.group(1).strip()
        remainder = bracket_match.group(2).strip()
        
        parts = [p.strip() for p in remainder.split(',')]
        
        if len(parts) >= 3:
            result["course_code"] = parts[0]
            result["teacher"] = parts[-1]
            result["topic"] = ",".join(parts[1:-1])
        elif len(parts) == 2:
            result["course_code"] = parts[0]
            result["topic"] = parts[1]
        elif len(parts) == 1 and parts[0]:
            result["topic"] = parts[0]
    else:
        result["topic"] = text

    # ==========================================
    # 5. 分類覆寫機制 (Category Override)
    # ==========================================
    topic_upper = result["topic"].upper()
    
    if "國考" in text:
        result["category"] = "國考複習"
    elif any(kw in topic_upper for kw in ["考試", "期中考", "期末考"]):
        result["category"] = "Exam"
    elif "SKILL" in topic_upper or "技巧" in topic_upper:
        result["category"] = "Skill"

    return result