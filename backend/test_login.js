const bcrypt = require('bcryptjs');
const pool = require('./db/mysql');

async function testLogin() {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', ['admin']);
        console.log("Usuarios en DB:", rows);
        
        if (rows.length > 0) {
            const isMatch = await bcrypt.compare('admin123', rows[0].password_hash);
            console.log("Match admin123:", isMatch);
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
testLogin();
