<?php
if (!defined('API_ACCESS')) exit;

$stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
$usersCount = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT COUNT(*) as count FROM exams");
$examsCount = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT COUNT(*) as count FROM batches");
$batchesCount = $stmt->fetch()['count'];

$stmt = $pdo->query("SELECT SUM(total_questions) as count FROM files");
$questionsCount = $stmt->fetch()['count'] ?? 0;

echo json_encode([
    'success' => true, 
    'data' => [
        'usersCount' => (int)$usersCount,
        'examsCount' => (int)$examsCount,
        'batchesCount' => (int)$batchesCount,
        'questionsCount' => (int)$questionsCount
    ]
]);