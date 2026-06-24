const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');
const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
    mysql_id: Number,
    monto: Number,
    fecha_pago: Date,
    id_cliente: Number,
    estado: { type: String, default: 'activo' }
});
const Pago = mongoose.model('Pago', pagoSchema);

function validarPago({ monto, fecha_pago, id_cliente }) {
    const errores = [];
    if (monto === undefined || monto === null) errores.push('El monto es requerido');
    else if (isNaN(parseInt(monto)) || parseInt(monto) <= 0) errores.push('El monto debe ser mayor a 0');
    if (!fecha_pago) errores.push('La fecha de pago es requerida');
    if (!id_cliente) errores.push('El cliente es requerido');
    return errores;
}

const SELECT_QUERY = `
    SELECT p.id_pago, p.monto, p.fecha_pago, p.id_cliente,
           c.nombre as cliente_nombre, c.apellido_p as cliente_apellido
    FROM pagos p
    JOIN clientes c ON p.id_cliente = c.id_cliente
    WHERE p.estado = 'activo'
`;

router.post('/', async (req, res) => {
    const { monto, fecha_pago, id_cliente, renovar } = req.body;
    const errores = validarPago({ monto, fecha_pago, id_cliente });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [resultado] = await pool.query(
            'INSERT INTO pagos (monto, fecha_pago, id_cliente) VALUES (?, ?, ?)',
            [parseInt(monto), fecha_pago, id_cliente]
        );
        const mysql_id = resultado.insertId;
        const mongoDoc = new Pago({ mysql_id, monto: parseInt(monto), fecha_pago, id_cliente });
        await mongoDoc.save();

        if (renovar) {
            // Find the active membership for this client and renew it (add months)
            const [inscripciones] = await pool.query('SELECT i.id_inscripcion, i.fecha_fin, m.duracion FROM inscripciones i JOIN membresias m ON i.id_membresia = m.id_membresia WHERE i.id_cliente = ? AND i.estado="activo" ORDER BY i.id_inscripcion DESC LIMIT 1', [id_cliente]);
            if (inscripciones.length > 0) {
                const ins = inscripciones[0];
                // Simple logic: add 30 days or based on 'duracion' logic. For now, add 1 month (30 days).
                // Or simply set fecha_fin to DATE_ADD(fecha_fin, INTERVAL 1 MONTH) if not expired, or DATE_ADD(CURDATE(), INTERVAL 1 MONTH) if expired.
                const isVencida = new Date(ins.fecha_fin) < new Date();
                const baseDate = isVencida ? 'CURDATE()' : 'fecha_fin';
                
                await pool.query(`UPDATE inscripciones SET fecha_fin = DATE_ADD(${baseDate}, INTERVAL 1 MONTH) WHERE id_inscripcion = ?`, [ins.id_inscripcion]);
            }
        }

        res.status(201).json({ mensaje: renovar ? 'Pago registrado y suscripción renovada' : 'Pago registrado correctamente', mysql_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar pago' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(SELECT_QUERY + ' ORDER BY p.fecha_pago DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pagos' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(SELECT_QUERY + ' AND p.id_pago=?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Pago no encontrado o inactivo' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar pago' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { monto, fecha_pago, id_cliente } = req.body;
    const errores = validarPago({ monto, fecha_pago, id_cliente });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [result] = await pool.query(
            'UPDATE pagos SET monto=?, fecha_pago=?, id_cliente=? WHERE id_pago=?',
            [parseInt(monto), fecha_pago, id_cliente, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Pago no encontrado' });
        await Pago.findOneAndUpdate({ mysql_id: parseInt(id) }, { monto: parseInt(monto), fecha_pago, id_cliente });
        res.json({ mensaje: 'Pago actualizado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar pago' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE pagos SET estado="inactivo" WHERE id_pago=?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Pago no encontrado' });
        await Pago.findOneAndUpdate({ mysql_id: parseInt(id) }, { estado: 'inactivo' });
        res.json({ mensaje: 'Pago eliminado (archivado)' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar pago' });
    }
});

module.exports = router;
