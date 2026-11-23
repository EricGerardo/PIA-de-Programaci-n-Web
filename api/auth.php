<?php
// =====================================================================
// Un ramo más | Autenticación: iniciar sesión, crear cuenta, cerrar sesión
//   auth.php?accion=sesion    (GET)  -> datos del usuario con sesión
//   auth.php?accion=login     (POST) -> { correo, clave }
//   auth.php?accion=registro  (POST) -> { nombre, correo, telefono, clave }
//   auth.php?accion=logout    (POST)
// =====================================================================
require __DIR__ . '/conexion.php';

// Guarda en la sesión los datos del usuario que se necesitan en las páginas.
function iniciarSesion(array $u): array
{
    session_regenerate_id(true); // nuevo id de sesión al entrar (seguridad)
    $_SESSION['usuario'] = [
        'id' => (int)$u['id_usuario'],
        'nombre' => $u['nombre'],
        'correo' => $u['correo'],
        'rol' => $u['rol'],
    ];
    return $_SESSION['usuario'];
}

switch (accion()) {

    case 'sesion':
        responder(200, ['usuario' => requiereRol()]);

    case 'login':
        $datos = leerDatos();
        $correo = mb_strtolower(texto($datos, 'correo', 'Correo'));
        $clave = (string)($datos['clave'] ?? '');

        $consulta = $pdo->prepare('SELECT * FROM Usuarios WHERE correo = ?');
        $consulta->execute([$correo]);
        $usuario = $consulta->fetch();

        // Mismo mensaje si el correo no existe o la contraseña es incorrecta,
        // así no se revela qué correos están registrados.
        if (!$usuario || !password_verify($clave, $usuario['contrasena_hash'])) {
            responder(401, ['error' => 'Correo o contraseña incorrectos.']);
        }
        responder(200, ['usuario' => iniciarSesion($usuario)]);

    case 'registro':
        $datos = leerDatos();
        $nombre = texto($datos, 'nombre', 'Nombre', true, 100);
        $correo = mb_strtolower(texto($datos, 'correo', 'Correo', true, 150));
        $telefono = texto($datos, 'telefono', 'Teléfono', false, 20);
        $clave = (string)($datos['clave'] ?? '');

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            responder(400, ['error' => 'El correo no es válido.']);
        }
        if (mb_strlen($clave) < 6) {
            responder(400, ['error' => 'La contraseña debe tener al menos 6 caracteres.']);
        }

        $consulta = $pdo->prepare('SELECT id_usuario FROM Usuarios WHERE correo = ?');
        $consulta->execute([$correo]);
        if ($consulta->fetch()) {
            responder(409, ['error' => 'Ya existe una cuenta con ese correo.']);
        }

        // Toda cuenta nueva es de cliente; solo el administrador cambia roles.
        $consulta = $pdo->prepare(
            "INSERT INTO Usuarios (nombre, correo, contrasena_hash, telefono, rol)
             VALUES (?, ?, ?, ?, 'cliente')"
        );
        $consulta->execute([$nombre, $correo, password_hash($clave, PASSWORD_DEFAULT), $telefono]);

        $nuevo = [
            'id_usuario' => $pdo->lastInsertId(),
            'nombre' => $nombre,
            'correo' => $correo,
            'rol' => 'cliente',
        ];
        responder(201, ['usuario' => iniciarSesion($nuevo)]);

    case 'logout':
        leerDatos();
        $_SESSION = [];
        session_destroy();
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
