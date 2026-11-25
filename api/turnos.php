<?php
require 'conexion.php';
date_default_timezone_set('America/Argentina/Buenos_Aires');

const PASO = 30; // minutos entre horarios

$m = $_SERVER['REQUEST_METHOD'];
$d = json_decode(file_get_contents('php://input'), true) ?? [];

function hayConflicto($pdo, $lid, $fecha, $ini, $fin) {
    $st = $pdo->prepare("SELECT COUNT(*) FROM turnos WHERE local_id=? AND fecha=? AND estado='confirmado' AND hora_inicio < ? AND hora_fin > ?");
    $st->execute([$lid, $fecha, $fin, $ini]);
    if ($st->fetchColumn() > 0) return true;
    $st = $pdo->prepare("SELECT COUNT(*) FROM bloqueos WHERE local_id=? AND fecha=? AND (hora_inicio IS NULL OR (hora_inicio < ? AND hora_fin > ?))");
    $st->execute([$lid, $fecha, $fin, $ini]);
    return $st->fetchColumn() > 0;
}

function duracion($pdo, $lid, $sid) {
    $st = $pdo->prepare('SELECT duracion_min FROM servicios WHERE id=? AND local_id=? AND activo=1');
    $st->execute([$sid, $lid]);
    return (int)$st->fetchColumn();
}

function fechaValida($f) {
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $f) && strtotime($f) !== false;
}

function rangosDelDia($pdo, $lid, $fecha) {
    $st = $pdo->prepare('SELECT desde, hasta, desde2, hasta2 FROM horarios_trabajo WHERE local_id = ? AND dia = ? AND activo = 1');
    $st->execute([$lid, (int)date('w', strtotime($fecha))]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    if (!$r) return [];
    $rangos = [[$r['desde'], $r['hasta']]];
    if ($r['desde2'] && $r['hasta2']) $rangos[] = [$r['desde2'], $r['hasta2']];
    return $rangos;
}

// Horarios libres para un servicio y una fecha
if ($m === 'GET' && isset($_GET['disponibles'])) {
    $lid = (int)($_GET['local_id'] ?? 0);
    $fecha = $_GET['fecha'] ?? '';
    $dur = duracion($pdo, $lid, (int)($_GET['servicio_id'] ?? 0));
    $rangos = fechaValida($fecha) ? rangosDelDia($pdo, $lid, $fecha) : [];
    if ($dur <= 0 || !$rangos) { echo json_encode([]); exit; }

    $horas = [];
    foreach ($rangos as [$desde, $hasta]) {
        $t = strtotime("$fecha $desde");
        $cierre = strtotime("$fecha $hasta");
        while ($t + $dur * 60 <= $cierre) {
            $ini = date('H:i:s', $t);
            $fin = date('H:i:s', $t + $dur * 60);
            if ($t > time() && !hayConflicto($pdo, $lid, $fecha, $ini, $fin)) $horas[] = substr($ini, 0, 5);
            $t += PASO * 60;
        }
    }
    echo json_encode($horas);
    exit;
}

// Lista de turnos de un local
if ($m === 'GET' && isset($_GET['lista'])) {
    $lid = (int)($_GET['local_id'] ?? 0);
    $f = $_GET['fecha'] ?? '';
    $sql = "SELECT t.id, t.fecha, t.hora_inicio, t.hora_fin, t.estado, t.recordatorio_enviado,
                   s.nombre AS servicio, u.nombre AS clienta, u.telefono
            FROM turnos t
            JOIN servicios s ON s.id = t.servicio_id
            JOIN usuarios u ON u.id = t.usuario_id
            WHERE t.estado = 'confirmado' AND t.local_id = ? AND ";
    if (fechaValida($f)) {
        $st = $pdo->prepare($sql . "t.fecha = ? ORDER BY t.hora_inicio");
        $st->execute([$lid, $f]);
    } else {
        $st = $pdo->prepare($sql . "t.fecha >= ? ORDER BY t.fecha, t.hora_inicio");
        $st->execute([$lid, date('Y-m-d')]);
    }
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// Turnos de una clienta
if ($m === 'GET') {
    $sql = "SELECT t.id, t.fecha, t.hora_inicio, t.hora_fin, t.estado, t.recordatorio_enviado,
                   s.nombre AS servicio, u.nombre AS clienta, u.telefono
            FROM turnos t
            JOIN servicios s ON s.id = t.servicio_id
            JOIN usuarios u ON u.id = t.usuario_id
            WHERE t.estado = 'confirmado' AND ";
    if (isset($_GET['usuario_id'])) {
        $st = $pdo->prepare($sql . "t.usuario_id = ? AND t.fecha >= CURDATE() ORDER BY t.fecha, t.hora_inicio");
        $st->execute([(int)$_GET['usuario_id']]);
    } else {
        $st = $pdo->prepare($sql . "t.local_id = ? AND t.fecha = ? ORDER BY t.hora_inicio");
        $st->execute([(int)($_GET['local_id'] ?? 0), $_GET['fecha'] ?? date('Y-m-d')]);
    }
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// Crear turno
if ($m === 'POST') {
    $uid = (int)($d['usuario_id'] ?? 0);
    $lid = (int)($d['local_id'] ?? 0);
    $sid = (int)($d['servicio_id'] ?? 0);
    $fecha = $d['fecha'] ?? '';
    $hora = $d['hora'] ?? '';
    $dur = duracion($pdo, $lid, $sid);

    if ($uid <= 0 || $lid <= 0 || $dur <= 0 || !fechaValida($fecha) || !preg_match('/^\d{2}:\d{2}$/', $hora)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']); exit;
    }

    $t = strtotime("$fecha $hora");
    if ($t <= time()) {
        http_response_code(400);
        echo json_encode(['error' => 'Elegí una fecha y hora futuras']); exit;
    }

    $ini = date('H:i:s', $t);
    $fin = date('H:i:s', $t + $dur * 60);

    $dentro = false;
    foreach (rangosDelDia($pdo, $lid, $fecha) as [$a, $b]) {
        if ($ini >= $a && $fin <= $b) { $dentro = true; break; }
    }

    if (!$dentro) {
        http_response_code(400);
        echo json_encode(['error' => 'Ese día u horario está fuera de atención']); exit;
    }

    if (hayConflicto($pdo, $lid, $fecha, $ini, $fin)) {
        http_response_code(409);
        echo json_encode(['error' => 'Ese horario ya no está disponible']); exit;
    }
    
    $st = $pdo->prepare('INSERT INTO turnos (usuario_id, servicio_id, local_id, fecha, hora_inicio, hora_fin) VALUES (?,?,?,?,?,?)');
    $st->execute([$uid, $sid, $lid, $fecha, $ini, $fin]);
    echo json_encode(['ok' => true]);
    exit;
}

// Marcar recordatorio como enviado
if ($m === 'PUT') {
    $st = $pdo->prepare('UPDATE turnos SET recordatorio_enviado = 1 WHERE id = ?');
    $st->execute([(int)($d['id'] ?? 0)]);
    echo json_encode(['ok' => true]);
    exit;
}

// Cancelar turno
if ($m === 'DELETE') {
    $st = $pdo->prepare("UPDATE turnos SET estado='cancelado' WHERE id=?");
    $st->execute([(int)($d['id'] ?? 0)]);
    echo json_encode(['ok' => true]);
}