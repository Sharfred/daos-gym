const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    mysql_id:       Number,
    nombre:         String,
    apellido_p:     String,
    apellido_m:     String,
    edad:           String,
    estado:         { type: String, default: 'activo' },
    fecha_registro: { type: Date, default: Date.now }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;
