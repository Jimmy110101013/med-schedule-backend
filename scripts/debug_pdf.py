import pdfplumber

pdf_path = "114-2 醫四週課表-20260212.pdf"

print("🔍 啟動 PDF 透視鏡...")
with pdfplumber.open(pdf_path) as pdf:
    # 我們只抓第一頁來分析
    page = pdf.pages[0] 
    tables = page.extract_tables()
    
    print(f"✅ 第一頁共抓到 {len(tables)} 個表格區域\n")
    
    if not tables:
        print("❌ 警告：pdfplumber 找不到任何表格！可能是框線不標準。")
    else:
        # 印出第一個表格的前 10 列，看它到底長怎樣
        target_table = tables[0]
        print(f"📊 正在分析主要表格 (共 {len(target_table)} 列):")
        for r_idx, row in enumerate(target_table[:10]):
            print(f"列 {r_idx} -> {row}")