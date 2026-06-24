<?php
/**
 * clientes.php — Listado de clientes con bucles y condicionales PHP
 * 
 * Esta página demuestra:
 *   - Bucles: while, foreach, for
 *   - Condicionales: if/elseif/else, operador ternario, switch
 *   - Mezcla de PHP con HTML y CSS
 *   - Consultas SQL con PDO
 */

require_once 'config.php';

// ─── CONSULTAR CLIENTES ACTIVOS ──────────────────────────────────
$sqlClientes = "SELECT c.id_cliente, c.nombre, c.apellido_p, c.apellido_m, c.edad, c.fecha_registro
                FROM clientes c
                WHERE c.estado = 'activo'
                ORDER BY c.id_cliente DESC";
$stmtClientes = $pdo->query($sqlClientes);
$clientes = $stmtClientes->fetchAll();

// ─── CONSULTAR INSCRIPCIONES CON MEMBRESÍAS ──────────────────────
$sqlInscripciones = "SELECT i.id_cliente, i.fecha_fin, m.tipo AS membresia_tipo
                     FROM inscripciones i
                     JOIN membresias m ON i.id_membresia = m.id_membresia
                     WHERE i.estado = 'activo'";
$stmtInsc = $pdo->query($sqlInscripciones);
$inscripciones = [];

// Bucle while para construir un arreglo asociativo indexado por id_cliente
while ($fila = $stmtInsc->fetch()) {
    $inscripciones[$fila['id_cliente']] = $fila;
}

// ─── ESTADÍSTICAS CON BUCLE FOR ─────────────────────────────────
$totalClientes = count($clientes);
$totalActivos  = 0;
$totalVencidos = 0;
$hoy = new DateTime();

// Bucle foreach para contar estados
foreach ($clientes as $cliente) {
    $idCl = $cliente['id_cliente'];
    if (isset($inscripciones[$idCl])) {
        $fechaFin = new DateTime($inscripciones[$idCl]['fecha_fin']);
        if ($fechaFin >= $hoy) {
            $totalActivos++;
        } else {
            $totalVencidos++;
        }
    }
}

// ─── FUNCIÓN PHP PARA DETERMINAR ESTADO ──────────────────────────
function obtenerEstado($idCliente, $inscripciones) {
    if (!isset($inscripciones[$idCliente])) {
        return ['texto' => 'Sin membresía', 'clase' => 'estado-sin', 'color' => '#6c757d'];
    }
    
    $fechaFin = new DateTime($inscripciones[$idCliente]['fecha_fin']);
    $hoy      = new DateTime();
    $diff     = $hoy->diff($fechaFin);
    $diasRest = (int) $diff->format('%R%a');

    // Condicional if/elseif/else
    if ($diasRest < 0) {
        return ['texto' => 'Vencida', 'clase' => 'estado-vencido', 'color' => '#e74c3c'];
    } elseif ($diasRest <= 5) {
        return ['texto' => 'Por vencer (' . $diasRest . ' días)', 'clase' => 'estado-advertencia', 'color' => '#f39c12'];
    } else {
        return ['texto' => 'Activa (' . $diasRest . ' días)', 'clase' => 'estado-activo', 'color' => '#00b894'];
    }
}

