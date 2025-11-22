const express = require('express');
const cors = require('cors');
const path = require('path');

const gamesRouter = require('./routes/games');
const reviewsRouter = require('./routes/reviews');
const { connectMongo } = require('./db/mongo');
const Game = require('./db/models/Game');
const { load } = require('./db/store');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/juegos', gamesRouter);
// Alias en singular y en inglés para compatibilidad
app.use('/api/juego', gamesRouter);
app.use('/api/games', gamesRouter);
app.use('/api/reseñas', reviewsRouter);
// Alias sin acentos por compatibilidad con algunos clientes/entornos
app.use('/api/resenas', reviewsRouter);
// Alias en inglés por máxima compatibilidad
app.use('/api/reviews', reviewsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Fallback temporal para GET /api/juegos si el router no responde
app.get('/api/juegos', async (req, res, next) => {
  // Evitar duplicar respuesta si el router ya atendió
  if (res.headersSent) return next();
  try {
    if (app.locals.useMongo) {
      const games = await Game.find({}).lean();
      return res.json(games);
    }
    const games = load('games');
    return res.json(games);
  } catch (e) {
    return next(e);
  }
});

// Ruta de prueba
app.get('/api/test', (_req, res) => {
  res.json({ ok: true });
});

// Nota: el frontend de desarrollo sirve sus propios assets.
// Si deseas servir el build de React desde este servidor,
// vuelve a habilitar el bloque estático y usa una ruta compatible.
// Servir build de React (frontend/build)
const BUILD_DIR = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(BUILD_DIR));

// Fallback a index.html para rutas no-API (SPA)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

async function start() {
  const useMongo = await connectMongo();
  app.locals.useMongo = useMongo;

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`GameTracker API running on http://localhost:${PORT}`);
  });
}

start();