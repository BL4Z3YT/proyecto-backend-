const express = require('express');
const { load, save } = require('../db/store');
const { generateId } = require('../utils/id');
const Review = require('../db/models/Review');

const router = express.Router();

// GET /api/reseñas - Obtener todas tus reseñas
router.get('/', async (req, res) => {
  if (req.app.locals.useMongo) {
    const reviews = await Review.find({}).lean();
    return res.json(reviews);
  }
  const reviews = load('reviews');
  res.json(reviews);
});

// GET /api/reseñas/juego/:juegoId - Reseñas de un juego específico
router.get('/juego/:juegoId', async (req, res) => {
  if (req.app.locals.useMongo) {
    const list = await Review.find({ $or: [{ juegoId: req.params.juegoId }, { gameId: req.params.juegoId }] }).lean();
    return res.json(list);
  }
  const reviews = load('reviews');
  const list = reviews.filter((r) => (r.juegoId || r.gameId) === req.params.juegoId);
  res.json(list);
});

// POST /api/reseñas - Escribir nueva reseña
router.post('/', async (req, res) => {
  const b = req.body || {};
  const juegoId = typeof b.juegoId === 'string' ? b.juegoId : b.gameId; // compat
  const puntuacion = Number(b.puntuacion ?? b.rating);
  const textoReseña = typeof b.textoReseña === 'string' ? b.textoReseña.trim() : (typeof b.textoResena === 'string' ? b.textoResena.trim() : b.contenido?.trim());
  const horasJugadas = Number(b.horasJugadas);
  const dificultad = b.dificultad;
  const recomendaria = !!b.recomendaria;
  const fechaCreacion = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date();
  const fechaActualizacion = b.fechaActualizacion ? new Date(b.fechaActualizacion) : fechaCreacion;

  if (!juegoId || !textoReseña || !Number.isFinite(puntuacion) || puntuacion < 1 || puntuacion > 5 || !Number.isFinite(horasJugadas) || horasJugadas < 0 || !['Fácil','Normal','Difícil'].includes(dificultad)) {
    return res.status(400).json({ error: 'Datos inválidos en la reseña' });
  }

  const payload = {
    id: b.id || generateId(),
    juegoId,
    puntuacion,
    textoReseña,
    horasJugadas,
    dificultad,
    recomendaria,
    fechaCreacion: req.app.locals.useMongo ? fechaCreacion : fechaCreacion.toISOString(),
    fechaActualizacion: req.app.locals.useMongo ? fechaActualizacion : fechaActualizacion.toISOString(),
  };
  if (req.app.locals.useMongo) {
    await Review.create(payload);
    return res.status(201).json(payload);
  }
  try {
    const reviews = load('reviews');
    reviews.unshift(payload);
    if (!save('reviews', reviews)) return res.status(500).json({ error: 'Error al guardar reseña' });
    res.status(201).json(payload);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

// PUT /api/reseñas/:id - Actualizar reseña existente
router.put('/:id', async (req, res) => {
  if (req.app.locals.useMongo) {
    const updated = await Review.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, id: req.params.id },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Reseña no encontrada' });
    return res.json(updated);
  }
  try {
  try {
    const reviews = load('reviews');
    const idx = reviews.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Reseña no encontrada' });
    const b = req.body || {};
    const merged = {
      ...reviews[idx],
      juegoId: typeof b.juegoId === 'string' ? b.juegoId : (b.gameId ?? reviews[idx].juegoId),
      puntuacion: b.puntuacion != null ? Number(b.puntuacion) : reviews[idx].puntuacion,
      textoReseña: typeof b.textoReseña === 'string' ? b.textoReseña.trim() : (typeof b.textoResena === 'string' ? b.textoResena.trim() : (b.contenido?.trim() ?? reviews[idx].textoReseña)),
      horasJugadas: b.horasJugadas != null ? Number(b.horasJugadas) : reviews[idx].horasJugadas,
      dificultad: b.dificultad ?? reviews[idx].dificultad,
      recomendaria: b.recomendaria != null ? !!b.recomendaria : reviews[idx].recomendaria,
      fechaActualizacion: new Date().toISOString(),
      id: reviews[idx].id,
    };
    if (!merged.juegoId || !merged.textoReseña || !Number.isFinite(merged.puntuacion) || merged.puntuacion < 1 || merged.puntuacion > 5 || !Number.isFinite(merged.horasJugadas) || merged.horasJugadas < 0 || !['Fácil','Normal','Difícil'].includes(merged.dificultad)) {
      return res.status(400).json({ error: 'Datos inválidos en la reseña' });
    }
    reviews[idx] = merged;
    if (!save('reviews', reviews)) return res.status(500).json({ error: 'Error al guardar reseña' });
    res.json(merged);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

// DELETE /api/reseñas/:id - Eliminar reseña
router.delete('/:id', async (req, res) => {
  if (req.app.locals.useMongo) {
    const removed = await Review.findOneAndDelete({ id: req.params.id }).lean();
    if (!removed) return res.status(404).json({ error: 'Reseña no encontrada' });
    return res.json(removed);
  }
  try {
    const reviews = load('reviews');
    const idx = reviews.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Reseña no encontrada' });
    const [removed] = reviews.splice(idx, 1);
    if (!save('reviews', reviews)) return res.status(500).json({ error: 'Error al guardar reseñas' });
    res.json(removed);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

module.exports = router;