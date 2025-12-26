<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // If not JSON, try $_POST
    if (!$data) {
        $data = $_POST;
    }

    $student_uid = $data['student_uid'] ?? null;
    $action = $data['action'] ?? 'save_task';
    $date = $data['date'] ?? date('Y-m-d');

    if (!$student_uid) {
        echo json_encode(['success' => false, 'error' => 'Missing student_uid']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        if ($action === 'login' || $action === 'save_task' || $action === 'attendance') {
            
            // Handle Attendance
            if (isset($data['attendance']) && $data['attendance'] === 'Yes') {
                $stmt = $pdo->prepare("
                    INSERT INTO student_attendance (student_uid, status, attendance_date)
                    VALUES (?, 'Yes', ?)
                    ON DUPLICATE KEY UPDATE status = 'Yes'
                ");
                $stmt->execute([$student_uid, $date]);
            }

            // Handle Tasks
            if ($action === 'save_task') {
                $task_1 = $data['task_1'] ?? null;
                $task_2 = $data['task_2'] ?? null;
                $exam_links = isset($data['exam_links']) ? json_encode($data['exam_links']) : null;
                $exam_marks = isset($data['exam_marks']) ? json_encode($data['exam_marks']) : null;

                $stmt = $pdo->prepare("
                    INSERT INTO student_tasks (student_uid, task_1, task_2, exam_links, exam_marks, task_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        task_1 = COALESCE(?, task_1),
                        task_2 = COALESCE(?, task_2),
                        exam_links = COALESCE(?, exam_links),
                        exam_marks = COALESCE(?, exam_marks)
                ");
                $stmt->execute([
                    $student_uid, $task_1, $task_2, $exam_links, $exam_marks, $date,
                    $task_1, $task_2, $exam_links, $exam_marks
                ]);
            }
        }

        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'Data saved successfully',
            'id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
