<?php
// =====================================================================
// Un ramo más | Pedidos
//   pedidos.php?accion=listar    (GET, empleado/admin)
//   pedidos.php?accion=crear     (POST) -> { id_direccion, items: [{ id_ramo, cantidad }], fecha_entrega? }
//   pedidos.php?accion=editar    (POST, admin) -> { id, estado, fecha_entrega }
//   pedidos.php?accion=eliminar  (POST, admin) -> { id }
// =====================================================================
require __DIR__ . '/conexion.php';

const ESTADOS = ['pendiente', 'en_preparacion', 'en_camino', 'entregado'];

// Valida una fecha AAAA-MM-DD (o vacía).
function fechaOpcional(array $d, string $campo): ?string
{
    $fecha = trim((string)($d[$campo] ?? ''));
    if ($fecha === '') {
        return null;
    }
    $f = DateTime::createFromFormat('Y-m-d', $fecha);
    if (!$f || $f->format('Y-m-d') !== $fecha) {
        responder(400, ['error' => 'La fecha de entrega no es válida.']);
    }
    return $fecha;
}

switch (accion()) {

    case 'listar':
        requiereRol('empleado', 'administrador');
        $pedidos = $pdo->query(
            "SELECT p.*, u.nombre AS cliente,
                    CONCAT(d.alias, ' · ', d.calle_numero, ', ', d.colonia, ', ', d.ciudad) AS direccion,
                    GROUP_CONCAT(CONCAT(r.nombre, ' ×', dp.cantidad) ORDER BY r.nombre SEPARATOR ', ') AS ramos
             FROM Pedidos p
             JOIN Usuarios u       ON u.id_usuario = p.id_usuario
             JOIN Direcciones d    ON d.id_direccion = p.id_direccion
             LEFT JOIN Detalle_Pedido dp ON dp.id_pedido = p.id_pedido
             LEFT JOIN Ramos r     ON r.id_ramo = dp.id_ramo
             GROUP BY p.id_pedido
             ORDER BY p.id_pedido DESC"
        )->fetchAll();
        responder(200, ['pedidos' => $pedidos]);

    case 'crear':
        $usuario = requiereRol();
        $d = leerDatos();
        $idDireccion = idValido($d, 'id_direccion');
        $fechaEntrega = $usuario['rol'] === 'administrador' ? fechaOpcional($d, 'fecha_entrega') : null;

        // El pedido es de quien es dueño de la dirección. Un cliente o empleado
        // solo puede usar sus propias direcciones; el admin puede usar cualquiera
        // (así registra pedidos hechos por teléfono, por ejemplo).
        $consulta = $pdo->prepare('SELECT id_usuario FROM Direcciones WHERE id_direccion = ?');
        $consulta->execute([$idDireccion]);
        $direccion = $consulta->fetch();
        if (!$direccion || ($usuario['rol'] !== 'administrador' && $direccion['id_usuario'] !== $usuario['id'])) {
            responder(400, ['error' => 'Selecciona una dirección de entrega válida.']);
        }

        // Junta las cantidades por ramo (por si un ramo viene repetido).
        $items = [];
        foreach ($d['items'] ?? [] as $item) {
            $idRamo = filter_var($item['id_ramo'] ?? null, FILTER_VALIDATE_INT);
            $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
            if (!$idRamo || !$cantidad || $cantidad < 1) {
                responder(400, ['error' => 'Hay un ramo o una cantidad no válida en el pedido.']);
            }
            $items[$idRamo] = ($items[$idRamo] ?? 0) + $cantidad;
        }
        if (!$items) {
            responder(400, ['error' => 'El pedido no tiene ramos.']);
        }

        // Transacción: o se guarda todo (pedido, detalle y existencias) o nada.
        $pdo->beginTransaction();
        $total = 0;
        $precios = [];
        $buscarRamo = $pdo->prepare('SELECT nombre, precio, existencias FROM Ramos WHERE id_ramo = ? FOR UPDATE');
        foreach ($items as $idRamo => $cantidad) {
            $buscarRamo->execute([$idRamo]);
            $ramo = $buscarRamo->fetch();
            if (!$ramo) {
                $pdo->rollBack();
                responder(400, ['error' => 'Uno de los ramos ya no existe. Revisa tu carrito.']);
            }
            if ($ramo['existencias'] < $cantidad) {
                $pdo->rollBack();
                responder(409, ['error' => "No hay suficientes existencias de «{$ramo['nombre']}» (quedan {$ramo['existencias']})."]);
            }
            // El precio se toma de la base de datos, no del navegador.
            $precios[$idRamo] = $ramo['precio'];
            $total += $ramo['precio'] * $cantidad;
        }

        $consulta = $pdo->prepare(
            'INSERT INTO Pedidos (id_usuario, id_direccion, fecha_entrega, total) VALUES (?, ?, ?, ?)'
        );
        $consulta->execute([$direccion['id_usuario'], $idDireccion, $fechaEntrega, $total]);
        $idPedido = (int)$pdo->lastInsertId();

        $detalle = $pdo->prepare(
            'INSERT INTO Detalle_Pedido (id_pedido, id_ramo, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
        );
        $descontar = $pdo->prepare('UPDATE Ramos SET existencias = existencias - ? WHERE id_ramo = ?');
        foreach ($items as $idRamo => $cantidad) {
            $detalle->execute([$idPedido, $idRamo, $cantidad, $precios[$idRamo]]);
            $descontar->execute([$cantidad, $idRamo]);
        }
        $pdo->commit();

        responder(201, ['ok' => true, 'id' => $idPedido, 'total' => $total]);

    case 'editar':
        requiereRol('administrador');
        $d = leerDatos();
        $id = idValido($d);
        $estado = $d['estado'] ?? '';
        if (!in_array($estado, ESTADOS, true)) {
            responder(400, ['error' => 'Estado no válido.']);
        }
        $consulta = $pdo->prepare('UPDATE Pedidos SET estado = ?, fecha_entrega = ? WHERE id_pedido = ?');
        $consulta->execute([$estado, fechaOpcional($d, 'fecha_entrega'), $id]);
        responder(200, ['ok' => true]);

    case 'eliminar':
        requiereRol('administrador');
        $id = idValido(leerDatos());

        $pdo->beginTransaction();
        $consulta = $pdo->prepare('SELECT estado FROM Pedidos WHERE id_pedido = ? FOR UPDATE');
        $consulta->execute([$id]);
        $pedido = $consulta->fetch();
        if (!$pedido) {
            $pdo->rollBack();
            responder(404, ['error' => 'El pedido no existe.']);
        }
        // Si el pedido no se entregó, los ramos regresan al inventario.
        if ($pedido['estado'] !== 'entregado') {
            $pdo->prepare(
                'UPDATE Ramos r JOIN Detalle_Pedido dp ON dp.id_ramo = r.id_ramo
                 SET r.existencias = r.existencias + dp.cantidad
                 WHERE dp.id_pedido = ?'
            )->execute([$id]);
        }
        // El detalle se borra solo (ON DELETE CASCADE en Detalle_Pedido).
        $pdo->prepare('DELETE FROM Pedidos WHERE id_pedido = ?')->execute([$id]);
        $pdo->commit();
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
