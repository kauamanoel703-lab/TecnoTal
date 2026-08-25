require('dotenv').config();
const app = require('./app');
const pool = require('./database/connection');

const PORT = process.env.PORT || 3001;

async function start() {
  // valida conexão com o banco antes de aceitar requisições
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('[db] MySQL conectado');

  app.listen(PORT, () => {
    console.log(`[api] Intranet TecnoTal API em http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[boot] Falha ao iniciar:', err.message);
  process.exit(1);
});
