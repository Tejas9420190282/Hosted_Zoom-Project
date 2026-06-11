// room_Participants_Table.js

const { mySqlPool } = require("../config/db");
const colors = require("colors");

const createRoomParticipantsTable = async () => {
  try {
    await mySqlPool.query(`
      CREATE TABLE IF NOT EXISTS room_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,

        room_id INT NOT NULL,

        user_id INT NOT NULL,

        joined_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

        left_at DATETIME NULL,

        UNIQUE(room_id, user_id),

        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    console.log(
      "room_participants table created successfully".bgGreen
    );

  } catch (error) {
    console.error(error);
  }
};

createRoomParticipantsTable();
