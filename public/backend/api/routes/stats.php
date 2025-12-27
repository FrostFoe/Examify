<?php
if (!defined('API_ACCESS')) exit;

// Try to get from cache first (5 minute TTL)
$cacheKey = getCacheKey('stats');
$cachedData = APICache::get($cacheKey);

if ($cachedData !== null) {
    echo json_encode(['success' => true, 'data' => $cachedData, 'cached' => true]);
} else {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
    $usersCount = $stmt->fetch()['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM exams");
    $examsCount = $stmt->fetch()['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM batches");
    $batchesCount = $stmt->fetch()['count'];

    $stmt = $pdo->query("SELECT SUM(total_questions) as count FROM files");
    $questionsCount = $stmt->fetch()['count'] ?? 0;

    $data = [
        'usersCount' => (int)$usersCount,
        'examsCount' => (int)$examsCount,
        'batchesCount' => (int)$batchesCount,
        'questionsCount' => (int)$questionsCount
    ];
    
    // Cache for 5 minutes
    APICache::set($cacheKey, $data, 300);
    
    echo json_encode(['success' => true, 'data' => $data]);
}
?>
