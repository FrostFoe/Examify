<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];
$exam_id = $_GET['exam_id'] ?? null;
$student_id = $_GET['student_id'] ?? null;
$batch_id = $_GET['batch_id'] ?? null;

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$pagination = "";
if ($limit > 0) {
    $pagination = " LIMIT $limit OFFSET $offset";
}

if ($method === 'GET') {
    if ($exam_id && $student_id) {
        $stmt = $pdo->prepare("SELECT * FROM student_exams WHERE exam_id = ? AND student_id = ?");
        $stmt->execute([$exam_id, $student_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
    } elseif ($exam_id) {
        $stmt = $pdo->prepare("SELECT se.*, s.name as student_name, s.roll as student_roll FROM student_exams se JOIN students s ON se.student_id = s.uid WHERE se.exam_id = ? ORDER BY se.score DESC" . $pagination);
        $stmt->execute([$exam_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    } elseif ($student_id) {
        $stmt = $pdo->prepare("SELECT se.*, e.name as exam_name FROM student_exams se JOIN exams e ON se.exam_id = e.id WHERE se.student_id = ? ORDER BY se.submitted_at DESC" . $pagination);
        $stmt->execute([$student_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    } elseif ($batch_id) {
        $stmt = $pdo->prepare("SELECT se.*, s.name as student_name, s.roll as student_roll FROM student_exams se JOIN students s ON se.student_id = s.uid JOIN exams e ON se.exam_id = e.id WHERE e.batch_id = ?" . $pagination);
        $stmt->execute([$batch_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    $action = $_GET['action'] ?? '';

    if ($action === 'submit') {
        try {
            $id = $input['id'] ?? uuidv4();
            $exam_id = $input['exam_id'] ?? '';
            $student_id = $input['student_id'] ?? '';
            $score = isset($input['score']) ? (float)$input['score'] : 0.0;
            $correct_answers = isset($input['correct_answers']) ? (int)$input['correct_answers'] : 0;
            $wrong_answers = isset($input['wrong_answers']) ? (int)$input['wrong_answers'] : 0;
            $unattempted = isset($input['unattempted']) ? (int)$input['unattempted'] : 0;

            if (empty($exam_id) || empty($student_id)) {
                throw new Exception("Missing exam_id or student_id");
            }

            $stmt = $pdo->prepare("INSERT INTO student_exams (id, exam_id, student_id, score, correct_answers, wrong_answers, unattempted) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score), correct_answers = VALUES(correct_answers), wrong_answers = VALUES(wrong_answers), unattempted = VALUES(unattempted), submitted_at = CURRENT_TIMESTAMP");
            $stmt->execute([$id, $exam_id, $student_id, $score, $correct_answers, $wrong_answers, $unattempted]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'delete') {
        $id = $input['id'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM student_exams WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}
?>
