<?php
/**
 * config.php — Conexión PDO a MySQL para DAO'S GYM
 * 
 * Este archivo centraliza la configuración de la base de datos.
 * Se usa PDO (PHP Data Objects) para mayor seguridad con consultas preparadas.
 */

// ─── CONFIGURACIÓN DE BASE DE DATOS ─────────────────────────────
$host     = 'localhost';
$dbname   = 'daos_gym';
$usuario  = 'root';
$password = '';
$charset  = 'utf8mb4';

// ─── CONEXIÓN PDO ────────────────────────────────────────────────
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$opciones = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Lanzar excepciones en errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Resultados como arreglo asociativo
    PDO::ATTR_EMULATE_PREPARES   => false,                    // Consultas preparadas nativas
];

try {
    $pdo = new PDO($dsn, $usuario, $password, $opciones);
} catch (PDOException $e) {
    // Si hay error de conexión, mostrar mensaje amigable
    die("Error de conexión a la base de datos: " . $e->getMessage());
}
?>
