const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    juegoId: { type: String, required: true, index: true },
    puntuacion: { type: Number, required: true, min: 1, max: 5 },
    textoReseña: { type: String, required: true },
    horasJugadas: { type: Number, required: true, min: 0 },
    dificultad: { type: String, required: true, enum: ['Fácil', 'Normal', 'Difícil'] },
    recomendaria: { type: Boolean, required: true },
    fechaCreacion: { type: Date, default: Date.now },
    fechaActualizacion: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Review', ReviewSchema);