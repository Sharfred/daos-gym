const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');
const mongoose = require('mongoose');

const membresiaSchema = new mongoose.Schema({
    mysql_id: Number,
    tipo: String,
    duracion: String,
    costo: Number,
    estado: { type: String, default: 'activo' }
});
const Membresia = mongoose.model('Membresia', membresiaSchema);

function validarMembresia({ tipo, duracion, costo }) {
    const errores = [];
    if (!tipo || !tipo.trim()) errores.push('El tipo es requerido');
    if (!duracion || !duracion.trim()) errores.push('La duración es requerida');
    if (costo === undefined || costo === null) errores.push('El costo es requerido');
    else if (isNaN(parseInt(costo)) || parseInt(costo) < 0) errores.push('El costo debe ser un número válido');
    return errores;
}

router.post('/', async (req, res) => {
    const { tipo, duracion, costo } = req.body;
    const errores = validarMembresia({ tipo, duracion, costo });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [resultado] = await pool.query(
            'INSERT INTO membresias (tipo, duracion, costo) VALUES (?, ?, ?)',
            [tipo.trim(), duracion.trim(), parseInt(costo)]
        );
        const mysql_id = resultado.insertId;
        const mongoDoc = new Membresia({ mysql_id, tipo: tipo.trim(), duracion: duracion.trim(), costo: parseInt(costo) });
        await mongoDoc.save();
        res.status(201).json({ mensaje: 'Membresía registrada correctamente', mysql_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar membresía' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM membresias WHERE estado="activo"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener membresías' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM membresias WHERE id_membresia=? AND estado="activo"', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Membresía no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar membresía' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { tipo, duracion, costo } = req.body;
    const errores = validarMembresia({ tipo, duracion, costo });
    if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });
    try {
        const [result] = await pool.query(
            'UPDATE membresias SET tipo=?, duracion=?, costo=? WHERE id_membresia=?',
            [tipo.trim(), duracion.trim(), parseInt(costo), id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Membresía no encontrada' });
        await Membresia.findOneAndUpdate({ mysql_id: parseInt(id) }, { tipo: tipo.trim(), duracion: duracion.trim(), costo: parseInt(costo) });
        res.json({ mensaje: 'Membresía actualizada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar membresía' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE membresias SET estado="inactivo" WHERE id_membresia=?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Membresía no encontrada' });
        await Membresia.findOneAndUpdate({ mysql_id: parseInt(id) }, { estado: 'inactivo' });
        res.json({ mensaje: 'Membresía eliminada' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ mensaje: 'No se puede eliminar porque está asignada a inscripciones.' });
        }
        res.status(500).json({ mensaje: 'Error al eliminar membresía' });
    }
});

module.exports = router;
