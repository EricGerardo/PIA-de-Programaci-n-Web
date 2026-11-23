<?php
// =====================================================================
// Un ramo más | Proveedores
//   proveedores.php?accion=listar    (GET, empleado/admin) -> incluye sus suministros
//   proveedores.php?accion=crear     (POST, admin)
//   proveedores.php?accion=editar    (POST, admin)
//   proveedores.php?accion=eliminar  (POST, admin)
// =====================================================================
require __DIR__ . '/conexion.php';

// Valida los campos del formulario de proveedor.
function datosProveedor(array $d): array
{
    $correo = texto($d, 'correo', 'Correo', false, 150);
    if ($correo !== null && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        responder(400, ['error' => 'El correo no es válido.']);
    }
    return [
        texto($d, 'nombre', 'Nombre', true, 100),
        texto($d, 'suministra', 'Suministra', true, 100),
        texto($d, 'telefono', 'Teléfono', false, 20),
        $correo,
    ];
}

switch (accion()) {

    case 'listar':
        requiereRol('empleado', 'administrador');
        $proveedores = $pdo->query('SELECT * FROM Proveedores ORDER BY id_proveedor')->fetchAll();

        // Suministros de cada proveedor (tabla intermedia Proveedor_Ramo)
        $suministros = $pdo->query(
            'SELECT pr.id_proveedor, r.nombre AS ramo, pr.cantidad, pr.costo, pr.fecha_suministro
             FROM Proveedor_Ramo pr
             JOIN Ramos r ON r.id_ramo = pr.id_ramo
             ORDER BY pr.fecha_suministro DESC'
        )->fetchAll();
        foreach ($proveedores as &$proveedor) {
            $proveedor['suministros'] = array_values(array_filter(
                $suministros,
                fn($s) => $s['id_proveedor'] === $proveedor['id_proveedor']
            ));
        }
        responder(200, ['proveedores' => $proveedores]);

    case 'crear':
        requiereRol('administrador');
        $consulta = $pdo->prepare('INSERT INTO Proveedores (nombre, suministra, telefono, correo) VALUES (?, ?, ?, ?)');
        $consulta->execute(datosProveedor(leerDatos()));
        responder(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

    case 'editar':
        requiereRol('administrador');
        $d = leerDatos();
        $valores = datosProveedor($d);
        $valores[] = idValido($d);
        $consulta = $pdo->prepare(
            'UPDATE Proveedores SET nombre = ?, suministra = ?, telefono = ?, correo = ? WHERE id_proveedor = ?'
        );
        $consulta->execute($valores);
        responder(200, ['ok' => true]);

    case 'eliminar':
        requiereRol('administrador');
        $id = idValido(leerDatos());

        $consulta = $pdo->prepare('SELECT COUNT(*) AS total FROM Proveedor_Ramo WHERE id_proveedor = ?');
        $consulta->execute([$id]);
        if ($consulta->fetch()['total'] > 0) {
            responder(409, ['error' => 'No se puede eliminar: este proveedor tiene suministros registrados.']);
        }

        $pdo->prepare('DELETE FROM Proveedores WHERE id_proveedor = ?')->execute([$id]);
        responder(200, ['ok' => true]);

    default:
        responder(404, ['error' => 'Acción no válida.']);
}
