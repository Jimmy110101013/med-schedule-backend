CREATE TABLE IF NOT EXISTS kokushi_subjects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kokushi_subtopics (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id       INTEGER NOT NULL REFERENCES kokushi_subjects(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  order_index      INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'not_started'
                   CHECK (status IN ('not_started','in_progress','completed')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  notes            TEXT,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS kokushi_resources (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id       INTEGER NOT NULL REFERENCES kokushi_subjects(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('book','video','qbank','other')),
  name             TEXT NOT NULL,
  total_units      INTEGER NOT NULL DEFAULT 1,
  completed_units  INTEGER NOT NULL DEFAULT 0,
  order_index      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kokushi_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subtopics_subject ON kokushi_subtopics(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON kokushi_resources(subject_id);

-- Seed from docs/All_Subjects_Subtopics.md
INSERT OR IGNORE INTO kokushi_subjects (id, name, order_index) VALUES
  (1,  '解剖學', 0),
  (2,  '生物化學', 1),
  (3,  '生理學', 2),
  (4,  '藥理學', 3),
  (5,  '病理學', 4),
  (6,  '微生物學', 5),
  (7,  '公共衛生學', 6),
  (8,  '免疫學', 7),
  (9,  '組織學', 8),
  (10, '寄生蟲學', 9),
  (11, '胚胎及發育生物學', 10);

INSERT OR IGNORE INTO kokushi_subtopics (subject_id, name, order_index) VALUES
  (1, '骨盆、泌尿與生殖解剖', 0),
  (1, '胸部解剖', 1),
  (1, '周邊神經與腦幹解剖', 2),
  (1, '顏面、口咽與頸部解剖', 3),
  (1, '下肢解剖', 4),
  (1, '中樞神經系統解剖', 5),
  (1, '上肢解剖', 6),
  (1, '感覺器官與顱骨解剖', 7),
  (1, '腹部與消化解剖', 8),

  (2, '轉錄、轉譯與基因調控', 0),
  (2, '胺基酸、蛋白質與酵素', 1),
  (2, '醣類與能量代謝', 2),
  (2, '生物訊息傳遞與細胞週期', 3),
  (2, '脂質與胺基酸代謝', 4),
  (2, 'DNA修復、代謝與分子技術', 5),
  (2, '核酸結構與DNA複製', 6),
  (2, '醣類與脂質', 7),
  (2, '維生素與輔酶', 8),

  (3, '內分泌與代謝', 0),
  (3, '心血管生理', 1),
  (3, '中樞神經與高級功能', 2),
  (3, '感覺與自主神經生理', 3),
  (3, '呼吸生理', 4),
  (3, '腎臟生理', 5),
  (3, '消化生理', 6),
  (3, '生殖生理', 7),
  (3, '血液與細胞生理', 8),
  (3, '肌肉生理', 9),

  (4, '中樞神經與麻醉藥物', 0),
  (4, '抗感染藥物與藥理總論', 1),
  (4, '荷爾蒙與內分泌藥物', 2),
  (4, '心血管與腎臟藥物', 3),
  (4, '血液與免疫系統藥物', 4),
  (4, '消化與呼吸系統藥物', 5),
  (4, '抗發炎與自泌素藥物', 6),
  (4, '自主神經系統藥物', 7),
  (4, '抗腫瘤藥物', 8),
  (4, '其他藥物', 9),

  (5, '呼吸系統病理', 0),
  (5, '生殖系統與乳房病理', 1),
  (5, '神經骨骼與皮膚病理', 2),
  (5, '消化系統病理', 3),
  (5, '腎臟泌尿與內分泌病理', 4),
  (5, '發炎修復與遺傳疾病', 5),
  (5, '造血與淋巴病理', 6),
  (5, '細胞傷害與腫瘤通論', 7),
  (5, '心血管病理', 8),

  (6, 'RNA病毒與臨床病毒學', 0),
  (6, '革蘭氏陽性菌與厭氧菌', 1),
  (6, '革蘭氏陰性菌與非典型病原菌', 2),
  (6, 'DNA病毒與病毒總論', 3),
  (6, '真菌學', 4),
  (6, '細菌學總論與抗藥性', 5),

  (7, '職業與環境衛生', 0),
  (7, '衛生行政與健康促進', 1),
  (7, '生物統計學', 2),
  (7, '流行病學', 3),
  (7, '公衛實務與醫療法規', 4),
  (7, '預防醫學', 5),

  (8, '適應性免疫與淋巴球', 0),
  (8, '免疫缺乏與移植腫瘤免疫', 1),
  (8, '先天免疫與抗原呈現', 2),
  (8, '過敏與自體免疫', 3),

  (9, '細胞與基本組織', 0),
  (9, '泌尿生殖內分泌器官組織學', 1),
  (9, '循環呼吸消化器官組織學', 2),

  (10, '蠕蟲', 0),
  (10, '原蟲與病媒', 1),

  (11, '器官系統發育', 0),
  (11, '早期胚胎發育', 1);
