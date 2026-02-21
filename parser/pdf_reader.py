import pdfplumber
import re
from typing import List, Dict
from parser.text_extractor import extract_course_info

def process_pdf_schedule(pdf_path: str) -> List[Dict]:
    parsed_courses = []
    current_year = 2026
    current_month = 2
    last_day = 0

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words()
            if not words: 
                continue

            # ==========================================
            # 1. 抓取 Y 軸時間錨點 (自動 24 小時制轉換)
            # ==========================================
            time_anchors = []
            for w in words:
                if w['x0'] < 60 and re.match(r'^(0[1-9]|1[0-2])$', w['text']):
                    raw_h = int(w['text'])
                    hour_24 = raw_h + 12 if raw_h <= 6 else raw_h
                    time_anchors.append({'hour': hour_24, 'top': w['top']})
            time_anchors.sort(key=lambda x: x['top'])
            if not time_anchors: 
                continue

            # ==========================================
            # 2. 抓取 X 軸日期錨點與推算跨月
            # ==========================================
            date_anchors = []
            for w in words:
                match = re.search(r'^(\d+)日$', w['text'])
                if match and w['top'] < time_anchors[0]['top']:
                    date_anchors.append({'day': int(match.group(1)), 'x_center': w['x0']})
            date_anchors.sort(key=lambda x: x['x_center'])
            if len(date_anchors) < 3: 
                continue

            page_width = page.width
            time_col_width = 65
            day_col_width = (page_width - time_col_width - 40) / 5

            column_dates = []
            for i in range(5):
                if i < len(date_anchors):
                    day = date_anchors[i]['day']
                    if last_day != 0 and day < last_day and (last_day - day) > 10:
                        current_month = (current_month % 12) + 1
                        if current_month == 1: 
                            current_year += 1
                    last_day = day
                    column_dates.append(f"{current_year}-{current_month:02d}-{day:02d}")
                else:
                    column_dates.append("")

            # ==========================================
            # 3. 核心 ROI 裁切與邏輯縫合引擎
            # ==========================================
            for col_idx in range(5):
                if not column_dates[col_idx]: 
                    continue
                current_date = column_dates[col_idx]

                col_x0 = time_col_width + (col_idx * day_col_width)
                col_x1 = col_x0 + day_col_width
                
                # 初始化該欄位（該天）的記憶體
                last_course_ref = None

                for i in range(len(time_anchors)):
                    curr_time = time_anchors[i]
                    floor_y = time_anchors[i+1]['top'] if i + 1 < len(time_anchors) else curr_time['top'] + 60

                    bbox = (col_x0, curr_time['top'] - 2, col_x1, floor_y - 2)

                    try:
                        roi = page.crop(bbox)
                        extracted_text = roi.extract_text()
                        if not extracted_text: 
                            continue

                        # 雜訊清洗
                        clean_text = extracted_text.replace('\n', ' ').strip()
                        clean_text = clean_text.replace("上午", "").replace("下午", "").replace("午", "").strip()
                        
                        # 🎯 修復中文字斷行空白：把中文字與中文字之間的空白移除，保留英文空白
                        clean_text = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])', '', clean_text)
                        
                        if not clean_text: 
                            continue

                        # 以括號作為切割刀
                        chunks = [c.strip() for c in re.split(r'(?=[\[【])', clean_text) if c.strip()]

                        for chunk in chunks:
                            # 1. 呼叫大腦解析字串
                            extracted_data = extract_course_info(chunk)
                            if not extracted_data: 
                                continue # 被黑名單攔截 (如 Case Wrapup)

                            # 🎯 2. 智慧殘肢判定：沒有括號，且「無法萃取出分類」的才是真正的殘肢
                            is_severed_limb = not re.match(r'^[\[【]', chunk) and extracted_data["category"] == ""

                            if is_severed_limb:
                                if last_course_ref:
                                    # 智慧去重與縫合
                                    if chunk not in last_course_ref['raw_text']:
                                        stitched_text = last_course_ref['raw_text'] + " " + chunk
                                        last_course_ref['raw_text'] = stitched_text
                                        
                                        re_extracted = extract_course_info(stitched_text)
                                        if re_extracted:
                                            course_dict = last_course_ref['dict_ref']
                                            course_dict["topic"] = re_extracted["topic"]
                                            course_dict["teacher"] = re_extracted["teacher"]

                                continue 

                            # 🎯 3. 建立新課 (有括號的正常課，或是沒有括號但被識別為 PBL/Holiday 的課)
                            final_course = {
                                "date": current_date,
                                "time_slot": f"{curr_time['hour']:02d}:00-{curr_time['hour']+1:02d}:00",
                                "category": extracted_data["category"],
                                "course_code": extracted_data["course_code"],
                                "topic": extracted_data["topic"],
                                "teacher": extracted_data["teacher"]
                            }
                            parsed_courses.append(final_course)

                            # 更新記憶體
                            last_course_ref = {
                                "raw_text": chunk,
                                "dict_ref": final_course
                            }

                    except ValueError:
                        pass 

    return parsed_courses