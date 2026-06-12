// db.js (Localhost)
/* 
const mysql = require('mysql2/promise');

// create the connection to database
const mySqlPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'zoomproject',
});

exports.mySqlPool = mySqlPool;
 */

// db.js (Deployed)
 
const mysql = require("mysql2/promise");
require("dotenv").config();

const mySqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
});

exports.mySqlPool = mySqlPool;