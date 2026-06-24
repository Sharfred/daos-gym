<?php
/**
 * registro.php — Procesamiento del formulario público de registro
 * 
 * Recibe datos por POST desde el formulario "Únete a la familia" en index.html.
 * Demuestra: variables PHP, condicionales (if/else), validación, consultas preparadas PDO.
 */

// Incluir la configuración de la base de datos
require_once 'config.php';

// ─── VARIABLES Y CONSTANTES ─────────────────────────────────────
$mensaje   = '';
$tipo      = 'error';   // 'exito' o 'error'
$errores   = [];

// ─── VALIDACIÓN CON CONDICIONALES PHP ────────────────────────────
// Verificar que la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Recoger y sanitizar datos del formulario
    $nombre     = isset($_POST['nombre'])     ? trim(htmlspecialchars($_POST['nombre']))     : '';
    $apellido_p = isset($_POST['apellido_p']) ? trim(htmlspecialchars($_POST['apellido_p'])) : '';
    $apellido_m = isset($_POST['apellido_m']) ? trim(htmlspecialchars($_POST['apellido_m'])) : '';
    $edad       = isset($_POST['edad'])       ? trim($_POST['edad'])                         : '';

    // Validar cada campo con condicionales if/else
    if (empty($nombre)) {
        $errores[] = 'El nombre es requerido';
    } elseif (strlen($nombre) > 30) {
        $errores[] = 'El nombre no puede exceder 30 caracteres';
    }

    if (empty($apellido_p)) {
        $errores[] = 'El apellido paterno es requerido';
    } elseif (strlen($apellido_p) > 30) {
        $errores[] = 'El apellido paterno no puede exceder 30 caracteres';
    }

    if (empty($apellido_m)) {
        $errores[] = 'El apellido materno es requerido';
    } elseif (strlen($apellido_m) > 30) {
        $errores[] = 'El apellido materno no puede exceder 30 caracteres';
    }

    if (empty($edad)) {
        $errores[] = 'La edad es requerida';
    } else {
        $edadNum = intval($edad);
        if ($edadNum < 1 || $edadNum > 120) {
            $errores[] = 'La edad debe ser un número entre 1 y 120';
        }
    }

    // ─── INSERCIÓN EN BASE DE DATOS ──────────────────────────────
    if (count($errores) === 0) {
        try {
            $sql = "INSERT INTO clientes (nombre, apellido_p, apellido_m, edad) VALUES (:nombre, :apellido_p, :apellido_m, :edad)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nombre'     => $nombre,
                ':apellido_p' => $apellido_p,
                ':apellido_m' => $apellido_m,
                ':edad'       => intval($edad)
            ]);

            $mensaje = '¡Registro exitoso! Bienvenido(a) a DAO\'S GYM, ' . $nombre . '.';
            $tipo    = 'exito';
        } catch (PDOException $e) {
            $mensaje = 'Error al registrar: ' . $e->getMessage();
            $tipo    = 'error';
        }
    } else {
        // Si hay errores de validación, unirlos en un mensaje
        $mensaje = implode(' | ', $errores);
        $tipo    = 'error';
    }

} else {
    // Si alguien accede directamente sin enviar el formulario
    $mensaje = 'Acceso no permitido. Usa el formulario de registro.';
    $tipo    = 'error';
}

// ─── REDIRECCIÓN DE VUELTA A INDEX.HTML ──────────────────────────
// Codificamos el mensaje para pasarlo por URL
$mensajeCodificado = urlencode($mensaje);
$tipoCodificado    = urlencode($tipo);

header("Location: ../index.html?msg=$mensajeCodificado&tipo=$tipoCodificado#registro-publico");
exit();
?>
