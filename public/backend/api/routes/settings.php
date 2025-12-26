<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return general settings (could be from a settings table)
    $stmt = $pdo->query("SELECT * FROM app_settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode(['success' => true, 'data' => $settings]);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? '';

    if ($action === 'change-admin-password') {
        $admin_uid = $input['admin_uid'] ?? '';
        $old_password = $input['old_password'] ?? '';
        $new_password = $input['new_password'] ?? '';

        // Verify old password
        $stmt = $pdo->prepare("SELECT password FROM admins WHERE uid = ?");
        $stmt->execute([$admin_uid]);
        $admin = $stmt->fetch();

        if ($admin && $admin['password'] === $old_password) {
            $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE uid = ?");
            $stmt->execute([$new_password, $admin_uid]);
            echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid old password']);
        }
    } elseif ($action === 'update-app-settings') {
        foreach ($input as $key => $value) {
            $stmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$key, $value, $value]);
        }
        echo json_encode(['success' => true]);
    }
}
