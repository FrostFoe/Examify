-- Database Performance Optimization Indexes
-- Run this SQL to add performance-enhancing composite indexes

-- Add composite index for results lookups (exam_id + student_id)
ALTER TABLE student_exams ADD INDEX idx_exam_student (exam_id, student_id);

-- Add composite index for batch exam lookups
ALTER TABLE exams ADD INDEX idx_batch_created (batch_id, created_at DESC);

-- Add index for question lookups by file
ALTER TABLE questions ADD INDEX idx_file_question (file_id, id);

-- Add index for student exam filtering
ALTER TABLE student_exams ADD INDEX idx_student_submitted (student_id, submitted_at DESC);

-- Add index for batch student lookups
ALTER TABLE students ADD INDEX idx_batch_created (batch_id, created_at DESC);

-- Optimize query for getting results by exam_id with student names
CREATE INDEX idx_exam_results ON student_exams(exam_id, score DESC);

-- Optimize query for getting results by student_id
CREATE INDEX idx_student_results ON student_exams(student_id, submitted_at DESC);

-- Analyze tables after adding indexes to update statistics
ANALYZE TABLE student_exams;
ANALYZE TABLE exams;
ANALYZE TABLE questions;
ANALYZE TABLE students;
ANALYZE TABLE batches;
