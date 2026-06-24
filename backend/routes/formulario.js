const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');
const Cliente = require('../db/Cliente');

// ─── VALIDACIÓN ─────────────────────────────────────────────
function validarCliente({ nombre, apellido_p, apellido_m, edad }) {
    const errores = [];
    if (!nombre    || !nombre.trim())    errores.push('El nombre es requerido');
    if (!apellido_p || !apellido_p.trim()) errores.push('El apellido paterno es requerido');
    if (!apellido_m || !apellido_m.trim()) errores.push('El apellido materno es requerido');
    if (!edad      || !edad.trim())      errores.push('La edad es requerida');
    else {
        const edadNum = parseInt(edad);
        if (isNaN(edadNum) || edadNum < 1 || edadNum > 120)
            errores.push('La edad debe ser un número entre 1 y 120');
    }
    return errores;
}

// ─── CREATE ─────────────────────────────────────────────────
router.post('/registrar', async (req, res) => {
    const { nombre, apellido_p, apellido_m, edad } = req.body;

    const errores = validarCliente({ nombre, apellido_p, apellido_m, edad });
    if (errores.length) {
        return res.status(400).json({ mensaje: errores.join(', ') });
    }

    try {
        const [resultado] = await pool.query(
            'INSERT INTO clientes (nombre, apellido_p, apellido_m, edad) VALUES (?, ?, ?, ?)',
            [nombre.trim(), apellido_p.trim(), apellido_m.trim(), edad.trim()]
        );
        const mysql_id = resultado.insertId;

        const clienteMongo = new Cliente({
            mysql_id,
            nombre: nombre.trim(),
            apellido_p: apellido_p.trim(),
            apellido_m: apellido_m.trim(),
            edad: edad.trim()
        });
        await clienteMongo.save();

        res.status(201).json({ mensaje: 'Cliente registrado correctamente', mysql_id });
    } catch (error) {
        console.error('Error CREATE:', error);
        res.status(500).json({ mensaje: 'Error al registrar cliente' });
    }
});

// ─── READ BY ID ─────────────────────────────────────────────
router.get('/clientes/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE id_cliente = ? AND estado = "activo"', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Cliente no encontrado o inactivo' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error READ BY ID:', error);
        res.status(500).json({ mensaje: 'Error al buscar cliente' });
    }
});

// ─── READ ALL ───────────────────────────────────────────────
router.get('/clientes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE estado = "activo" ORDER BY id_cliente DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error READ:', error);
        res.status(500).json({ mensaje: 'Error al obtener clientes' });
    }
});

// ─── UPDATE ─────────────────────────────────────────────────
router.put('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido_p, apellido_m, edad } = req.body;

    const errores = validarCliente({ nombre, apellido_p, apellido_m, edad });
    if (errores.length) {
        return res.status(400).json({ mensaje: errores.join(', ') });
    }

    try {
        const [result] = await pool.query(
            'UPDATE clientes SET nombre=?, apellido_p=?, apellido_m=?, edad=? WHERE id_cliente=?',
            [nombre.trim(), apellido_p.trim(), apellido_m.trim(), edad.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        await Cliente.findOneAndUpdate(
            { mysql_id: parseInt(id) },
            { nombre: nombre.trim(), apellido_p: apellido_p.trim(), apellido_m: apellido_m.trim(), edad: edad.trim() }
        );

        res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (error) {
        console.error('Error UPDATE:', error);
        res.status(500).json({ mensaje: 'Error al actualizar cliente' });
    }
});

// ─── DELETE ─────────────────────────────────────────────────
router.delete('/clientes/:id', async (req, res) => {
    try {
        const [result] = await pool.query('UPDATE clientes SET estado = "inactivo" WHERE id_cliente = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

        // Actualizar estado en mongo
        await Cliente.findOneAndUpdate({ mysql_id: parseInt(req.params.id) }, { estado: 'inactivo' });

        res.json({ mensaje: 'Cliente archivado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar cliente' });
    }
});

module.exports = router;
module.exports.validarCliente = validarCliente;
module.exports.Cliente = Cliente;
