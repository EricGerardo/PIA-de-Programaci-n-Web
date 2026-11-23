<?php
// =====================================================================
// Un ramo más | Usuarios (clientes y empleados)
// Clientes y empleados están en la misma tabla Usuarios; los separa el
// campo «rol». El administrador nunca aparece en estas listas.
//   usuarios.php?accion=listar&rol=cliente   (GET, empleado/admin)
//   usuarios.php?accion=listar&rol=empleado  (GET, admin)
//   usuarios.php?accion=crear     (POST, admin) -> { nombre, correo, telefono, clave, rol }
//   usuarios.php?accion=editar    (POST, admin) -> { id, nombre, correo, telefono }
//   usuarios.php?accion=cambiar_rol (POST, admin) -> { id, rol }
//   usuarios.php?accion=eliminar  (POST, admin) -> { id }
// =====================================================================
require __DIR__ . '/conexion.php';

const ROLES_EDITABLES = ['cliente', 'empleado'];

// Busca un usuario que se pueda modificar (que no sea administrador).
function usuarioEditable(PDO $pdo, int $id): array
{
    $consulta = $pdo->prepare('SELECT * FROM Usuarios WHERE id_usuario = ?');
    $consulta->execute([$id]);
    $usuario = $consulta->fetch();
    if (!$usuario) {
        responder(404, ['error' => 'El usuario no existe.']);
    }
    if ($usuario['rol'] === 'administrador') {
        responder(403, ['error' => 'La cuenta del administrador no se puede modificar desde aquí.']);
    }
    return $usuario;
}

// Revisa que el correo sea válido y que no lo use otra cuenta.
function validarCorreo(PDO $pdo, string $correo, int $idActual = 0): void
{
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        responder(400, ['error' => 'El correo no es válido.']);
    }
    $consulta = $pdo->prepare('SELECT id_usuario FROM Usuarios WHERE correo = ? AND id_usuario <> ?');
    $consulta->execute([$correo, $idActual]);
    if ($consulta->fetch()) {
        responder(409, ['error' => 'Ya existe otra cuenta con ese correo.']);
    }
}

switch (accion()) {

    case 'listar':
        $rol = $_GET['rol'] ?? 'cliente';
        if (!in_array($rol, ROLES_EDITABLES, true)) {
            responder(400, ['error' => 'Rol no válido.']);
        }
        // La lista de empleados solo la ve el administrador.
        $rol === 'empleado' ? requiereRol('administrador') : requiereRol('empleado', 'administrador');

        $consulta = $pdo->prepare(
            'SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.fecha_registro,
                    (SELECT COUNT(*) FROM Direcciones d WHERE d.id_usuario = u.id_usuario) AS direcciones,
                    (SELECT COUNT(*) FROM Pedidos p WHERE p.id_usuario = u.id_usuario) AS pedidos
             FROM Usuarios u
             WHERE u.rol = ?
             ORDER BY u.id_usuario'
        );
        $consulta->execute([$rol]);
        responder(200, ['usuarios' => $consulta->fetchAll()]);

    case 'crear':
        requiereRol('administrador');
        $d = leerDatos();
        $nombre = texto($d, 'nombre', 'Nombre', true, 100);
        $correo = mb_strtolower(texto($d, 'correo', 'Correo', true, 150));
        $telefono = texto($d, 'telefono', 'Teléfono', false, 20);
        $clave = (string)($d['clave'] ?? '');
        $rol = $d['rol'] ?? 'cliente';

        if (!in_array($rol, ROLES_EDITABLES, true)) {
            responder(400, ['error' => 'Rol no válido.']);
        }
        if (mb_strlen($clave) < 6) {
            responder(400, ['error' => 'La contraseña debe tener al menos 6 caracteres.']);
        }
        validarCorreo($pdo, $correo);

        $consulta = $pdo->prepare(
            'INSERT INTO Usuarios (nombre, correo, contrasena_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)'
        );
        $consulta->execute([$nombre, $correo, password_hash($clave, PASSWORD_DEFAULT), $telefono, $rol]);
        responder(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

    case 'editar':
        requiereRol('administrador');
        $d = leerDatos();
        $id = idValido($d);
        usuarioEditable($pdo, $id);
        $nombre = texto($d, 'nombre', 'Nombre', true, 100);
        $correo = mb_strtolower(texto($d, 'correo', 'Correo', true, 150));
        $telefono = texto($d, 'telefono', 'Teléfono', false, 20);
        validarCorreo($pdo, $correo, $id);

        $consulta = $pdo->prepare('UPDATE Usuarios SET nombre = ?, correo = ?, telefono = ? WHERE id_usuario = ?');
        $consulta->execute([$nombre, $correo, $telefono, $id]);
        responder(200, ['ok' => true]);

    case 'cambiar_rol':
        // Así un cliente se vuelve empleado (o regresa a cliente).
        requiereRol('administrador');
        $d = leerDatos();
        $id = idValido($d);
        $rol = $d['rol'] ?? '';
        if (!in_array($rol, ROLES_EDITABLES, true)) {
            responder(400, ['error' => 'Rol no válido.']);
        }
        usuarioEditable($pdo, $id);

        $pdo->prepare('UPDATE Usuarios SET rol = ? WHERE id_usuario = ?')->execute([$rol, $id]);
        responder(200, ['ok' => true]);

    case 'eliminar':
        requiereRol('administrador');
        $id = idValido(leerDatos());
        usuarioEditable($pdo, $id);

        // Si tiene pedidos no se borra, para no perder el historial de ventas.
        $consulta = $pdo->prepare('SELECT COUNT(*) AS total FROM Pedidos WHERE id_usuario = ?');
        $consulta->execute([$id]);
        if ($consulta->fetch()['total'] > 0) {
            responder(409, ['error' => 'No se puede eliminar: este usuario tiene pedidos registrados.']);
        }

        // Sus direcciones se borran solas (ON DELETE CASCADE en la tabla Direcciones).
        $pdo->prepare('DELETE FROM Usuarios WHERE id_usuario = ?')->execute([$id]);
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
