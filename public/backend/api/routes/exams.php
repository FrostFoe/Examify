<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$batch_id = $_GET['batch_id'] ?? null;
$accessible_by = $_GET['accessible_by'] ?? null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM exams WHERE id = ?");
        $stmt->execute([$id]);
        $exam = $stmt->fetch();
        if ($exam) {
            $exam['mandatory_subjects'] = json_decode($exam['mandatory_subjects'] ?? '[]', true);
            $exam['optional_subjects'] = json_decode($exam['optional_subjects'] ?? '[]', true);
            $exam['is_practice'] = (bool)$exam['is_practice'];
            $exam['shuffle_questions'] = (bool)$exam['shuffle_questions'];
            $exam['shuffle_sections_only'] = (bool)$exam['shuffle_sections_only'];
            
            // Fetch questions
            $stmtQ = $pdo->prepare("SELECT q.*, eq.marks as question_marks FROM questions q JOIN exam_questions eq ON q.id = eq.question_id WHERE eq.exam_id = ? ORDER BY eq.order_index ASC");
            $stmtQ->execute([$id]);
            $questions = $stmtQ->fetchAll();
            
            // Attach image URLs
            $questions = array_map('attachImageUrls', $questions);
            
            $exam['questions'] = $questions;
            $exam['question_ids'] = array_column($questions, 'id');
        }
        echo json_encode(['success' => true, 'data' => $exam]);
    } elseif ($accessible_by) {
        // Get student's enrolled batches
        $stmt = $pdo->prepare("SELECT enrolled_batches FROM students WHERE uid = ?");
        $stmt->execute([$accessible_by]);
        $student = $stmt->fetch();
        
        $enrolledBatchIds = [];
        if ($student) {
            $enrolledBatchIds = json_decode($student['enrolled_batches'] ?? '[]', true);
        }
        
        // Get public batches
        $stmt = $pdo->query("SELECT id FROM batches WHERE is_public = 1");
        $publicBatchIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $allBatchIds = array_unique(array_merge($enrolledBatchIds, $publicBatchIds));
        
        $where = "batch_id IS NULL";
        if (!empty($allBatchIds)) {
            $placeholders = implode(',', array_fill(0, count($allBatchIds), '?'));
            $where .= " OR batch_id IN ($placeholders)";
        }
        
        $stmt = $pdo->prepare("SELECT * FROM exams WHERE $where ORDER BY created_at DESC");
        $stmt->execute($allBatchIds);
        $exams = $stmt->fetchAll();
        foreach ($exams as &$e) {
            $e['mandatory_subjects'] = json_decode($e['mandatory_subjects'] ?? '[]', true);
            $e['optional_subjects'] = json_decode($e['optional_subjects'] ?? '[]', true);
            $e['is_practice'] = (bool)$e['is_practice'];
            $e['shuffle_questions'] = (bool)$e['shuffle_questions'];
            $e['shuffle_sections_only'] = (bool)$e['shuffle_sections_only'];
        }
        echo json_encode(['success' => true, 'data' => $exams]);
    } elseif ($batch_id) {
        $stmt = $pdo->prepare("SELECT * FROM exams WHERE batch_id = ? ORDER BY created_at DESC");
        $stmt->execute([$batch_id]);
        $exams = $stmt->fetchAll();
        foreach ($exams as &$e) {
            $e['mandatory_subjects'] = json_decode($e['mandatory_subjects'] ?? '[]', true);
            $e['optional_subjects'] = json_decode($e['optional_subjects'] ?? '[]', true);
            $e['is_practice'] = (bool)$e['is_practice'];
            $e['shuffle_questions'] = (bool)$e['shuffle_questions'];
            $e['shuffle_sections_only'] = (bool)$e['shuffle_sections_only'];
        }
        echo json_encode(['success' => true, 'data' => $exams]);
    } else {
        $stmt = $pdo->query("SELECT * FROM exams ORDER BY created_at DESC");
        $exams = $stmt->fetchAll();
        foreach ($exams as &$e) {
            $e['mandatory_subjects'] = json_decode($e['mandatory_subjects'] ?? '[]', true);
            $e['optional_subjects'] = json_decode($e['optional_subjects'] ?? '[]', true);
            $e['is_practice'] = (bool)$e['is_practice'];
            $e['shuffle_questions'] = (bool)$e['shuffle_questions'];
            $e['shuffle_sections_only'] = (bool)$e['shuffle_sections_only'];
        }
        echo json_encode(['success' => true, 'data' => $exams]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    $action = $_GET['action'] ?? '';

    if ($action === 'create') {
        $id = $input['id'] ?? uuidv4();
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? null;
        $course_name = $input['course_name'] ?? null;
        $batch_id = $input['batch_id'] ?? null;
        $duration_minutes = $input['duration_minutes'] ?? 120;
        $marks_per_question = $input['marks_per_question'] ?? 1.0;
        $negative_marks_per_wrong = $input['negative_marks_per_wrong'] ?? 0.5;
        $file_id = $input['file_id'] ?? null;
        
        $is_practice_val = $input['is_practice'] ?? false;
        $is_practice = ($is_practice_val === 'true' || $is_practice_val === true || $is_practice_val === 1 || $is_practice_val === '1') ? 1 : 0;
        
        $shuffle_val = $input['shuffle_questions'] ?? false;
        $shuffle_questions = ($shuffle_val === 'true' || $shuffle_val === true || $shuffle_val === 1 || $shuffle_val === '1') ? 1 : 0;
        
        $start_at = $input['start_at'] ?? null;
        $end_at = $input['end_at'] ?? null;
        $total_subjects = $input['total_subjects'] ?? null;
        
        $mandatory_subjects = $input['mandatory_subjects'] ?? [];
        if (!is_string($mandatory_subjects)) {
            $mandatory_subjects = json_encode($mandatory_subjects);
        }
        
        $optional_subjects = $input['optional_subjects'] ?? [];
        if (!is_string($optional_subjects)) {
            $optional_subjects = json_encode($optional_subjects);
        }
        
        $question_ids = $input['question_ids'] ?? [];
        if (is_string($question_ids)) {
            $question_ids = json_decode($question_ids, true) ?? [];
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO exams (id, name, description, course_name, batch_id, duration_minutes, marks_per_question, negative_marks_per_wrong, file_id, is_practice, shuffle_questions, start_at, end_at, total_subjects, mandatory_subjects, optional_subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $name, $description, $course_name, $batch_id, $duration_minutes, $marks_per_question, $negative_marks_per_wrong, $file_id, $is_practice, $shuffle_questions, $start_at, $end_at, $total_subjects, $mandatory_subjects, $optional_subjects]);
            
            if (!empty($question_ids)) {
                $stmt = $pdo->prepare("INSERT INTO exam_questions (id, exam_id, question_id, order_index) VALUES (?, ?, ?, ?)");
                foreach ($question_ids as $index => $q_id) {
                    $stmt->execute([uuidv4(), $id, $q_id, $index]);
                }
            }

            $pdo->commit();

            // Fetch the newly created exam to return it
            $stmt = $pdo->prepare("SELECT * FROM exams WHERE id = ?");
            $stmt->execute([$id]);
            $exam = $stmt->fetch();
            if ($exam) {
                $exam['mandatory_subjects'] = json_decode($exam['mandatory_subjects'] ?? '[]', true);
                $exam['optional_subjects'] = json_decode($exam['optional_subjects'] ?? '[]', true);
                $exam['is_practice'] = (bool)$exam['is_practice'];
                $exam['shuffle_questions'] = (bool)$exam['shuffle_questions'];
                $exam['shuffle_sections_only'] = (bool)$exam['shuffle_sections_only'];
                $exam['question_ids'] = $question_ids;
            }
            echo json_encode(['success' => true, 'data' => $exam]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'update') {
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? null;
        $course_name = $input['course_name'] ?? null;
        $duration_minutes = $input['duration_minutes'] ?? 120;
        $marks_per_question = $input['marks_per_question'] ?? 1.0;
        $negative_marks_per_wrong = $input['negative_marks_per_wrong'] ?? 0.5;
        $file_id = $input['file_id'] ?? null;
        
        $is_practice_val = $input['is_practice'] ?? false;
        $is_practice = ($is_practice_val === 'true' || $is_practice_val === true || $is_practice_val === 1 || $is_practice_val === '1') ? 1 : 0;
        
        $shuffle_val = $input['shuffle_questions'] ?? false;
        $shuffle_questions = ($shuffle_val === 'true' || $shuffle_val === true || $shuffle_val === 1 || $shuffle_val === '1') ? 1 : 0;
        
        $start_at = $input['start_at'] ?? null;
        $end_at = $input['end_at'] ?? null;
        $total_subjects = $input['total_subjects'] ?? null;
        
        $mandatory_subjects = $input['mandatory_subjects'] ?? [];
        if (!is_string($mandatory_subjects)) {
            $mandatory_subjects = json_encode($mandatory_subjects);
        }
        
        $optional_subjects = $input['optional_subjects'] ?? [];
        if (!is_string($optional_subjects)) {
            $optional_subjects = json_encode($optional_subjects);
        }
        
        $question_ids = $input['question_ids'] ?? null;
        if (is_string($question_ids)) {
            $question_ids = json_decode($question_ids, true);
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE exams SET name = ?, description = ?, course_name = ?, duration_minutes = ?, marks_per_question = ?, negative_marks_per_wrong = ?, file_id = ?, is_practice = ?, shuffle_questions = ?, start_at = ?, end_at = ?, total_subjects = ?, mandatory_subjects = ?, optional_subjects = ? WHERE id = ?");
            $stmt->execute([$name, $description, $course_name, $duration_minutes, $marks_per_question, $negative_marks_per_wrong, $file_id, $is_practice, $shuffle_questions, $start_at, $end_at, $total_subjects, $mandatory_subjects, $optional_subjects, $id]);
            
            if ($question_ids !== null) {
                // Remove old questions
                $stmt = $pdo->prepare("DELETE FROM exam_questions WHERE exam_id = ?");
                $stmt->execute([$id]);

                // Insert new ones
                if (!empty($question_ids)) {
                    $stmt = $pdo->prepare("INSERT INTO exam_questions (id, exam_id, question_id, order_index) VALUES (?, ?, ?, ?)");
                    foreach ($question_ids as $index => $q_id) {
                        $stmt->execute([uuidv4(), $id, $q_id, $index]);
                    }
                }
            }

            $pdo->commit();

            // Fetch the updated exam to return it
            $stmt = $pdo->prepare("SELECT * FROM exams WHERE id = ?");
            $stmt->execute([$id]);
            $exam = $stmt->fetch();
            if ($exam) {
                $exam['mandatory_subjects'] = json_decode($exam['mandatory_subjects'] ?? '[]', true);
                $exam['optional_subjects'] = json_decode($exam['optional_subjects'] ?? '[]', true);
                $exam['is_practice'] = (bool)$exam['is_practice'];
                $exam['shuffle_questions'] = (bool)$exam['shuffle_questions'];
                $exam['shuffle_sections_only'] = (bool)$exam['shuffle_sections_only'];
                
                // Fetch question IDs
                $stmtIds = $pdo->prepare("SELECT question_id FROM exam_questions WHERE exam_id = ? ORDER BY order_index ASC");
                $stmtIds->execute([$id]);
                $exam['question_ids'] = $stmtIds->fetchAll(PDO::FETCH_COLUMN);
            }
            echo json_encode(['success' => true, 'data' => $exam]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'delete') {
        $id = $input['id'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM exams WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}