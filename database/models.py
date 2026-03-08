from sqlalchemy import Column, Integer, String, Text, Index
from database.db_setup import Base

class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, index=True)
    date = Column(String)
    time_slot = Column(String)
    category = Column(String, index=True)
    topic = Column(String)
    teacher = Column(String)
    
    attendance = Column(String, default="未標記")
    study_progress = Column(Text, default="[]")
    
    # 手動指定的考試名稱
    target_exam_override = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_course_date_time_slot", "date", "time_slot"),
    )

class ExamRule(Base):
    __tablename__ = 'exam_rules'

    id = Column(Integer, primary_key=True, index=True)
    exam_keyword = Column(String, unique=True, index=True)
    target_categories = Column(Text)