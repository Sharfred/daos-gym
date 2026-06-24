const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Para simplificar el entorno de pruebas, usamos un secret duro, pero lo ideal es usar process.env.JWT_SECRET
    const secret = process.env.JWT_SECRET || 'gimnasio_secreto_2026';
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ mensaje: 'No hay token, autorización denegada' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Formato de token inválido' });
    
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ mensaje: 'Token no válido' });
    }
};

module.exports = authMiddleware;
