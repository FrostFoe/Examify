<?php
require_once __DIR__ . '/includes/db.php';

header('Content-Type: text/plain');

try {
    // Count students without roll first
    $stmt = $pdo->query("SELECT COUNT(*) FROM students WHERE roll IS NULL OR roll = ''");
    $count = $stmt->fetchColumn();

    echo "Found $count students without a roll number.\n";

    if ($count > 0) {
        // Delete them
        $stmt = $pdo->prepare("DELETE FROM students WHERE roll IS NULL OR roll = ''");
        $stmt->execute();
        $deleted = $stmt->rowCount();
        echo "Successfully deleted $deleted students.\n";
    } else {
        echo "Nothing to delete.\n";
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo "Database Error: " . $e->getMessage();
}
?>
