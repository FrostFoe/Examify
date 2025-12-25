SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Plain text password',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE IF NOT EXISTS `files` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_questions` int(11) DEFAULT '0',
  `external_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `set_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_bank` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_files_bank` (`is_bank`),
  KEY `idx_files_uploaded` (`uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE IF NOT EXISTS `questions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_text` longtext COLLATE utf8mb4_unicode_ci,
  `option1` longtext COLLATE utf8mb4_unicode_ci,
  `option2` longtext COLLATE utf8mb4_unicode_ci,
  `option3` longtext COLLATE utf8mb4_unicode_ci,
  `option4` longtext COLLATE utf8mb4_unicode_ci,
  `option5` longtext COLLATE utf8mb4_unicode_ci,
  `answer` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `explanation` longtext COLLATE utf8mb4_unicode_ci,
  `question_image` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `explanation_image` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paper` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chapter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `highlight` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` int(11) DEFAULT '0',
  `order_index` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_questions_order` (`order_index`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_tokens`
--

CREATE TABLE IF NOT EXISTS `api_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Plain text token',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_tokens_token` (`token`),
  KEY `idx_tokens_active` (`is_active`),
  CONSTRAINT `api_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#007bff',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint for files.category_id after all tables are created
ALTER TABLE `files` ADD CONSTRAINT `files_ibfk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- Seed data for initial setup

-- 1. Insert Default Category
SET @category_id = UUID();
INSERT INTO `categories` (`id`, `name`, `description`, `color`, `created_at`)
VALUES (@category_id, 'General', 'Default category for questions', '#6c757d', NOW());

-- 2. Insert User
SET @user_id = UUID();
INSERT INTO `users` (`id`, `email`, `password`, `name`, `created_at`)
VALUES (@user_id, 'frostfoe@gmail.com', '12345678', 'FrostFoe', NOW());

-- 3. Insert API Token (Token matches NEXT_PUBLIC_CSV_API_KEY in frontend/.env.local)
INSERT INTO `api_tokens` (`id`, `user_id`, `token`, `name`, `created_at`, `is_active`)
VALUES (UUID(), @user_id, 'ff1337', 'Primary API Token', NOW(), 1);

-- 4. Sample File (Optional)
SET @file_id = UUID();
INSERT INTO `files` (`id`, `original_filename`, `display_name`, `category_id`, `uploaded_at`, `total_questions`)
VALUES (@file_id, 'sample_questions.csv', 'Sample Questions', @category_id, NOW(), 0);

-- --------------------------------------------------------
-- Table structure for table `students` (replaces Supabase users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `uid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roll` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pass` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrolled_batches` json DEFAULT NULL COMMENT 'Array of batch UUIDs',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `roll` (`roll`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `admins` (replaces Supabase admins)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `uid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','moderator') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `batches`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `batches` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon_url` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Store base64 encoded image or URL',
  `is_public` tinyint(1) DEFAULT '0',
  `status` enum('live','end') COLLATE utf8mb4_unicode_ci DEFAULT 'live',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_batches_public_status` (`is_public`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `exams`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exams` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT '120',
  `negative_marks_per_wrong` decimal(4,2) DEFAULT '0.50',
  `file_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_practice` tinyint(1) DEFAULT '0',
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `shuffle_questions` tinyint(1) DEFAULT NULL,
  `marks_per_question` decimal(10,2) DEFAULT '1.00',
  `total_subjects` smallint(6) DEFAULT NULL,
  `mandatory_subjects` json DEFAULT NULL,
  `optional_subjects` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `file_id` (`file_id`),
  KEY `idx_exams_practice` (`is_practice`),
  KEY `idx_exams_created` (`created_at`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `exam_questions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_questions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_index` int(11) DEFAULT '0',
  `marks` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_id` (`exam_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `exam_questions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `student_exams`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_exams` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` decimal(10,2) DEFAULT NULL,
  `correct_answers` int(11) DEFAULT '0',
  `wrong_answers` int(11) DEFAULT '0',
  `unattempted` int(11) DEFAULT '0',
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `exam_id` (`exam_id`),
  KEY `student_id` (`student_id`),
  KEY `idx_student_exams_score` (`score`),
  KEY `idx_student_exams_submitted` (`submitted_at`),
  UNIQUE KEY `student_exam_unique` (`student_id`,`exam_id`),
  CONSTRAINT `student_exams_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_exams_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`uid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `daily_records`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_records` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_date` date NOT NULL,
  `attendance` tinyint(1) DEFAULT '0',
  `task1` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task2` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exam_link` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exam_mark` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student_date` (`student_id`, `record_date`),
  CONSTRAINT `daily_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`uid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Seed Admin


INSERT INTO `admins` (`uid`, `username`, `password`, `role`, `created_at`)


VALUES (UUID(), 'admin', 'admin', 'admin', NOW());





-- Seed Batch


SET @demo_batch_id = UUID();


INSERT INTO `batches` (`id`, `name`, `description`, `is_public`, `status`, `created_at`)


VALUES (@demo_batch_id, 'Demo Admission Batch', 'This is a sample admission batch for testing.', 1, 'live', NOW());





-- Seed Student (Enrolled in Demo Batch)


INSERT INTO `students` (`uid`, `name`, `roll`, `pass`, `enrolled_batches`, `created_at`)


VALUES (UUID(), 'Test Student', '1000', '1000', JSON_ARRAY(@demo_batch_id), NOW());





COMMIT;

