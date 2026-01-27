import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool and enable promise API on it
const pool = mysql
  .createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

export default pool;

