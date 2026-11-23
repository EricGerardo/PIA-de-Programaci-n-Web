<?php
// =====================================================================
// Un ramo más | Direcciones de entrega
//   direcciones.php?accion=mias      (GET)  -> direcciones del usuario con sesión (pago)
//   direcciones.php?accion=listar    (GET, empleado/admin) -> todas
//   direcciones.php?accion=crear     (POST) -> el usuario agrega una suya;
//                                             el admin puede indicar id_usuario
//   direcciones.php?accion=editar    (POST, admin)
//   direcciones.php?accion=eliminar  (POST, admin)
// =====================================================================
require __DIR__ . '/conexion.php';

// Valida los campos del formulario de dirección.
function datosDireccion(array $d): array
{
    $cp = texto($d, 'codigo_postal', 'Código postal', true, 5);
    if (!preg_match('/^\d{5}$/', $cp)) {
        responder(400, ['error' => 'El código postal debe tener 5 dígitos.']);
    }
    return [
        texto($d, 'alias', 'Alias', true, 50),
        texto($d, 'calle_numero', 'Calle y número', true, 120),
        texto($d, 'colonia', 'Colonia', true, 80),
        texto($d, 'ciudad', 'Ciudad', true, 80),
        $cp,
        texto($d, 'referencias', 'Referencias', false, 200),
    ];
}

// Revisa que el id corresponda a un cliente o empleado existente.
function usuarioValido(PDO $pdo, int $id): void
{
    $consulta = $pdo->prepare("SELECT id_usuario FROM Usuarios WHERE id_usuario = ? AND rol <> 'administrador'");
    $consulta->execute([$id]);
    if (!$consulta->fetch()) {
        responder(400, ['error' => 'Selecciona un usuario válido.']);
    }
}

switch (accion()) {

    case 'mias':
        $usuario = requiereRol();
        $consulta = $pdo->prepare('SELECT * FROM Direcciones WHERE id_usuario = ? ORDER BY id_direccion');
        $consulta->execute([$usuario['id']]);
        responder(200, ['direcciones' => $consulta->fetchAll()]);

    case 'listar':
        requiereRol('empleado', 'administrador');
        $direcciones = $pdo->query(
            'SELECT d.*, u.nombre AS usuario
             FROM Direcciones d
             JOIN Usuarios u ON u.id_usuario = d.id_usuario
             ORDER BY d.id_direccion'
        )->fetchAll();
        responder(200, ['direcciones' => $direcciones]);

    case 'crear':
        $usuario = requiereRol();
        $d = leerDatos();
        $idUsuario = $usuario['id'];
        if ($usuario['rol'] === 'administrador' && !empty($d['id_usuario'])) {
            $idUsuario = idValido($d, 'id_usuario');
            usuarioValido($pdo, $idUsuario);
        }
        $valores = datosDireccion($d);
        array_unshift($valores, $idUsuario);

        $consulta = $pdo->prepare(
            'INSERT INTO Direcciones (id_usuario, alias, calle_numero, colonia, ciudad, codigo_postal, referencias)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $consulta->execute($valores);
        responder(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

    case 'editar':
        requiereRol('administrador');
        $d = leerDatos();
        $idUsuario = idValido($d, 'id_usuario');
        usuarioValido($pdo, $idUsuario);
        $valores = datosDireccion($d);
        array_unshift($valores, $idUsuario);
        $valores[] = idValido($d);

        $consulta = $pdo->prepare(
            'UPDATE Direcciones
             SET id_usuario = ?, alias = ?, calle_numero = ?, colonia = ?, ciudad = ?, codigo_postal = ?, referencias = ?
             WHERE id_direccion = ?'
        );
        $consulta->execute($valores);
        responder(200, ['ok' => true]);

    case 'eliminar':
        requiereRol('administrador');
        $id = idValido(leerDatos());

        $consulta = $pdo->prepare('SELECT COUNT(*) AS total FROM Pedidos WHERE id_direccion = ?');
        $consulta->execute([$id]);
        if ($consulta->fetch()['total'] > 0) {
            responder(409, ['error' => 'No se puede eliminar: esta dirección se usó en pedidos.']);
        }

        $pdo->prepare('DELETE FROM Direcciones WHERE id_direccion = ?')->execute([$id]);
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
