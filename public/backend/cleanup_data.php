<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/image_upload.php';

header('Content-Type: text/plain');

$preserved_batch_id = 'ae669cef-d5b1-4f09-b3bc-8c1805bc8234';

echo "Starting cleanup operation...\n";
echo "Preserving Batch ID: " . $preserved_batch_id . "\n";

try {
    $pdo->beginTransaction();

    // 1. Delete all batches EXCEPT the preserved one
    // Exams associated with deleted batches will be automatically deleted via CASCADE (defined in schema)
    $stmt = $pdo->prepare("DELETE FROM batches WHERE id != ?");
    $stmt->execute([$preserved_batch_id]);
    $deleted_batches = $stmt->rowCount();
    echo "Deleted $deleted_batches batches.\n";

    // 2. Delete all question bank data (files and questions)
    // First, verify if we should delete images from disk
    
    // Select all questions to find images to delete
    $stmt = $pdo->query("SELECT question_image, explanation_image FROM questions");
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $image_count = 0;
    foreach ($questions as $q) {
        if (!empty($q['question_image'])) {
            // deleteUploadedImage handles checks for file existence and ignores base64 data URIs
            deleteUploadedImage($q['question_image']);
            $image_count++;
        }
        if (!empty($q['explanation_image'])) {
            deleteUploadedImage($q['explanation_image']);
            $image_count++;
        }
    }
    echo "Processed cleanup for question images.\n";

    // Delete all files.
    // This will CASCADE delete all questions (defined in schema: questions.file_id -> files.id ON DELETE CASCADE)
    // This effectively clears the Question Bank.
    $stmt = $pdo->query("DELETE FROM files");
    $deleted_files = $stmt->rowCount();
    echo "Deleted $deleted_files files (and all associated questions).\n";

    $pdo->commit();
    echo "Cleanup completed successfully.\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo "Error: " . $e->getMessage() . "\n";
}
?>
