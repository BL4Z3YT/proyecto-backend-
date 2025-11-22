const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    titulo: { type: String, required: true },
    desarrollador: { type: String, required: true },
    genero: { type: String, required: true },
    plataforma: { type: String, required: true },
    descripcion: { type: String, default: '' },
    imagenPortada: { type: String, default: '' },
    añoLanzamiento: { type: Number, required: true },
    completado: { type: Boolean, default: false },
    fechaCreacion: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Game', GameSchema);