// ─── CATEGORÍA DE EDAD CON SWITCH ────────────────────────────────
function categoriaEdad($edad) {
    switch (true) {
        case ($edad < 18):
            return 'Menor de edad';
        case ($edad <= 30):
            return 'Joven';
        case ($edad <= 50):
            return 'Adulto';
        default:
            return 'Adulto Mayor';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clientes — DAO'S GYM</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0f1117; color: #e0e0e0; padding: 20px; }
        
        .header { text-align: center; padding: 30px 0; }
        .header h1 { color: #C5A55A; font-size: 2rem; margin-bottom: 8px; }
        .header p { color: #8b8fa3; }
        .header a { color: #C5A55A; text-decoration: none; }
        .header a:hover { text-decoration: underline; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 900px; margin: 20px auto; }
        .stat-card { background: #1a1d27; border: 1px solid #2a2e3b; border-radius: 12px; padding: 20px; text-align: center; }
        .stat-card h3 { color: #8b8fa3; font-size: 0.85rem; margin-bottom: 8px; }
        .stat-card .value { font-size: 2rem; font-weight: 700; color: #C5A55A; }

        .table-container { max-width: 1100px; margin: 30px auto; background: #1a1d27; border-radius: 12px; border: 1px solid #2a2e3b; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #22263a; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #2a2e3b; font-size: 0.9rem; }
        th { color: #C5A55A; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
        tr:hover { background: #22263a; }

        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .estado-activo { background: rgba(0,184,148,0.15); color: #00b894; }
        .estado-vencido { background: rgba(231,76,60,0.15); color: #e74c3c; }
        .estado-advertencia { background: rgba(243,156,18,0.15); color: #f39c12; }
        .estado-sin { background: rgba(108,117,125,0.15); color: #6c757d; }

        .empty { text-align: center; padding: 40px; color: #8b8fa3; }
        .cat-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; background: rgba(108,92,231,0.15); color: #6c5ce7; }
    </style>
</head>
<body>

    <div class="header">
        <h1>📋 Clientes Registrados</h1>
        <p>Listado generado dinámicamente con PHP — <?php echo date('d/m/Y H:i'); ?></p>
        <p style="margin-top: 10px;"><a href="../index.html">← Volver a la página principal</a></p>
    </div>

    <!-- ESTADÍSTICAS CALCULADAS CON PHP -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Clientes</h3>
            <div class="value"><?php echo $totalClientes; ?></div>
        </div>
        <div class="stat-card">
            <h3>Membresías Activas</h3>
            <div class="value" style="color: #00b894;"><?php echo $totalActivos; ?></div>
        </div>
        <div class="stat-card">
            <h3>Membresías Vencidas</h3>
            <div class="value" style="color: #e74c3c;"><?php echo $totalVencidos; ?></div>
        </div>
    </div>

    <!-- TABLA GENERADA CON BUCLE PHP -->
    <div class="table-container">
        <?php if ($totalClientes === 0): ?>
            <div class="empty">No hay clientes registrados aún.</div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Edad</th>
                        <th>Categoría</th>
                        <th>Estado Membresía</th>
                        <th>Tipo</th>
                        <th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    // ─── BUCLE FOREACH PARA GENERAR FILAS ─────────────
                    foreach ($clientes as $index => $cliente):
                        $estado = obtenerEstado($cliente['id_cliente'], $inscripciones);
                        $categoria = categoriaEdad($cliente['edad']);
                        
                        // Operador ternario para alternar color de fila
                        $bgFila = ($index % 2 === 0) ? '' : 'style="background: rgba(255,255,255,0.02);"';
                        
                        // Obtener tipo de membresía si existe
                        $tipoMembresia = isset($inscripciones[$cliente['id_cliente']]) 
                            ? $inscripciones[$cliente['id_cliente']]['membresia_tipo'] 
                            : '—';
                        
                        // Formatear fecha
                        $fechaReg = $cliente['fecha_registro'] 
                            ? date('d/m/Y', strtotime($cliente['fecha_registro'])) 
                            : '—';
                    ?>
                    <tr <?php echo $bgFila; ?>>
                        <td><?php echo $cliente['id_cliente']; ?></td>
                        <td><strong><?php echo htmlspecialchars($cliente['nombre'] . ' ' . $cliente['apellido_p'] . ' ' . $cliente['apellido_m']); ?></strong></td>
                        <td><?php echo $cliente['edad']; ?> años</td>
                        <td><span class="cat-badge"><?php echo $categoria; ?></span></td>
                        <td><span class="badge <?php echo $estado['clase']; ?>"><?php echo $estado['texto']; ?></span></td>
                        <td><?php echo htmlspecialchars($tipoMembresia); ?></td>
                        <td><?php echo $fechaReg; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <div class="header" style="padding-top: 10px;">
        <p style="color: #8b8fa3; font-size: 0.8rem;">
            Página generada con PHP <?php echo phpversion(); ?> | 
            Estructuras usadas: if/elseif/else, switch, foreach, while, operador ternario, funciones
        </p>
    </div>

</body>
</html>
