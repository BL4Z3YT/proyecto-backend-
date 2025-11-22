const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILES = {
  games: path.join(DATA_DIR, 'games.json'),
  reviews: path.join(DATA_DIR, 'reviews.json'),
};

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const key of Object.keys(FILES)) {
    const fp = FILES[key];
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]', 'utf8');
  }
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn(`readJson error: ${filePath}`);
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`writeJson error: ${filePath}`);
    return false;
  }
}

function load(collection) {
  ensureFiles();
  const fp = FILES[collection];
  if (!fp) throw new Error('Colección inválida');
  return readJson(fp);
}

function save(collection, data) {
  ensureFiles();
  const fp = FILES[collection];
  if (!fp) throw new Error('Colección inválida');
  return writeJson(fp, data);
}

module.exports = { load, save };