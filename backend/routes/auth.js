const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/mysql');

router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ mensaje: 'Usuario y contraseña requeridos' });

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (rows.length === 0) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

        const secret = process.env.JWT_SECRET || 'gimnasio_secreto_2026';
        const token = jwt.sign({ id: user.id, usuario: user.usuario }, secret, { expiresIn: '8h' });

        res.json({ token, mensaje: 'Login exitoso' });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

module.exports = router;
