<?php
defined('API_ACCESS') OR exit('Unauthorized');
$file_id = $_GET['file_id'] ?? '';
$exam_id = $_GET['exam_id'] ?? '';
$search = $_GET['search'] ?? '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$pagination = "";
if ($limit > 0) {
    $pagination = " LIMIT $limit OFFSET $offset";
}

$questions = [];

if ($exam_id) {
    $query = "SELECT q.*, eq.marks as question_marks FROM questions q JOIN exam_questions eq ON q.id = eq.question_id WHERE eq.exam_id = ?";
    $params = [$exam_id];
    
    if ($search) {
        $query .= " AND (q.question_text LIKE ? OR q.question LIKE ? OR q.explanation LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    $query .= " ORDER BY eq.order_index ASC" . $pagination;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();

    if (empty($questions) && $offset == 0) {
        // Fallback: use file_id from exam table
        $stmt = $pdo->prepare("SELECT file_id FROM exams WHERE id = ?");
        $stmt->execute([$exam_id]);
        $exam = $stmt->fetch();
        if ($exam && $exam['file_id']) {
            $query = "SELECT * FROM questions WHERE file_id = ?";
            $params = [$exam['file_id']];
            if ($search) {
                $query .= " AND (question_text LIKE ? OR question LIKE ? OR explanation LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            $query .= " ORDER BY order_index ASC" . $pagination;
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $questions = $stmt->fetchAll();
        }
    }
} elseif ($file_id) {
    $query = "SELECT * FROM questions WHERE file_id = ?";
    $params = [$file_id];
    if ($search) {
        $query .= " AND (question_text LIKE ? OR question LIKE ? OR explanation LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $query .= " ORDER BY order_index ASC" . $pagination;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();
} else {
    $query = "SELECT * FROM questions WHERE 1=1";
    $params = [];
    if ($search) {
        $query .= " AND (question_text LIKE ? OR question LIKE ? OR explanation LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $query .= " ORDER BY created_at DESC" . $pagination;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();
}

$questions = array_map('attachImageUrls', $questions);

echo json_encode(['success' => true, 'data' => $questions]);
?>