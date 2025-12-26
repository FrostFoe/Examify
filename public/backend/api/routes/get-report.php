<?php
if (!defined('API_ACCESS')) exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $month = $_GET['month'] ?? date('m');
    $year = $_GET['year'] ?? date('Y');
    $batch_id = $_GET['batch_id'] ?? null;
    $filter_student_uid = $_GET['student_uid'] ?? null;
    
    $startDate = "$year-$month-01";
    $endDate = date("Y-m-t", strtotime($startDate));

    try {
        // 1. Get students (optionally filtered by batch or uid)
        $studentSql = "SELECT uid, name, roll FROM students";
        $params = [];
        $whereClauses = [];

        if ($filter_student_uid) {
            $whereClauses[] = "uid = ?";
            $params[] = $filter_student_uid;
        }

        if ($batch_id) {
            $whereClauses[] = "JSON_CONTAINS(enrolled_batches, ?)";
            $params[] = json_encode($batch_id);
        }

        if (!empty($whereClauses)) {
            $studentSql .= " WHERE " . implode(" AND ", $whereClauses);
        }
        $stmt = $pdo->prepare($studentSql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();

        $report = [];

        foreach ($students as $student) {
            $uid = $student['uid'];

            // Fetch Attendance for this month
            $stmt = $pdo->prepare("SELECT attendance_date, status FROM student_attendance WHERE student_uid = ? AND attendance_date BETWEEN ? AND ?");
            $stmt->execute([$uid, $startDate, $endDate]);
            $attendance = $stmt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_UNIQUE | PDO::FETCH_ASSOC);

            // Fetch Tasks for this month
            $stmt = $pdo->prepare("SELECT task_date, task_1, task_2, exam_links, exam_marks FROM student_tasks WHERE student_uid = ? AND task_date BETWEEN ? AND ?");
            $stmt->execute([$uid, $startDate, $endDate]);
            $tasks = $stmt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_UNIQUE | PDO::FETCH_ASSOC);

            $studentData = [
                'uid' => $uid,
                'name' => $student['name'],
                'roll' => $student['roll'],
                'days' => []
            ];

            // Fill each day of the month
            $current = strtotime($startDate);
            $last = strtotime($endDate);
            while ($current <= $last) {
                $dateStr = date('Y-m-d', $current);
                $dayData = [
                    'date' => $dateStr,
                    'attendance' => isset($attendance[$dateStr]) ? $attendance[$dateStr]['status'] : '-',
                    'task_1' => isset($tasks[$dateStr]['task_1']) ? $tasks[$dateStr]['task_1'] : null,
                    'task_2' => isset($tasks[$dateStr]['task_2']) ? $tasks[$dateStr]['task_2'] : null,
                    'exams' => isset($tasks[$dateStr]['exam_links']) ? json_decode($tasks[$dateStr]['exam_links'], true) : [],
                    'marks' => isset($tasks[$dateStr]['exam_marks']) ? json_decode($tasks[$dateStr]['exam_marks'], true) : []
                ];
                
                // Calculate progress %
                $completed = 0;
                if ($dayData['attendance'] === 'Yes') $completed++;
                if (!empty($dayData['task_1'])) $completed++;
                if (!empty($dayData['task_2'])) $completed++;
                if (!empty($dayData['exams'])) $completed++;
                
                $dayData['progress'] = round(($completed / 4) * 100);

                $studentData['days'][$dateStr] = $dayData;
                $current = strtotime("+1 day", $current);
            }

            $report[] = $studentData;
        }

        echo json_encode(['success' => true, 'data' => $report]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
