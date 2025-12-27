<?php
require_once __DIR__ . '/includes/db.php';

header('Content-Type: text/plain');

try {
    // Count students with roll not starting with 'Agri' (including NULL/empty)
    $sql = "SELECT COUNT(*) FROM students WHERE roll IS NULL OR roll NOT LIKE 'Agri%'";
    $stmt = $pdo->query($sql);
    $count = $stmt->fetchColumn();

    echo "Found $count students whose roll number does not start with 'Agri'.\n";

    if ($count > 0) {
        // Delete them
        $deleteSql = "DELETE FROM students WHERE roll IS NULL OR roll NOT LIKE 'Agri%'";
        $stmt = $pdo->prepare($deleteSql);
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
