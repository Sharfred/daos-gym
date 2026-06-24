const fs = require('fs');
const path = require('path');
const pool = require('./db/mysql');
const bcrypt = require('bcryptjs');

async function initDB() {
    try {
        console.log("Creando tablas base...");
        const queries = [
            `CREATE TABLE IF NOT EXISTS clientes (
                id_cliente INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(30) NOT NULL,
                apellido_p VARCHAR(30) NOT NULL,
                apellido_m VARCHAR(30) NOT NULL,
                edad VARCHAR(30) NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo'
            )`,
            `CREATE TABLE IF NOT EXISTS membresias (
                id_membresia INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(30) NOT NULL,
                duracion VARCHAR(30) NOT NULL,
                costo INT NOT NULL,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo'
            )`,
            `CREATE TABLE IF NOT EXISTS inscripciones (
                id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                id_cliente INT NOT NULL,
                id_membresia INT NOT NULL,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
                FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia) ON DELETE RESTRICT
            )`,
            `CREATE TABLE IF NOT EXISTS pagos (
                id_pago INT AUTO_INCREMENT PRIMARY KEY,
                monto INT NOT NULL,
                fecha_pago DATE NOT NULL,
                id_cliente INT NOT NULL,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            )`
        ];

        for (let q of queries) {
            await pool.query(q);
        }

        console.log("Generando usuario admin...");
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(`INSERT IGNORE INTO usuarios (usuario, password_hash) VALUES ('admin', ?)`, [hash]);

        console.log("¡Base de datos inicializada correctamente!");
        process.exit(0);
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        process.exit(1);
    }
}

initDB();
