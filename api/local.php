<?php
require 'conexion.php';

$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    if (isset($_GET['codigo'])) {
        $st = $pdo->prepare('SELECT nombre FROM locales WHERE codigo = ?');
        $st->execute([strtoupper(trim($_GET['codigo']))]);
    } else {
        $st = $pdo->prepare('SELECT id, nombre, codigo FROM locales WHERE id = ?');
        $st->execute([(int)($_GET['local_id'] ?? 0)]);
    }
    echo json_encode($st->fetch(PDO::FETCH_ASSOC) ?: new stdClass());
    exit;
}

if ($m === 'PUT') {
    $d = json_decode(file_get_contents('php://input'), true) ?? [];
    $nombre = trim($d['nombre'] ?? '');
    if ($nombre === '' || mb_strlen($nombre) > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Ingresá un nombre de hasta 100 caracteres']);
        exit;
    }
    $st = $pdo->prepare('UPDATE locales SET nombre = ? WHERE id = ?');
    $st->execute([$nombre, (int)($d['local_id'] ?? 0)]);
    echo json_encode(['ok' => true]);
}