<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';

/**
 * Database Restore Script for Examify
 * Restores database from SQL backup file
 */

function restoreFromBackup($backupFile) {
    global $pdo;
    
    if (!file_exists($backupFile)) {
        throw new Exception("Backup file does not exist: $backupFile");
    }
    
    // Read the backup file
    $sql = file_get_contents($backupFile);
    if ($sql === false) {
        throw new Exception("Could not read backup file: $backupFile");
    }
    
    // Split the SQL into statements
    $statements = explode(";\n", $sql);
    
    $pdo->beginTransaction();
    
    try {
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        $pdo->commit();
        return [
            'success' => true,
            'message' => 'Database restored successfully from: ' . basename($backupFile)
        ];
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
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

$backupFile = $_GET['file'] ?? '';
if (empty($backupFile)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Backup file parameter required']);
    exit;
}

// Validate file path to prevent directory traversal
$backupFile = basename($backupFile); // Only use filename
$fullPath = __DIR__ . '/backups/' . $backupFile;

try {
    $result = restoreFromBackup($fullPath);
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?>