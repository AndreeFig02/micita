<?php
require 'conexion.php';

$d = json_decode(file_get_contents('php://input'), true);
$email = trim($d['email'] ?? '');
$pass = $d['password'] ?? '';

$st = $pdo->prepare('SELECT u.id, u.nombre, u.rol, u.password_hash, u.local_id,
                            l.nombre AS local_nombre, l.codigo AS local_codigo
                     FROM usuarios u JOIN locales l ON l.id = u.local_id
                     WHERE u.email = ?');
$st->execute([$email]);
$u = $st->fetch(PDO::FETCH_ASSOC);

if (!$u || !password_verify($pass, $u['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Email o contraseña incorrectos']);
    exit;
}
unset($u['password_hash']);
echo json_encode(['ok' => true, 'usuario' => $u]);