-- =====================================================================
-- Un ramo más | Proyecto final, Fase 2: Base de datos (MySQL 8 / MariaDB 10.5+)
-- Ejecutar completo: crea la base, las tablas, los datos de ejemplo y
-- al final trae consultas de verificación para los pantallazos.
-- =====================================================================
DROP DATABASE IF EXISTS un_ramo_mas;
CREATE DATABASE un_ramo_mas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE un_ramo_mas;

-- ---------- Tablas ----------
CREATE TABLE Usuarios (
    id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    correo           VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(255) NOT NULL,
    telefono         VARCHAR(20),
    -- El administrador cambia este campo desde el CRM (Clientes / Empleados)
    rol              ENUM('cliente','empleado','administrador') NOT NULL DEFAULT 'cliente',
    fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Direcciones (
    id_direccion   INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario     INT NOT NULL,
    alias          VARCHAR(50) NOT NULL,
    calle_numero   VARCHAR(120) NOT NULL,
    colonia        VARCHAR(80) NOT NULL,
    ciudad         VARCHAR(80) NOT NULL,
    codigo_postal  CHAR(5) NOT NULL,
    referencias    VARCHAR(200),
    CONSTRAINT fk_direcciones_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE Ramos (
    id_ramo      INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  VARCHAR(255),
    precio       DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    existencias  INT NOT NULL DEFAULT 0 CHECK (existencias >= 0),
    imagen       VARCHAR(255),
    destacado    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE Proveedores (
    id_proveedor  INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    suministra    VARCHAR(100) NOT NULL,
    telefono      VARCHAR(20),
    correo        VARCHAR(150)
);

CREATE TABLE Proveedor_Ramo (
    id_suministro     INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor      INT NOT NULL,
    id_ramo           INT NOT NULL,
    costo             DECIMAL(10,2) NOT NULL CHECK (costo >= 0),
    cantidad          INT NOT NULL CHECK (cantidad > 0),
    fecha_suministro  DATE NOT NULL,
    CONSTRAINT fk_pr_proveedor FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor),
    CONSTRAINT fk_pr_ramo      FOREIGN KEY (id_ramo)      REFERENCES Ramos(id_ramo)
);

CREATE TABLE Pedidos (
    id_pedido      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario     INT NOT NULL,
    id_direccion   INT NOT NULL,
    fecha_pedido   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega  DATE,
    estado         ENUM('pendiente','en_preparacion','en_camino','entregado') NOT NULL DEFAULT 'pendiente',
    total          DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    CONSTRAINT fk_pedidos_usuario   FOREIGN KEY (id_usuario)   REFERENCES Usuarios(id_usuario),
    CONSTRAINT fk_pedidos_direccion FOREIGN KEY (id_direccion) REFERENCES Direcciones(id_direccion)
);

CREATE TABLE Detalle_Pedido (
    id_pedido        INT NOT NULL,
    id_ramo          INT NOT NULL,
    cantidad         INT NOT NULL CHECK (cantidad > 0),
    precio_unitario  DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (id_pedido, id_ramo),
    CONSTRAINT fk_dp_pedido FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_dp_ramo   FOREIGN KEY (id_ramo)   REFERENCES Ramos(id_ramo)
);

-- ---------- Datos de ejemplo ----------
-- (los hashes son de relleno; el back-end guardará el hash real de cada contraseña)
INSERT INTO Usuarios (nombre, correo, contrasena_hash, telefono, rol, fecha_registro) VALUES
 ('Admin',        'admin@unramomas.com',    'HASH_EJEMPLO', '8110000001','administrador', '2026-08-01 09:00:00'),
 ('Laura Méndez', 'laura@unramomas.com',    'HASH_EJEMPLO', '8110000002','empleado',      '2026-08-12 10:00:00'),
 ('Jorge Salas',  'jorge@unramomas.com',    'HASH_EJEMPLO', '8110000003','empleado',      '2026-09-02 11:00:00'),
 ('María López',  'maria@correo.com',       'HASH_EJEMPLO', '8110000004','cliente',       '2026-09-10 12:00:00'),
 ('Carlos Ruiz',  'carlos@correo.com',      'HASH_EJEMPLO', '8110000005','cliente',       '2026-09-15 13:00:00'),
 ('Ana Torres',   'ana@correo.com',         'HASH_EJEMPLO', '8110000006','cliente',       '2026-09-20 14:00:00');

INSERT INTO Direcciones (id_usuario, alias, calle_numero, colonia, ciudad, codigo_postal, referencias) VALUES
 (4,'Casa',    'Av. Reforma 120',  'Centro',   'Monterrey',       '64000', 'Portón negro'),
 (4,'Trabajo', 'Calle Pino 45',    'Del Valle','San Pedro',       '66220', NULL),
 (5,'Casa',    'Calle Pino 45',    'Del Valle','San Pedro',       '66220', NULL),
 (6,'Casa',    'Priv. Sauce 8',    'Roma',     'Monterrey',       '64700', 'Timbre 2');

INSERT INTO Ramos (nombre, descripcion, precio, existencias, imagen, destacado) VALUES
 ('Rosas Clásicas',        'Docena de rosas rojas',        450, 12, 'rosas-clasicas.jpg',  TRUE),
 ('Tulipanes Primavera',   'Tulipanes de colores',         380,  8, 'tulipanes.jpg',       TRUE),
 ('Girasoles Alegría',     'Girasoles con follaje',        320, 15, 'girasoles.jpg',       TRUE),
 ('Ramo Mixto Aurora',     'Flores mixtas de temporada',   520,  5, 'mixto-aurora.jpg',    TRUE),
 ('Cerezo Rosa',           'Ramas de cerezo y rosas',      410,  9, 'cerezo-rosa.jpg',     FALSE),
 ('Hibisco Tropical',      'Hibiscos y hojas tropicales',  350,  6, 'hibisco.jpg',         FALSE),
 ('Margaritas Campo',      'Margaritas frescas',           280, 20, 'margaritas.jpg',      FALSE),
 ('Rosas Blancas Nupcial', 'Rosas blancas para boda',      690,  4, 'rosas-blancas.jpg',   FALSE);

INSERT INTO Proveedores (nombre, suministra, telefono, correo) VALUES
 ('Flores del Valle', 'Rosas y tulipanes', '8120000001', 'ventas@floresdelvalle.mx'),
 ('Campo Verde',      'Girasoles',         '8120000002', 'contacto@campoverde.mx'),
 ('Empaques Luna',    'Papel y listones',  '8120000003', 'pedidos@empaquesluna.mx');

INSERT INTO Proveedor_Ramo (id_proveedor, id_ramo, costo, cantidad, fecha_suministro) VALUES
 (1,1,210,30,'2026-10-05'),(1,2,180,20,'2026-10-05'),(2,3,150,25,'2026-10-03'),(1,8,320,10,'2026-09-28');

INSERT INTO Pedidos (id_pedido, id_usuario, id_direccion, fecha_pedido, fecha_entrega, estado, total) VALUES
 (1022, 6, 4, '2026-10-07 10:30:00', '2026-10-09', 'entregado',      320),
 (1023, 5, 3, '2026-10-08 12:15:00', '2026-10-10', 'en_preparacion', 520),
 (1024, 4, 1, '2026-10-09 09:40:00', '2026-10-10', 'pendiente',      450);

INSERT INTO Detalle_Pedido (id_pedido, id_ramo, cantidad, precio_unitario) VALUES
 (1022,3,1,320),(1023,4,1,520),(1024,1,1,450);

-- ---------- Consultas de verificación (para los pantallazos) ----------
SHOW TABLES;
SELECT p.id_pedido, u.nombre AS cliente, r.nombre AS ramo, dp.cantidad, dp.precio_unitario, p.estado, d.calle_numero, d.colonia
FROM Pedidos p
JOIN Usuarios u       ON u.id_usuario = p.id_usuario
JOIN Direcciones d    ON d.id_direccion = p.id_direccion
JOIN Detalle_Pedido dp ON dp.id_pedido = p.id_pedido
JOIN Ramos r          ON r.id_ramo = dp.id_ramo;
SELECT nombre, precio, existencias FROM Ramos WHERE destacado = TRUE;
-- El CRM nunca lista al administrador:
SELECT nombre, correo, rol FROM Usuarios WHERE rol <> 'administrador';

-- ---------- Gestión de roles (lo que hace el CRM del administrador) ----------
-- Convertir un cliente en empleado (id 4 = María López):
--   UPDATE Usuarios SET rol = 'empleado' WHERE id_usuario = 4 AND rol <> 'administrador';
-- Regresar un empleado a cliente:
--   UPDATE Usuarios SET rol = 'cliente' WHERE id_usuario = 4 AND rol <> 'administrador';
-- Crear un empleado nuevo desde cero (inicia sesión con su correo y contraseña):
--   INSERT INTO Usuarios (nombre, correo, contrasena_hash, telefono, rol)
--   VALUES ('Nombre Apellido', 'correo@unramomas.com', '<hash real>', '8110000000', 'empleado');
