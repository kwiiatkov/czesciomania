import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
},
  waitForConnections: true,
  connectionLimit: 10,
});


// Sprawdź połączenie przy starcie
pool.getConnection()
  .then(conn => {
    console.log('✅ Połączono z bazą danych MariaDB');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Błąd połączenia z bazą danych:', err.message);
    process.exit(1);
  });

export default pool;
