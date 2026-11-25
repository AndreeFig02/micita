<?php
require 'conexion.php';

$m = $_SERVER['REQUEST_METHOD'];
$d = json_decode(file_get_contents('php://input'), true) ?? [];

if ($m === 'GET') {
    $st = $pdo->prepare('SELECT * FROM servicios WHERE activo = 1 AND local_id = ? ORDER BY categoria, nombre');
    $st->execute([(int)($_GET['local_id'] ?? 0)]);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($m === 'POST') {
    $st = $pdo->prepare('INSERT INTO servicios (nombre,categoria,duracion_min,precio,local_id) VALUES (?,?,?,?,?)');
    $st->execute([$d['nombre'], $d['categoria'], $d['duracion_min'], $d['precio'], (int)$d['local_id']]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($m === 'PUT') {
    $st = $pdo->prepare('UPDATE servicios SET nombre=?, categoria=?, duracion_min=?, precio=? WHERE id=? AND local_id=?');
    $st->execute([$d['nombre'], $d['categoria'], $d['duracion_min'], $d['precio'], $d['id'], (int)$d['local_id']]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($m === 'DELETE') {
    $st = $pdo->prepare('UPDATE servicios SET activo = 0 WHERE id = ? AND local_id = ?');
    $st->execute([$d['id'], (int)$d['local_id']]);
    echo json_encode(['ok' => true]);
}