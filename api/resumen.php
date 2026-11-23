<?php
// =====================================================================
// Un ramo más | Resumen del panel de administración
//   resumen.php  (GET, empleado/admin) -> totales y últimos pedidos
// =====================================================================
require __DIR__ . '/conexion.php';

requiereRol('empleado', 'administrador');

$totales = $pdo->query(
    "SELECT
        (SELECT COUNT(*) FROM Pedidos WHERE estado = 'pendiente')   AS pedidos_pendientes,
        (SELECT COALESCE(SUM(existencias), 0) FROM Ramos)           AS ramos_inventario,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'cliente')       AS clientes,
        (SELECT COUNT(*) FROM Proveedores)                          AS proveedores,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'empleado')      AS empleados"
)->fetch();

$ultimos = $pdo->query(
    'SELECT p.id_pedido, u.nombre AS cliente, p.estado
     FROM Pedidos p
     JOIN Usuarios u ON u.id_usuario = p.id_usuario
     ORDER BY p.fecha_pedido DESC, p.id_pedido DESC
     LIMIT 5'
)->fetchAll();

responder(200, ['totales' => $totales, 'ultimos' => $ultimos]);
