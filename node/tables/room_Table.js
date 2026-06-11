// room_Table.js
const { mySqlPool } = require("../config/db");
const createRoomTable = async () => {
  try {
    await mySqlPool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,

        room_id VARCHAR(100) UNIQUE NOT NULL,

        room_name VARCHAR(100),

        host_id INT NULL,

        status ENUM('active','ended')
        DEFAULT 'active',

        created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (host_id)
        REFERENCES users(id)
        ON DELETE SET NULL
      )
    `);

    console.log("Rooms table created successfully");
  } catch (error) {
    console.error(error);
  }
};

createRoomTable();
