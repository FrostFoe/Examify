<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';

/**
 * Database Backup Script for Examify
 * Creates SQL dump of all important tables
 */

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
        'path' => $filename,
        'size' => filesize($filename),
        'message' => 'Backup created successfully'
    ];
}

// Only allow execution from command line or with proper authentication
if (php_sapi_name() !== 'cli') {
    // If accessed via web, require authentication
    $token = $_GET['token'] ?? '';
    if (empty($token) || $token !== getenv('BACKUP_TOKEN')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
}

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
?>