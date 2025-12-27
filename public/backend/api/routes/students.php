<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];
$uid = $_GET['uid'] ?? null;

if ($method === 'GET') {
    if ($uid) {
        $stmt = $pdo->prepare("SELECT uid, name, roll, pass, enrolled_batches, created_at FROM students WHERE uid = ?");
        $stmt->execute([$uid]);
        $student = $stmt->fetch();
        if ($student) {
            $student['enrolled_batches'] = json_decode($student['enrolled_batches'] ?? '[]', true);
        }
        echo json_encode(['success' => true, 'data' => $student]);
    } else {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 1000000);
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $roll = $_GET['roll'] ?? '';
        $batch_id = $_GET['batch_id'] ?? null;
        
        $whereClauses = [];
        $params = [];
        
        if (!empty($roll)) {
            $whereClauses[] = "roll = ?";
            $params[] = $roll;
        } elseif (!empty($search)) {
            $whereClauses[] = "(name LIKE ? OR roll LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if (!empty($batch_id)) {
            $whereClauses[] = "JSON_CONTAINS(enrolled_batches, ?)";
            $params[] = json_encode($batch_id);
        }
        
        $whereSql = !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";
        
        $sql = "SELECT uid, name, roll, enrolled_batches, created_at FROM students" . $whereSql;
        $countSql = "SELECT COUNT(*) FROM students" . $whereSql;
        
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetchColumn();
        
        $sql .= " ORDER BY roll DESC LIMIT $limit OFFSET $offset";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();
        foreach ($students as &$s) {
            $s['enrolled_batches'] = json_decode($s['enrolled_batches'] ?? '[]', true);
        }
        echo json_encode(['success' => true, 'data' => $students, 'total' => (int)$total]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    $action = $_GET['action'] ?? '';

    try {
        if ($action === 'create') {
            $uid = $input['uid'] ?? uuidv4();
            $name = $input['name'] ?? '';
            $roll = $input['roll'] ?? '';
            $pass = $input['pass'] ?? '';
            $enrolled_batches = json_encode($input['enrolled_batches'] ?? []);

            $stmt = $pdo->prepare("INSERT INTO students (uid, name, roll, pass, enrolled_batches) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$uid, $name, $roll, $pass, $enrolled_batches]);
            
            $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE uid = ?");
            $stmt->execute([$uid]);
            $user = $stmt->fetch();
            $user['enrolled_batches'] = json_decode($user['enrolled_batches'] ?? '[]', true);
            echo json_encode(['success' => true, 'data' => $user]);
        } elseif ($action === 'guest-enroll') {
            $name = $input['name'] ?? '';
            $roll = $input['roll'] ?? '';
            
            if (empty($name) || empty($roll)) {
                echo json_encode(['success' => false, 'message' => 'Name and Roll are required']);
                exit;
            }

            // Check if student with this roll already exists
            $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE roll = ?");
            $stmt->execute([$roll]);
            $user = $stmt->fetch();
            
            if ($user) {
                $user['enrolled_batches'] = json_decode($user['enrolled_batches'] ?? '[]', true);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                $uid = uuidv4();
                $pass = 'guest_' . bin2hex(random_bytes(4)); // Placeholder password
                $enrolled_batches = json_encode([]);

                $stmt = $pdo->prepare("INSERT INTO students (uid, name, roll, pass, enrolled_batches) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$uid, $name, $roll, $pass, $enrolled_batches]);
                
                $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE uid = ?");
                $stmt->execute([$uid]);
                $user = $stmt->fetch();
                if ($user) {
                    $user['enrolled_batches'] = json_decode($user['enrolled_batches'] ?? '[]', true);
                }
                echo json_encode(['success' => true, 'data' => $user]);
            }
        } elseif ($action === 'update') {
            $uid = $input['uid'] ?? '';
            
            $fields = [];
            $params = [];
            
            if (isset($input['name'])) {
                $fields[] = "name = ?";
                $params[] = $input['name'];
            }
            
            if (isset($input['roll'])) {
                $fields[] = "roll = ?";
                $params[] = $input['roll'];
            }
            
            if (isset($input['pass'])) {
                $fields[] = "pass = ?";
                $params[] = $input['pass'];
            }
            
            if (isset($input['enrolled_batches'])) {
                $fields[] = "enrolled_batches = ?";
                $params[] = json_encode($input['enrolled_batches']);
            }
            
            if (empty($fields)) {
                echo json_encode(['success' => false, 'message' => 'No fields provided for update']);
                exit;
            }
            
            $sql = "UPDATE students SET " . implode(", ", $fields) . " WHERE uid = ?";
            $params[] = $uid;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE uid = ?");
            $stmt->execute([$uid]);
            $user = $stmt->fetch();
            if ($user) {
                $user['enrolled_batches'] = json_decode($user['enrolled_batches'] ?? '[]', true);
            }
            echo json_encode(['success' => true, 'data' => $user]);
        } elseif ($action === 'enroll') {
            $uid = $input['uid'] ?? '';
            $batch_id = $input['batch_id'] ?? '';
            
            // First check if student exists
            $stmt = $pdo->prepare("SELECT enrolled_batches FROM students WHERE uid = ?");
            $stmt->execute([$uid]);
            $user = $stmt->fetch();
            
            // If student doesn't exist, create one from users table
            if (!$user) {
                $stmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ?");
                $stmt->execute([$uid]);
                $userInfo = $stmt->fetch();
                
                if ($userInfo) {
                    // Create student record
                    $name = $userInfo['name'] ?? 'Unknown';
                    $stmt = $pdo->prepare("INSERT INTO students (uid, name, roll, pass, enrolled_batches) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$uid, $name, '', '', json_encode([])]);
                    $user = ['enrolled_batches' => '[]'];
                } else {
                    echo json_encode(['success' => false, 'message' => 'User not found']);
                    exit;
                }
            }
            
            if ($user) {
                $batches = json_decode($user['enrolled_batches'] ?? '[]', true);
                if (!in_array($batch_id, $batches)) {
                    $batches[] = $batch_id;
                    $stmt = $pdo->prepare("UPDATE students SET enrolled_batches = ? WHERE uid = ?");
                    $stmt->execute([json_encode($batches), $uid]);
                }
                
                // Return updated user
                $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE uid = ?");
                $stmt->execute([$uid]);
                $updatedUser = $stmt->fetch();
                $updatedUser['enrolled_batches'] = json_decode($updatedUser['enrolled_batches'] ?? '[]', true);
                echo json_encode(['success' => true, 'data' => $updatedUser]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
        } elseif ($action === 'unenroll') {
            $uid = $input['uid'] ?? '';
            $batch_id = $input['batch_id'] ?? '';
            
            $stmt = $pdo->prepare("SELECT enrolled_batches FROM students WHERE uid = ?");
            $stmt->execute([$uid]);
            $user = $stmt->fetch();
            
            if ($user) {
                $batches = json_decode($user['enrolled_batches'] ?? '[]', true);
                $batches = array_values(array_filter($batches, function($id) use ($batch_id) { return $id !== $batch_id; }));
                $stmt = $pdo->prepare("UPDATE students SET enrolled_batches = ? WHERE uid = ?");
                $stmt->execute([json_encode($batches), $uid]);
                
                // Return updated user
                $stmt = $pdo->prepare("SELECT uid, name, roll, enrolled_batches, created_at FROM students WHERE uid = ?");
                $stmt->execute([$uid]);
                $updatedUser = $stmt->fetch();
                $updatedUser['enrolled_batches'] = json_decode($updatedUser['enrolled_batches'] ?? '[]', true);
                echo json_encode(['success' => true, 'data' => $updatedUser]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
        } elseif ($action === 'delete') {
            $uid = $input['uid'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM students WHERE uid = ?");
            $stmt->execute([$uid]);
            echo json_encode(['success' => true]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}