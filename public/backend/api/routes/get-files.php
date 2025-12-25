<?php
defined('API_ACCESS') OR exit('Unauthorized');
$stmt = $pdo->query("SELECT id, original_filename, display_name, uploaded_at, total_questions FROM files WHERE is_bank = 1 ORDER BY uploaded_at DESC");
$files = $stmt->fetchAll();
echo json_encode(['success' => true, 'data' => $files]);
?>
