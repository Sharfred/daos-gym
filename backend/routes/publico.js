const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');
const Cliente = require('../db/Cliente');
const { validarCliente } = require('./formulario');

// ─── REGISTRO PÚBLICO ───────────────────────────────────────────────
router.post('/registro-cliente', async (req, res) => {
    const { nombre, apellido_p, apellido_m, edad } = req.body;
    
    // Validación básica compartida
    const errores = validarCliente({ nombre, apellido_p, apellido_m, edad });
    if (errores.length > 0) {
        return res.status(400).json({ mensaje: errores.join(', ') });
    }

    try {
        // 1. Guardar en MySQL (Base principal relacional)
        const [resultado] = await pool.query(
            'INSERT INTO clientes (nombre, apellido_p, apellido_m, edad) VALUES (?, ?, ?, ?)',
            [nombre, apellido_p, apellido_m, parseInt(edad)]
        );

        const mysql_id = resultado.insertId;

        // 2. Guardar en MongoDB (Base sincronizada)
        const clienteMongo = new Cliente({
            mysql_id,
            nombre,
            apellido_p,
            apellido_m,
            edad: parseInt(edad)
        });
        await clienteMongo.save();

        res.status(201).json({ 
            mensaje: '¡Registro exitoso! Bienvenido a DAO\'S GYM.', 
            id_cliente: mysql_id 
        });

    } catch (error) {
        console.error('Error en registro público:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar cliente' });
    }
});

module.exports = router;
