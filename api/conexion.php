<?php
// =====================================================================
// Un ramo más | Conexión a la base de datos y funciones compartidas
// Todos los archivos de la carpeta api/ incluyen este archivo.
// =====================================================================

// Datos de conexión (XAMPP usa el usuario root sin contraseña)
const DB_HOST = 'localhost';
const DB_NOMBRE = 'un_ramo_mas';
const DB_USUARIO = 'root';
const DB_CLAVE = '';

// Todas las respuestas de la API son JSON
header('Content-Type: application/json; charset=utf-8');

// Sesión de PHP: guarda quién inició sesión.
// httponly: JavaScript no puede leer la cookie de sesión.
// samesite Lax: otra página web no puede usar la sesión del usuario.
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();

// Si ocurre un error inesperado (por ejemplo, de MySQL), se guarda en el
// log de PHP y al usuario solo se le muestra un mensaje general.
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    responder(500, ['error' => 'Ocurrió un error en el servidor. Intenta de nuevo.']);
});

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NOMBRE . ';charset=utf8mb4',
        DB_USUARIO,
        DB_CLAVE,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,       // los errores lanzan excepción
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,  // filas como arreglos asociativos
            PDO::ATTR_EMULATE_PREPARES => false,               // consultas preparadas reales
        ]
    );
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ['error' => 'No se pudo conectar a la base de datos. ¿Está encendido MySQL en XAMPP?']);
}

// Envía una respuesta JSON con su código HTTP y termina el script.
function responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Lee la acción pedida en la URL, por ejemplo: ramos.php?accion=listar
function accion(): string
{
    return $_GET['accion'] ?? '';
}

// Lee los datos que manda JavaScript en el cuerpo de la petición (JSON).
// Solo acepta POST con Content-Type application/json: un formulario de
// otra página no puede mandar ese tipo de petición, así se evita que
// alguien haga cambios usando la sesión del usuario (ataque CSRF).
function leerDatos(): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responder(405, ['error' => 'Esta acción debe enviarse por POST.']);
    }
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
        responder(415, ['error' => 'Los datos deben enviarse en formato JSON.']);
    }
    $datos = json_decode(file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}

// Devuelve el usuario con sesión iniciada, o null si no hay sesión.
// El rol se vuelve a leer de la base de datos en cada petición: si el
// administrador cambia el rol de alguien, el cambio aplica de inmediato.
function usuarioActual(): ?array
{
    global $pdo;
    if (empty($_SESSION['usuario']['id'])) {
        return null;
    }
    $consulta = $pdo->prepare('SELECT id_usuario AS id, nombre, correo, rol FROM Usuarios WHERE id_usuario = ?');
    $consulta->execute([$_SESSION['usuario']['id']]);
    $usuario = $consulta->fetch();
    if (!$usuario) {            // la cuenta fue eliminada
        $_SESSION = [];
        return null;
    }
    $usuario['id'] = (int)$usuario['id'];
    return $_SESSION['usuario'] = $usuario;
}

// Exige que haya sesión y, si se indican roles, que el usuario tenga uno.
// Ejemplo: requiereRol('administrador');  requiereRol('empleado', 'administrador');
function requiereRol(string ...$roles): array
{
    $usuario = usuarioActual();
    if (!$usuario) {
        responder(401, ['error' => 'Debes iniciar sesión.']);
    }
    if ($roles && !in_array($usuario['rol'], $roles, true)) {
        responder(403, ['error' => 'No tienes permiso para hacer esto.']);
    }
    return $usuario;
}

// Limpia un texto y valida que no venga vacío si es obligatorio.
function texto(array $datos, string $campo, string $etiqueta, bool $obligatorio = true, int $maximo = 255): ?string
{
    $valor = trim((string)($datos[$campo] ?? ''));
    if ($valor === '') {
        if ($obligatorio) {
            responder(400, ['error' => "El campo «$etiqueta» es obligatorio."]);
        }
        return null;
    }
    if (mb_strlen($valor) > $maximo) {
        responder(400, ['error' => "El campo «$etiqueta» admite máximo $maximo caracteres."]);
    }
    return $valor;
}

// Valida un número (entero o decimal) con un valor mínimo.
function numero(array $datos, string $campo, string $etiqueta, float $minimo = 0): float
{
    $valor = $datos[$campo] ?? '';
    if (!is_numeric($valor) || $valor < $minimo) {
        responder(400, ['error' => "El campo «$etiqueta» debe ser un número mayor o igual a $minimo."]);
    }
    return (float)$valor;
}

// Valida el id del registro que se quiere editar o eliminar.
function idValido(array $datos, string $campo = 'id'): int
{
    $id = filter_var($datos[$campo] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        responder(400, ['error' => 'Registro no válido.']);
    }
    return $id;
}
