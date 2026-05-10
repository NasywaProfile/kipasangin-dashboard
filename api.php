<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ──────────────────────────────────────────────
//  Konfigurasi Database (phpMyAdmin / XAMPP MySQL)
// ──────────────────────────────────────────────
$host = "localhost";
$user = "root";
$pass = "";           // kosong untuk XAMPP default
$db   = "db_kipasangin";

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Koneksi DB gagal: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];
$table  = isset($_GET['table']) ? $_GET['table'] : '';

// ══════════════════════════════════════════════
//  GET  — Ambil data
// ══════════════════════════════════════════════
if ($method === 'GET') {

    // ── master_kipas ──────────────────────────
    if ($table === 'master_kipas') {
        $id  = isset($_GET['id'])  ? (int)$_GET['id']  : 0;
        $did = isset($_GET['device_id']) ? $conn->real_escape_string($_GET['device_id']) : '';

        if ($id > 0) {
            $sql = "SELECT * FROM master_kipas WHERE id = $id LIMIT 1";
        } elseif ($did !== '') {
            $sql = "SELECT * FROM master_kipas WHERE device_id = '$did' LIMIT 1";
        } else {
            $sql = "SELECT * FROM master_kipas ORDER BY id ASC";
        }
        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        echo json_encode($data);

    // ── activity_log ──────────────────────────
    } elseif ($table === 'activity_log') {
        $date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : '';
        $did  = isset($_GET['device_id']) ? (int)$_GET['device_id'] : 0;

        $sql = "SELECT al.*, mk.device_id AS device_code, mk.nama_kipas
                FROM activity_log al
                LEFT JOIN master_kipas mk ON mk.id = al.device_id";
        $where = [];
        if ($date) $where[] = "DATE(al.created_at) = '$date'";
        if ($did)  $where[] = "al.device_id = $did";
        if ($where) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY al.created_at DESC LIMIT 200";

        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        echo json_encode($data);

    // ── error_log ─────────────────────────────
    } elseif ($table === 'error_log') {
        $date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : '';
        $did  = isset($_GET['device_id']) ? (int)$_GET['device_id'] : 0;

        $sql = "SELECT el.*, mk.device_id AS device_code, mk.nama_kipas
                FROM error_log el
                LEFT JOIN master_kipas mk ON mk.id = el.device_id";
        $where = [];
        if ($date) $where[] = "DATE(el.created_at) = '$date'";
        if ($did)  $where[] = "el.device_id = $did";
        if ($where) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY el.created_at DESC LIMIT 200";

        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) $data[] = $row;
        echo json_encode($data);

    } else {
        http_response_code(400);
        echo json_encode(["error" => "Parameter 'table' tidak dikenali atau kosong"]);
    }

// ══════════════════════════════════════════════
//  POST  — Simpan / Insert data
// ══════════════════════════════════════════════
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // ── master_kipas ──────────────────────────
    if ($table === 'master_kipas') {
        $device_id  = $conn->real_escape_string($input['device_id'] ?? '');
        $nama       = $conn->real_escape_string($input['nama_kipas'] ?? 'Kipas Baru');
        $lokasi     = $conn->real_escape_string($input['lokasi'] ?? '');
        $ip         = $conn->real_escape_string($input['ip_address'] ?? '');

        $sql = "INSERT INTO master_kipas (device_id, nama_kipas, lokasi, ip_address)
                VALUES ('$device_id', '$nama', '$lokasi', '$ip')
                ON DUPLICATE KEY UPDATE
                  nama_kipas = VALUES(nama_kipas),
                  lokasi     = VALUES(lokasi),
                  ip_address = VALUES(ip_address),
                  updated_at = NOW()";

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }

    // ── activity_log ──────────────────────────
    } elseif ($table === 'activity_log') {
        $device_id   = (int)($input['device_id'] ?? 0);
        $action_type = $conn->real_escape_string($input['action_type'] ?? '');
        $temperature = isset($input['temperature']) ? (float)$input['temperature'] : 'NULL';
        $keterangan  = $conn->real_escape_string($input['keterangan'] ?? '');

        $sql = "INSERT INTO activity_log (device_id, action_type, temperature, keterangan)
                VALUES ($device_id, '$action_type', $temperature, '$keterangan')";

        // Update status di master_kipas juga
        if ($action_type === 'ON' || $action_type === 'OFF' || $action_type === 'AUTO') {
            $conn->query("UPDATE master_kipas SET status='$action_type', updated_at=NOW() WHERE id=$device_id");
        }
        if ($temperature !== 'NULL') {
            $conn->query("UPDATE master_kipas SET suhu=$temperature, updated_at=NOW() WHERE id=$device_id");
        }

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }

    // ── error_log ─────────────────────────────
    } elseif ($table === 'error_log') {
        $device_id  = (int)($input['device_id'] ?? 0);
        $error_code = $conn->real_escape_string($input['error_code'] ?? '');
        $error_msg  = $conn->real_escape_string($input['error_msg'] ?? '');
        $severity   = $conn->real_escape_string($input['severity'] ?? 'ERROR');

        $sql = "INSERT INTO error_log (device_id, error_code, error_msg, severity)
                VALUES ($device_id, '$error_code', '$error_msg', '$severity')";

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }

    } else {
        http_response_code(400);
        echo json_encode(["error" => "Parameter 'table' tidak dikenali atau kosong"]);
    }

// ══════════════════════════════════════════════
//  PUT  — Update status kipas
// ══════════════════════════════════════════════
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($table === 'master_kipas') {
        $id        = (int)($input['id'] ?? 0);
        $status    = $conn->real_escape_string($input['status'] ?? '');
        $suhu      = isset($input['suhu']) ? (float)$input['suhu'] : null;
        $kecepatan = isset($input['kecepatan']) ? (int)$input['kecepatan'] : null;

        $sets = ["updated_at = NOW()"];
        if ($status)    $sets[] = "status = '$status'";
        if ($suhu !== null)      $sets[] = "suhu = $suhu";
        if ($kecepatan !== null) $sets[] = "kecepatan = $kecepatan";

        $sql = "UPDATE master_kipas SET " . implode(", ", $sets) . " WHERE id = $id";

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "affected" => $conn->affected_rows]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "PUT hanya didukung untuk tabel master_kipas"]);
    }

} else {
    http_response_code(405);
    echo json_encode(["error" => "Method tidak diizinkan"]);
}

$conn->close();
?>
