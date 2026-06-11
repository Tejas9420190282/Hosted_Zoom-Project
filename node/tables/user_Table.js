// user_Table.js
const colors = require('colors');
const { mySqlPool } = require("../config/db");

const createUserTable = async () => {
  try {
    const createTableQuery = await mySqlPool.query(`
        CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            profile_image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
`);

        console.log(`User table created successfully`.bgGreen);
        
  } catch (error) {
    console.error(error);
  }
};

createUserTable();