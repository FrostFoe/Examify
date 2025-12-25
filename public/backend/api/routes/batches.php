<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$enrolled_by = $_GET['enrolled_by'] ?? null;
$is_public = isset($_GET['is_public']) ? ($_GET['is_public'] === 'true' || $_GET['is_public'] === '1' ? 1 : 0) : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM batches WHERE id = ?");
        $stmt->execute([$id]);
        $batch = $stmt->fetch();
        if ($batch) {
            $batch['is_public'] = (bool)$batch['is_public'];
        }
        echo json_encode(['success' => true, 'data' => $batch]);
    } else {
        $whereClauses = [];
        $params = [];
        
        if ($enrolled_by) {
            $stmt = $pdo->prepare("SELECT enrolled_batches FROM students WHERE uid = ?");
            $stmt->execute([$enrolled_by]);
            $student = $stmt->fetch();
            $enrolledIds = json_decode($student['enrolled_batches'] ?? '[]', true);
            
            if (!empty($enrolledIds)) {
                $placeholders = implode(',', array_fill(0, count($enrolledIds), '?'));
                $whereClauses[] = "id IN ($placeholders)";
                $params = array_merge($params, $enrolledIds);
            } else {
                $whereClauses[] = "0"; // No batches if not enrolled in any
            }
        }
        
        if ($is_public !== null) {
            $whereClauses[] = "is_public = ?";
            $params[] = $is_public;
        }
        
        $whereSql = !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";
        $sql = "SELECT * FROM batches" . $whereSql . " ORDER BY created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $batches = $stmt->fetchAll();
        
        foreach ($batches as &$batch) {
            $batch['is_public'] = (bool)$batch['is_public'];
        }
        
        echo json_encode(['success' => true, 'data' => $batches]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? '';

    if ($action === 'create') {
        $id = $input['id'] ?? uuidv4();
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $icon_url = !empty($input['icon_url']) ? $input['icon_url'] : null;
        $status = $input['status'] ?? 'live';
        $is_public = ($input['is_public'] ?? false) ? 1 : 0;

        $stmt = $pdo->prepare("INSERT INTO batches (id, name, description, icon_url, status, is_public) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $name, $description, $icon_url, $status, $is_public]);
        
        $stmt = $pdo->prepare("SELECT * FROM batches WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
    } elseif ($action === 'update') {
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $icon_url = isset($input['icon_url']) ? $input['icon_url'] : null;
        $is_public = isset($input['is_public']) ? ($input['is_public'] ? 1 : 0) : null;

        $sql = "UPDATE batches SET name = ?, description = ?";
        $params = [$name, $description];
        
        if ($icon_url !== null) {
            $sql .= ", icon_url = ?";
            $params[] = !empty($icon_url) ? $icon_url : null;
        }
        if ($is_public !== null) {
            $sql .= ", is_public = ?";
            $params[] = $is_public;
        }
        $sql .= " WHERE id = ?";
        $params[] = $id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $pdo->prepare("SELECT * FROM batches WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
    } elseif ($action === 'delete') {
        $id = $input['id'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM batches WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}
