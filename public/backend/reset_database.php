<?php
require_once __DIR__ . '/includes/config.php';

echo "Starting database reset...\n";

// Connect without specifying database name to allow dropping the database
try {
    $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    echo "Connected to MySQL server.\n";
} catch (\PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

// Drop database if it exists
try {
    $pdo->exec("DROP DATABASE IF EXISTS `" . DB_NAME . "`");
    echo "Dropped database: " . DB_NAME . "\n";
} catch (\PDOException $e) {
    die("Error dropping database: " . $e->getMessage());
}

// Create database
try {
    $pdo->exec("CREATE DATABASE `" . DB_NAME . "` CHARACTER SET " . DB_CHARSET . " COLLATE " . DB_CHARSET . "_unicode_ci");
    echo "Created database: " . DB_NAME . "\n";
    
    // Select the database
    $pdo->exec("USE `" . DB_NAME . "`");
} catch (\PDOException $e) {
    die("Error creating database: " . $e->getMessage());
}

// Read and execute the merged SQL file
$sqlFilePath = __DIR__ . '/merged.sql';
if (!file_exists($sqlFilePath)) {
    die("SQL file not found: " . $sqlFilePath);
}

$sqlContent = file_get_contents($sqlFilePath);
if ($sqlContent === false) {
    die("Could not read SQL file: " . $sqlFilePath);
}

try {
    // Remove comments to avoid issues with splitting
    $sqlContent = preg_replace('/^--.*$/m', '', $sqlContent);
    
    // Split the SQL content into individual statements and execute them
    $statements = array_filter(
        array_map('trim', explode(';', $sqlContent)),
        function($statement) {
            return !empty($statement);
        }
    );
    
    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            $pdo->exec($statement);
        }
    }
    
    echo "Database schema and seed data applied successfully!\n";
} catch (\PDOException $e) {
    die("Error executing SQL: " . $e->getMessage() . "\nStatement: " . $statement);
}

// Close connection
$pdo = null;

echo "Database reset completed successfully!\n";
echo "Database: " . DB_NAME . "\n";
echo "Tables created and seeded with initial data.\n";
?>