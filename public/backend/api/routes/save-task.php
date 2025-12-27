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
    $batch_id = $data['batch_id'] ?? null;
    $action = $data['action'] ?? 'save_task';
    $date = $data['date'] ?? date('Y-m-d');

    if (!$student_uid || !$batch_id) {
        echo json_encode(['success' => false, 'error' => 'Missing student_uid or batch_id']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        if ($action === 'login' || $action === 'save_task' || $action === 'attendance') {
            
            // Handle Attendance - Per Batch, Per Day
            if (isset($data['attendance']) && $data['attendance'] === 'Yes') {
                // Check if already submitted today for this batch
                $stmt = $pdo->prepare("
                    SELECT id FROM student_attendance 
                    WHERE student_uid = ? AND batch_id = ? AND attendance_date = ? AND status = 'Yes'
                ");
                $stmt->execute([$student_uid, $batch_id, $date]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    $stmt = $pdo->prepare("
                        INSERT INTO student_attendance (student_uid, batch_id, status, attendance_date)
                        VALUES (?, ?, 'Yes', ?)
                    ");
                    $stmt->execute([$student_uid, $batch_id, $date]);
                } else {
                    // Already submitted once today for this batch
                    echo json_encode([
                        'success' => false, 
                        'error' => 'আপনি আজ এই ব্যাচের জন্য একবার ইতিমধ্যে উপস্থিতি দিয়েছেন।',
                        'alreadySubmitted' => true
                    ]);
                    exit;
                }
            }

            // Handle Tasks - Per Batch, Per Day
            if ($action === 'save_task') {
                // Check if already submitted today for this batch
                $stmt = $pdo->prepare("
                    SELECT id FROM student_tasks 
                    WHERE student_uid = ? AND batch_id = ? AND task_date = ?
                ");
                $stmt->execute([$student_uid, $batch_id, $date]);
                $existingTask = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingTask) {
                    echo json_encode([
                        'success' => false, 
                        'error' => 'আপনি আজ এই ব্যাচের জন্য একবার ইতিমধ্যে টাস্ক জমা দিয়েছেন।',
                        'alreadySubmitted' => true
                    ]);
                    exit;
                }
                
                $task_1 = $data['task_1'] ?? null;
                $task_2 = $data['task_2'] ?? null;
                $exam_links = isset($data['exam_links']) ? json_encode($data['exam_links']) : null;
                $exam_marks = isset($data['exam_marks']) ? json_encode($data['exam_marks']) : null;

                $stmt = $pdo->prepare("
                    INSERT INTO student_tasks 
                    (student_uid, batch_id, task_1, task_2, exam_links, exam_marks, task_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $student_uid, $batch_id, $task_1, $task_2, $exam_links, $exam_marks, $date
                ]);
            }
        }

        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'ডেটা সফলভাবে সংরক্ষিত হয়েছে',
            'id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

