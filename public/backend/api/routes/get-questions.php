<?php
defined('API_ACCESS') OR exit('Unauthorized');
$file_id = $_GET['file_id'] ?? '';
$exam_id = $_GET['exam_id'] ?? '';

if ($exam_id) {
    // Check if there are individual questions for this exam
    $stmt = $pdo->prepare("SELECT q.*, eq.marks as question_marks FROM questions q JOIN exam_questions eq ON q.id = eq.question_id WHERE eq.exam_id = ? ORDER BY eq.order_index ASC");
    $stmt->execute([$exam_id]);
    $questions = $stmt->fetchAll();

    if (empty($questions)) {
        // Fallback: use file_id from exam table
        $stmt = $pdo->prepare("SELECT file_id FROM exams WHERE id = ?");
        $stmt->execute([$exam_id]);
        $exam = $stmt->fetch();
        if ($exam && $exam['file_id']) {
            $stmt = $pdo->prepare("SELECT * FROM questions WHERE file_id = ? ORDER BY order_index ASC");
            $stmt->execute([$exam['file_id']]);
            $questions = $stmt->fetchAll();
        }
    }
} elseif ($file_id) {
    $stmt = $pdo->prepare("SELECT * FROM questions WHERE file_id = ? ORDER BY order_index ASC");
    $stmt->execute([$file_id]);
    $questions = $stmt->fetchAll();
} else {
    // Fallback: Fetch all questions if no file_id or exam_id provided
    $stmt = $pdo->query("SELECT * FROM questions ORDER BY created_at DESC");
    $questions = $stmt->fetchAll();
}

$questions = array_map('attachImageUrls', $questions);

echo json_encode(['success' => true, 'data' => $questions]);
?>
