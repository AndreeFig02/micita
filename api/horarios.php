<?php
require 'conexion.php';

$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $lid = (int)($_GET['local_id'] ?? 0);

    $ins = $pdo->prepare('INSERT IGNORE INTO horarios_trabajo (local_id, dia, activo) VALUES (?, ?, 0)');
    for ($dia = 0; $dia <= 6; $dia++) $ins->execute([$lid, $dia]);

    $st = $pdo->prepare("SELECT dia, activo,
                                TIME_FORMAT(desde,'%H:%i') AS desde, TIME_FORMAT(hasta,'%H:%i') AS hasta,
                                TIME_FORMAT(desde2,'%H:%i') AS desde2, TIME_FORMAT(hasta2,'%H:%i') AS hasta2
                         FROM horarios_trabajo WHERE local_id = ? ORDER BY dia");
    $st->execute([$lid]);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($m === 'PUT') {
    $d = json_decode(file_get_contents('php://input'), true);
    $lid = (int)($d['local_id'] ?? 0);
    $up = $pdo->prepare('UPDATE horarios_trabajo SET activo=?, desde=?, hasta=?, desde2=?, hasta2=? WHERE dia=? AND local_id=?');
    $hora = '/^\d{2}:\d{2}$/';

    foreach (($d['dias'] ?? []) as $x) {
        $d1 = $x['desde'] ?? ''; $h1 = $x['hasta'] ?? '';
        $d2 = $x['desde2'] ?? ''; $h2 = $x['hasta2'] ?? '';

        if (!preg_match($hora, $d1) || !preg_match($hora, $h1) || $d1 >= $h1) {
            http_response_code(400);
            echo json_encode(['error' => 'Revisá el primer turno: "desde" debe ser menor que "hasta"']);
            exit;
        }

        if ($d2 === '' && $h2 === '') {
            $d2 = null; $h2 = null;
        } else {
            if (!preg_match($hora, $d2) || !preg_match($hora, $h2) || $d2 >= $h2) {
                http_response_code(400);
                echo json_encode(['error' => 'Revisá el segundo turno: completá los dos horarios y "desde" debe ser menor que "hasta"']);
                exit;
            }
            if ($d2 < $h1) {
                http_response_code(400);
                echo json_encode(['error' => 'El segundo turno tiene que empezar después de que termina el primero']);
                exit;
            }
        }
        $up->execute([$x['activo'] ? 1 : 0, $d1, $h1, $d2, $h2, (int)$x['dia'], $lid]);
    }
    echo json_encode(['ok' => true]);
}