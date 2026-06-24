const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');
const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
    mysql_id: Number,
    fecha_inicio: Date,
    fecha_fin: Date,
    id_cliente: Number,
    id_membresia: Number,
    estado: { type: String, default: 'activo' }
});
const Inscripcion = mongoose.model('Inscripcion', inscripcionSchema);

function validarInscripcion({ fecha_inicio, fecha_fin, id_cliente, id_membresia }) {
    const errores = [];
    if (!fecha_inicio) errores.push('La fecha de inicio es requerida');
    if (!fecha_fin) errores.push('La fecha de fin es requerida');
    if (!id_cliente) errores.push('El cliente es requerido');
    if (!id_membresia) errores.push('La membresía es requerida');
    return errores;
}

const SELECT_QUERY = `
    SELECT i.id_inscripcion, i.fecha_inicio, i.fecha_fin, i.id_cliente, i.id_membresia,
           c.nombre as cliente_nombre, c.apellido_p as cliente_apellido,
           m.tipo as membresia_tipo
    FROM inscripciones i
    JOIN clientes c ON i.id_cliente = c.id_cliente
    JOIN membresias m ON i.id_membresia = m.id_membresia
    WHERE i.estado = 'activo'
`;

router.post('/', async (req, res) => {
    const { fecha_inicio, fecha_fin, id_cliente, id_membresia } = req.body;
    const errores = validarInscripcion({ fecha_inicio, fecha_fin, id_cliente, id_membresia });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [resultado] = await pool.query(
            'INSERT INTO inscripciones (fecha_inicio, fecha_fin, id_cliente, id_membresia) VALUES (?, ?, ?, ?)',
            [fecha_inicio, fecha_fin, id_cliente, id_membresia]
        );
        const mysql_id = resultado.insertId;
        const mongoDoc = new Inscripcion({ mysql_id, fecha_inicio, fecha_fin, id_cliente, id_membresia });
        await mongoDoc.save();
        res.status(201).json({ mensaje: 'Inscripción registrada correctamente', mysql_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar inscripción' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(SELECT_QUERY + ' ORDER BY i.id_inscripcion DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener inscripciones' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(SELECT_QUERY + ' AND i.id_inscripcion=?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Inscripción no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar inscripción' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, id_cliente, id_membresia } = req.body;
    const errores = validarInscripcion({ fecha_inicio, fecha_fin, id_cliente, id_membresia });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [result] = await pool.query(
            'UPDATE inscripciones SET fecha_inicio=?, fecha_fin=?, id_cliente=?, id_membresia=? WHERE id_inscripcion=?',
            [fecha_inicio, fecha_fin, id_cliente, id_membresia, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Inscripción no encontrada' });
        await Inscripcion.findOneAndUpdate({ mysql_id: parseInt(id) }, { fecha_inicio, fecha_fin, id_cliente, id_membresia });
        res.json({ mensaje: 'Inscripción actualizada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar inscripción' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE inscripciones SET estado="inactivo" WHERE id_inscripcion=?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Inscripción no encontrada' });
        await Inscripcion.findOneAndUpdate({ mysql_id: parseInt(id) }, { estado: 'inactivo' });
        res.json({ mensaje: 'Inscripción eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar inscripción' });
    }
});

module.exports = router;
