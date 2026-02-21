from pydantic import BaseModel, Field
from typing import List
from enum import Enum

class AttendanceEnum(str, Enum):
    """出席狀態的嚴格列舉限制"""
    UNMARKED = "未標記"
    ATTENDED = "現場出席"
    VIDEO = "錄影補課"
    REVIEW = "加強複習"

class ProgressEnum(str, Enum):
    """讀書與共筆進度的嚴格列舉限制"""
    FIRST_PASS = "一刷"
    SECOND_PASS = "二刷"
    EXAM_PREP = "寫考古"

class CourseSchema(BaseModel):
    """課程資料驗證綱要"""
    date: str = Field(..., description="上課日期 (格式: YYYY-MM-DD)")
    time_slot: str = Field(..., description="上課時段 (格式: HH:MM-HH:MM)")
    category: str = Field(..., description="課程分類或科目")
    course_code: str = Field(default="", description="課程代碼")
    topic: str = Field(..., description="課程主題")
    teacher: str = Field(default="", description="授課教師")
    
    # 狀態預設值注入
    attendance: AttendanceEnum = Field(
        default=AttendanceEnum.UNMARKED, 
        description="出席狀態"
    )
    study_progress: List[ProgressEnum] = Field(
        default_factory=list, 
        description="共筆與讀書進度 (允許多選)"
    )

    class Config:
        # 允許模型與 SQLAlchemy ORM 物件互相轉換
        from_attributes = True