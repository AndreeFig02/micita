<?php
require 'conexion.php';

$d = json_decode(file_get_contents('php://input'), true);
$nombre = trim($d['nombre'] ?? '');
$email = trim($d['email'] ?? '');
$telefono = trim($d['telefono'] ?? '');
$pass = $d['password'] ?? '';
$codigo = strtoupper(trim($d['codigo'] ?? ''));

if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos (contraseña mínima: 6 caracteres)']);
    exit;
}

$st = $pdo->prepare('SELECT id FROM locales WHERE codigo = ?');
$st->execute([$codigo]);
$lid = $st->fetchColumn();
if (!$lid) {
    http_response_code(404);
    echo json_encode(['error' => 'Código de local incorrecto']);
    exit;
}

try {
    $st = $pdo->prepare('INSERT INTO usuarios (nombre,email,telefono,password_hash,local_id) VALUES (?,?,?,?,?)');
    $st->execute([$nombre, $email, $telefono, password_hash($pass, PASSWORD_DEFAULT), $lid]);
    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode(['error' => 'Ese email ya está registrado']);
}