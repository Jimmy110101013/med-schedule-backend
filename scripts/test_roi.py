import pdfplumber
import re

pdf_path = "114-2 醫四週課表-20260212.pdf"

print("🎯 啟動 CNN ROI + 智慧去重縫合測試 (擴大測試第一週全 5 天)...\n")

with pdfplumber.open(pdf_path) as pdf:
    # 只取第一頁 (第一週) 作為測試樣本
    page = pdf.pages[0]
    
    words = page.extract_words()
    time_anchors = []
    for w in words:
        if w['x0'] < 60 and re.match(r'^(0[1-9]|1[0-2])$', w['text']):
            raw_h = int(w['text'])
            hour_24 = raw_h + 12 if raw_h <= 6 else raw_h
            time_anchors.append({'hour': hour_24, 'top': w['top']})
            
    time_anchors.sort(key=lambda x: x['top'])
    
    page_width = page.width
    time_col_width = 65
    day_col_width = (page_width - time_col_width - 50) / 5 
    
    days_name = ["星期一 (2/23)", "星期二 (2/24)", "星期三 (2/25)", "星期四 (2/26)", "星期五 (2/27)"]
    
    # 🎯 擴大測試：外層迴圈跑遍 5 個欄位 (星期一到星期五)
    for col_idx in range(5):
        print("=" * 60)
        print(f"📅 正在掃描: {days_name[col_idx]}")
        print("=" * 60)
        
        # 動態推算每一天的 X 軸 ROI 邊界
        col_x0 = time_col_width + (col_idx * day_col_width)
        col_x1 = col_x0 + day_col_width
        
        last_course = None
        
        for i in range(len(time_anchors)):
            curr_time = time_anchors[i]
            floor_y = time_anchors[i+1]['top'] if i + 1 < len(time_anchors) else curr_time['top'] + 60
                
            bbox = (col_x0, curr_time['top'] - 2, col_x1, floor_y - 2)
            
            try:
                roi_region = page.crop(bbox)
                extracted_text = roi_region.extract_text()
                
                if extracted_text and extracted_text.strip():
                    clean_text = extracted_text.replace('\n', ' ').strip()
                    clean_text = clean_text.replace("上午", "").replace("下午", "").replace("午", "").strip()
                    
                    if not clean_text:
                        continue
                    
                    chunks = [c.strip() for c in re.split(r'(?=[\[【])', clean_text) if c.strip()]
                    
                    for chunk in chunks:
                        # 狀況 A：殘肢縫合
                        if not re.match(r'^[\[【]', chunk):
                            if last_course:
                                if chunk in last_course['text']:
                                    print(f"🧵 【觸發縫合】重疊殘肢！時間延長至 {curr_time['hour'] + 1:02d}:00")
                                else:
                                    last_course['text'] = last_course['text'] + " " + chunk
                                    print(f"🧵 【觸發縫合】新殘肢！接合並延長時間至 {curr_time['hour'] + 1:02d}:00")
                                    
                                last_course['end_hour'] = curr_time['hour'] + 1
                                print(f"   目前完整字串: {last_course['text']}")
                        
                        # 狀況 B：建立新課
                        else:
                            last_course = {
                                'start_hour': curr_time['hour'],
                                'end_hour': curr_time['hour'] + 1,
                                'text': chunk
                            }
                            print(f"🕒 建立新課 {last_course['start_hour']:02d}:00 - {last_course['end_hour']:02d}:00")
                            print(f"📥 內容: {chunk}")
                    print("-" * 50)
                    
            except ValueError:
                pass
        print("\n") # 換日留點空白