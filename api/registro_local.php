<?php
require 'conexion.php';

$d = json_decode(file_get_contents('php://input'), true);
$local = trim($d['local'] ?? '');
$nombre = trim($d['nombre'] ?? '');
$email = trim($d['email'] ?? '');
$telefono = trim($d['telefono'] ?? '');
$pass = $d['password'] ?? '';

if ($local === '' || $nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos (contraseña mínima: 6 caracteres)']);
    exit;
}

try {
    $pdo->beginTransaction();

    do {
        $codigo = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        $st = $pdo->prepare('SELECT COUNT(*) FROM locales WHERE codigo = ?');
        $st->execute([$codigo]);
    } while ($st->fetchColumn() > 0);

    $pdo->prepare('INSERT INTO locales (nombre, codigo) VALUES (?,?)')->execute([$local, $codigo]);
    $lid = (int)$pdo->lastInsertId();

    $pdo->prepare("INSERT INTO usuarios (nombre,email,telefono,password_hash,rol,local_id) VALUES (?,?,?,?, 'admin', ?)")
        ->execute([$nombre, $email, $telefono, password_hash($pass, PASSWORD_DEFAULT), $lid]);

    $h = $pdo->prepare('INSERT INTO horarios_trabajo (local_id, dia, activo) VALUES (?,?,0)');
    for ($dia = 0; $dia <= 6; $dia++) $h->execute([$lid, $dia]);

    $pdo->commit();
    echo json_encode(['ok' => true, 'codigo' => $codigo]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(409);
    echo json_encode(['error' => 'Ese email ya está registrado']);
}