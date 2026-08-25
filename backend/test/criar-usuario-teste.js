// Cria usuario de teste Teste@123 e valida login
const b = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'intranet_tecnotal' });
  const hash = b.hashSync('Teste@123', 12);
  await c.execute(
    `INSERT INTO usuarios (nome, email, cpf, senha_hash, cargo_id) VALUES ('Usuario Teste','teste@tecnotal.com.br','12345678909',?,3)
     ON DUPLICATE KEY UPDATE senha_hash=VALUES(senha_hash)`,
    [hash]
  );
  console.log('usuario teste pronto -> email: teste@tecnotal.com.br | senha: Teste@123');
  await c.end();
})();
