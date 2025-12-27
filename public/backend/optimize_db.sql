-- Database Performance Optimization Indexes
-- Run this SQL to add performance-enhancing composite indexes

-- Add composite index for results lookups (exam_id + student_id)
ALTER TABLE student_exams ADD INDEX IF NOT EXISTS idx_exam_student (exam_id, student_id);

-- Add composite index for batch exam lookups
ALTER TABLE exams ADD INDEX IF NOT EXISTS idx_batch_created (batch_id, created_at);

-- Add index for question lookups by file
ALTER TABLE questions ADD INDEX IF NOT EXISTS idx_file_question (file_id, id);

-- Add index for student exam filtering
ALTER TABLE student_exams ADD INDEX IF NOT EXISTS idx_student_submitted (student_id, submitted_at);

-- Optimize query for getting results by exam_id with student names
ALTER TABLE student_exams ADD INDEX IF NOT EXISTS idx_exam_results (exam_id, score);

-- Optimize query for getting results by student_id
ALTER TABLE student_exams ADD INDEX IF NOT EXISTS idx_student_results (student_id, submitted_at);

-- Add index for user email lookups
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);

-- Add index for file lookups
ALTER TABLE files ADD INDEX IF NOT EXISTS idx_file_bank (is_bank);

-- Add index for exam questions
ALTER TABLE exam_questions ADD INDEX IF NOT EXISTS idx_exam_questions (exam_id, question_id);

-- Analyze tables after adding indexes to update statistics
ANALYZE TABLE student_exams;
ANALYZE TABLE exams;
ANALYZE TABLE questions;
ANALYZE TABLE students;
ANALYZE TABLE batches;
ANALYZE TABLE users;
ANALYZE TABLE files;
ANALYZE TABLE exam_questions;

