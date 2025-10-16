// src/lib/db.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT, // necesario para hacerlo funcionar con Aiven
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // obligatorio para Aiven
  },
  waitForConnections: true,
  connectionLimit: 10
});

export default db;
