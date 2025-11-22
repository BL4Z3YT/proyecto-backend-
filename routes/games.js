const express = require('express');
const { load, save } = require('../db/store');
const { generateId } = require('../utils/id');
const Game = require('../db/models/Game');

const router = express.Router();

// GET /api/juegos - Obtener todos los juegos
router.get('/', async (req, res) => {
  if (req.app.locals.useMongo) {
    const games = await Game.find({}).lean();
    return res.json(games);
  }
  const games = load('games');
  res.json(games);
});

// GET /api/juegos/:id - Obtener un juego específico
router.get('/:id', async (req, res) => {
  if (req.app.locals.useMongo) {
    const game = await Game.findOne({ id: req.params.id }).lean();
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    return res.json(game);
  }
  const games = load('games');
  const game = games.find((g) => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
  res.json(game);
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
  const desarrollador = typeof b.desarrollador === 'string' ? b.desarrollador.trim() : '';
  const genero = typeof b.genero === 'string' ? b.genero : '';
  const plataforma = typeof b.plataforma === 'string' ? b.plataforma : '';
  const añoLanzamiento = Number(b.añoLanzamiento);
  const descripcion = typeof b.descripcion === 'string' ? b.descripcion.trim() : '';
  const imagenPortada = typeof b.imagenPortada === 'string' ? b.imagenPortada.trim() : '';
  const completado = !!b.completado;
  const fechaCreacion = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date();
  if (!titulo || !desarrollador || !genero || !plataforma || !Number.isFinite(añoLanzamiento)) {
    return res.status(400).json({ error: 'Datos inválidos: titulo, desarrollador, genero, plataforma y añoLanzamiento son requeridos' });
  }
  const payload = {
    id: b.id || generateId(),
    titulo,
    desarrollador,
    genero,
    plataforma,
    descripcion,
    imagenPortada,
    añoLanzamiento,
    completado,
    fechaCreacion: req.app.locals.useMongo ? fechaCreacion : fechaCreacion.toISOString(),
  };
  if (req.app.locals.useMongo) {
    await Game.create(payload);
    return res.status(201).json(payload);
  }
  try {
    const games = load('games');
    games.unshift(payload);
    if (!save('games', games)) return res.status(500).json({ error: 'Error al guardar juego' });
    res.status(201).json(payload);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

// PUT /api/juegos/:id - Actualizar información del juego
router.put('/:id', async (req, res) => {
  if (req.app.locals.useMongo) {
    const updated = await Game.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, id: req.params.id },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Juego no encontrado' });
    return res.json(updated);
  }
  try {
    const games = load('games');
    const idx = games.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Juego no encontrado' });
    const updated = { ...games[idx], ...req.body, id: games[idx].id };
    games[idx] = updated;
    if (!save('games', games)) return res.status(500).json({ error: 'Error al guardar juego' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

// DELETE /api/juegos/:id - Remover juego de tu biblioteca
router.delete('/:id', async (req, res) => {
  if (req.app.locals.useMongo) {
    const removed = await Game.findOneAndDelete({ id: req.params.id }).lean();
    if (!removed) return res.status(404).json({ error: 'Juego no encontrado' });
    const Review = require('../db/models/Review');
    await Review.deleteMany({ $or: [{ juegoId: req.params.id }, { gameId: req.params.id }] });
    return res.json(removed);
  }
  try {
    const games = load('games');
    const idx = games.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Juego no encontrado' });
    const [removed] = games.splice(idx, 1);
    if (!save('games', games)) return res.status(500).json({ error: 'Error al guardar juego' });
    const reviews = load('reviews');
    const filtered = reviews.filter((r) => (r.juegoId || r.gameId) !== req.params.id);
    if (!save('reviews', filtered)) return res.status(500).json({ error: 'Error al guardar reseñas' });
    res.json(removed);
  } catch (e) {
    res.status(500).json({ error: 'Almacenamiento no disponible' });
  }
});

module.exports = router;