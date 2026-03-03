from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json

from database.db_setup import SessionLocal, engine, Base
from database.models import Course, ExamRule

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class CourseUpdate(BaseModel):
    attendance: Optional[str] = None
    study_progress: Optional[List[str]] = None
    target_exam_override: Optional[str] = None

class ExamRuleCreate(BaseModel):
    keyword: str
    categories: List[str]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/courses")
def get_all_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.category != "Holiday").order_by(Course.date, Course.time_slot).all()
    result = []
    for c in courses:
        try:
            progress_list = json.loads(c.study_progress) if c.study_progress else []
        except:
            progress_list = []
        result.append({
            "id": c.id, "date": c.date, "time_slot": c.time_slot, "category": c.category,
            "topic": c.topic, "teacher": c.teacher, "attendance": c.attendance,
            "study_progress": progress_list,
            "target_exam_override": c.target_exam_override # 傳回手動值
        })
    return result

@app.put("/api/courses/{course_id}")
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course: raise HTTPException(status_code=404, detail="Not Found")
    
    if course_data.attendance is not None: course.attendance = course_data.attendance
    if course_data.study_progress is not None: 
        course.study_progress = json.dumps(course_data.study_progress, ensure_ascii=False)
    if course_data.target_exam_override is not None:
        course.target_exam_override = course_data.target_exam_override
    
    db.commit()
    return {"status": "success"}

@app.get("/api/exam-rules")
def get_exam_rules(db: Session = Depends(get_db)):
    rules = db.query(ExamRule).all()
    res = []
    for r in rules:
        try: cats = json.loads(r.target_categories)
        except: cats = []
        res.append({"id": r.id, "keyword": r.exam_keyword, "categories": cats})
    return res

@app.post("/api/exam-rules")
def create_exam_rule(rule_data: ExamRuleCreate, db: Session = Depends(get_db)):
    db.add(ExamRule(exam_keyword=rule_data.keyword.strip(), target_categories=json.dumps(rule_data.categories)))
    db.commit()
    return {"status": "success"}

@app.put("/api/exam-rules/{rule_id}")
def update_exam_rule(rule_id: int, rule_data: ExamRuleCreate, db: Session = Depends(get_db)):
    rule = db.query(ExamRule).filter(ExamRule.id == rule_id).first()
    if rule:
        rule.exam_keyword = rule_data.keyword
        rule.target_categories = json.dumps(rule_data.categories)
        db.commit()
    return {"status": "success"}

@app.delete("/api/exam-rules/{rule_id}")
def delete_exam_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ExamRule).filter(ExamRule.id == rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"status": "success"}