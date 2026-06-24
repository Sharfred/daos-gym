const bcrypt = require('bcryptjs');
const pool = require('./db/mysql');

async function updateDb() {
    try {
        console.log("Creando tabla usuarios...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            )
        `);

        console.log("Generando admin user...");
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(`INSERT IGNORE INTO usuarios (usuario, password_hash) VALUES ('admin', ?)`, [hash]);

        console.log("Agregando columna estado a clientes (soft deletes)...");
        try {
            await pool.query(`ALTER TABLE clientes ADD COLUMN estado ENUM('activo', 'inactivo') DEFAULT 'activo'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log("Columna estado ya existe en clientes");
        }

        console.log("Agregando columna estado a membresias (soft deletes)...");
        try {
            await pool.query(`ALTER TABLE membresias ADD COLUMN estado ENUM('activo', 'inactivo') DEFAULT 'activo'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log("Columna estado ya existe en membresias");
        }
        
        console.log("Agregando columna estado a inscripciones (soft deletes)...");
        try {
            await pool.query(`ALTER TABLE inscripciones ADD COLUMN estado ENUM('activo', 'inactivo') DEFAULT 'activo'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log("Columna estado ya existe en inscripciones");
        }
        
        console.log("Agregando columna estado a pagos (soft deletes)...");
        try {
            await pool.query(`ALTER TABLE pagos ADD COLUMN estado ENUM('activo', 'inactivo') DEFAULT 'activo'`);
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log("Columna estado ya existe en pagos");
        }

        console.log("Actualización completa!");
        process.exit(0);
    } catch (error) {
        console.error("Error actualizando DB:", error);
        process.exit(1);
    }
}

updateDb();
