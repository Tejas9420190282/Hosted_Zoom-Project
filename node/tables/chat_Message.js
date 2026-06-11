// chat_Message.js


const { mySqlPool } = require("../config/db");
const colors = require("colors");

const createChatMessageTable = () => {
  try {
    const createchatMessageTable = mySqlPool.query(`
      CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,

    room_id INT NOT NULL,

    sender_id INT NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id)
    REFERENCES rooms(id)
    ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

`);
    console.log("createChatMessageTable table created successfully".bgGreen);
  } catch (error) {
    console.error(error);
  }
};

createChatMessageTable();
