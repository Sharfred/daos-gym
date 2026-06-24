const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const conectarMongo = require('./db/mongo');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const publicoRoutes = require('./routes/publico');
const formularioRoutes = require('./routes/formulario');
const membresiasRoutes = require('./routes/membresias');
const inscripcionesRoutes = require('./routes/inscripciones');
const pagosRoutes = require('./routes/pagos');
const statsRoutes = require('./routes/stats');

const app = express();

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false // Disabled to easily allow inline scripts/styles if any exist in index.html
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes); // Pública
app.use('/api/publico', publicoRoutes); // Registro de clientes público
app.use('/api', authMiddleware, formularioRoutes); // Protegida (clientes CRUD privado)
app.use('/api/membresias', authMiddleware, membresiasRoutes);
app.use('/api/inscripciones', authMiddleware, inscripcionesRoutes);
app.use('/api/pagos', authMiddleware, pagosRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

// Servir archivos estáticos del frontend (index.html, app.js, img/, media/)
app.use(express.static(path.join(__dirname, '..')));

// Ruta catch-all: siempre devuelve index.html para rutas no-API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

conectarMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});
