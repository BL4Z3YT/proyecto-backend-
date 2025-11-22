const crypto = require('crypto');

function generateId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

module.exports = { generateId };