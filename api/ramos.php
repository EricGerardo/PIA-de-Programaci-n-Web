<?php
// =====================================================================
// Un ramo más | Ramos (inventario y diseños)
//   ramos.php?accion=listar            (GET)  -> todos los ramos
//   ramos.php?accion=listar&destacados=1 (GET) -> solo los destacados (home)
//   ramos.php?accion=crear             (POST, admin)
//   ramos.php?accion=editar            (POST, admin)
//   ramos.php?accion=destacado         (POST, admin) -> { id, destacado }
//   ramos.php?accion=eliminar          (POST, admin) -> { id }
// =====================================================================
require __DIR__ . '/conexion.php';

// Valida los campos del formulario de ramo.
function datosRamo(array $d): array
{
    return [
        texto($d, 'nombre', 'Nombre', true, 100),
        texto($d, 'descripcion', 'Descripción', false, 255),
        numero($d, 'precio', 'Precio'),
        (int)numero($d, 'existencias', 'Existencias'),
        texto($d, 'imagen', 'Imagen', false, 255),
        !empty($d['destacado']) ? 1 : 0,
    ];
}

switch (accion()) {

    case 'listar':
        requiereRol(); // cualquier usuario con sesión
        $sql = 'SELECT * FROM Ramos';
        if (!empty($_GET['destacados'])) {
            $sql .= ' WHERE destacado = TRUE';
        }
        $ramos = $pdo->query($sql . ' ORDER BY id_ramo')->fetchAll();
        responder(200, ['ramos' => $ramos]);

    case 'crear':
        requiereRol('administrador');
        $consulta = $pdo->prepare(
            'INSERT INTO Ramos (nombre, descripcion, precio, existencias, imagen, destacado) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $consulta->execute(datosRamo(leerDatos()));
        responder(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

    case 'editar':
        requiereRol('administrador');
        $datos = leerDatos();
        $valores = datosRamo($datos);
        $valores[] = idValido($datos);
        $consulta = $pdo->prepare(
            'UPDATE Ramos SET nombre = ?, descripcion = ?, precio = ?, existencias = ?, imagen = ?, destacado = ?
             WHERE id_ramo = ?'
        );
        $consulta->execute($valores);
        responder(200, ['ok' => true]);

    case 'destacado':
        requiereRol('administrador');
        $datos = leerDatos();
        $consulta = $pdo->prepare('UPDATE Ramos SET destacado = ? WHERE id_ramo = ?');
        $consulta->execute([!empty($datos['destacado']) ? 1 : 0, idValido($datos)]);
        responder(200, ['ok' => true]);

    case 'eliminar':
        requiereRol('administrador');
        $id = idValido(leerDatos());

        // No se borra un ramo que ya aparece en pedidos o suministros,
        // porque se perdería el historial.
        $consulta = $pdo->prepare(
            'SELECT (SELECT COUNT(*) FROM Detalle_Pedido WHERE id_ramo = ?) +
                    (SELECT COUNT(*) FROM Proveedor_Ramo WHERE id_ramo = ?) AS usos'
        );
        $consulta->execute([$id, $id]);
        if ($consulta->fetch()['usos'] > 0) {
            responder(409, ['error' => 'No se puede eliminar: este ramo ya aparece en pedidos o suministros. Puedes dejarlo con 0 existencias.']);
        }

        $pdo->prepare('DELETE FROM Ramos WHERE id_ramo = ?')->execute([$id]);
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
