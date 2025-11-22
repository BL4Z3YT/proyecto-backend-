const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI no está definido; se usará almacenamiento en archivos.');
    return false;
  }
  try {
    const dbName = process.env.MONGODB_DB || undefined;
    await mongoose.connect(uri, { dbName });
    console.log('Conectado a MongoDB');
    return true;
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err.message);
    return false;
  }
}

module.exports = { connectMongo };