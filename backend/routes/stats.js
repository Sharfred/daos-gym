const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');

router.get('/', async (req, res) => {
    try {
        // 1. Total de clientes
        const [clientesResult] = await pool.query('SELECT COUNT(*) as total FROM clientes');
        const totalClientes = clientesResult[0].total;

        // 2. Membresías Activas (donde fecha_fin >= hoy)
        const [activasResult] = await pool.query('SELECT COUNT(*) as total FROM inscripciones WHERE fecha_fin >= CURDATE()');
        const membresiasActivas = activasResult[0].total;

        // 3. Ingresos del Mes (pagos realizados en el mes actual)
        const [ingresosResult] = await pool.query('SELECT SUM(monto) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())');
        const ingresosMes = ingresosResult[0].total || 0;

        // 4. Últimos 5 pagos para una gráfica pequeña o tabla rápida (opcional)
        const [ultimosPagos] = await pool.query(`
            SELECT p.fecha_pago, p.monto, c.nombre 
            FROM pagos p 
            JOIN clientes c ON p.id_cliente = c.id_cliente 
            ORDER BY p.fecha_pago DESC 
            LIMIT 5
        `);

        res.json({
            totalClientes,
            membresiasActivas,
            ingresosMes,
            ultimosPagos
        });
    } catch (error) {
        console.error('Error stats:', error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
