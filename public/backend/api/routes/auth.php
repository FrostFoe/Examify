<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'student-login') {
        $roll = $input['roll'] ?? '';
        $pass = $input['pass'] ?? '';
        
        $stmt = $pdo->prepare("SELECT uid, name, roll, pass, enrolled_batches, created_at FROM students WHERE roll = ?");
        $stmt->execute([$roll]);
        $user = $stmt->fetch();
        
        if ($user && $user['pass'] === $pass) {
            unset($user['pass']);
            $user['enrolled_batches'] = json_decode($user['enrolled_batches'] ?? '[]', true);
            echo json_encode(['success' => true, 'data' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid roll or password']);
        }
    } elseif ($action === 'admin-login') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT uid, username, password, role, created_at FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        
        if ($admin && $admin['password'] === $password) {
            unset($admin['password']);
            echo json_encode(['success' => true, 'data' => $admin]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } elseif ($action === 'verify-admin-password') {
        $uid = $input['uid'] ?? '';
        $password = $input['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT password FROM admins WHERE uid = ?");
        $stmt->execute([$uid]);
        $admin = $stmt->fetch();
        
        if ($admin && $admin['password'] === $password) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
    }
}
