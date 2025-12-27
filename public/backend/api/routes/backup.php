<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Only allow admin users to create backups
if (!isLoggedIn() || !isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

function isAdmin() {
    // In a real implementation, you'd check admin privileges
    // For now, we'll assume any logged in user with admin role can do this
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

function createBackup() {
    global $pdo;
    
    $backupDir = __DIR__ . '/backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d_H-i-s');
    $filename = $backupDir . '/examify_backup_' . $timestamp . '.sql';
    
    $tables = [
        'admins',
        'api_tokens', 
        'batches',
        'exams',
        'files',
        'questions',
        'student_exams',
        'students',
        'student_attendance',
        'student_tasks'
    ];
    
    $backupContent = "-- Examify Database Backup\n";
    $backupContent .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n";
    $backupContent .= "-- Host: " . DB_HOST . "\n";
    $backupContent .= "-- Database: " . DB_NAME . "\n\n";
    
    foreach ($tables as $table) {
        // Get table structure
        $tableInfo = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
        $backupContent .= $tableInfo['Create Table'] . ";\n\n";
        
        // Get table data
        $stmt = $pdo->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($rows) > 0) {
            $backupContent .= "INSERT INTO `$table` VALUES \n";
            $first = true;
            foreach ($rows as $row) {
                if (!$first) {
                    $backupContent .= ",\n";
                }
                $first = false;
                
                $values = [];
                foreach ($row as $value) {
                    if ($value === null) {
                        $values[] = 'NULL';
                    } else {
                        $values[] = $pdo->quote($value);
                    }
                }
                $backupContent .= "(" . implode(', ', $values) . ")";
            }
            $backupContent .= ";\n\n";
        }
    }
    
    // Write to file
    file_put_contents($filename, $backupContent);
    
    return [
        'success' => true,
        'filename' => basename($filename),
        'size' => filesize($filename),
        'message' => 'Backup created successfully'
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $result = createBackup();
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>