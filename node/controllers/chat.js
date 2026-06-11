// chat.js

const colors = require("colors");
const { mySqlPool } = require("../config/db");

const chatController = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      console.log("Room ID is required".bgRed);

      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const [messages] = await mySqlPool.query(
      ` SELECT
        cm.id,
        cm.message,
        cm.created_at,
        u.id AS sender_id,
        u.name AS sender_name,
        u.email AS sender_email

      FROM chat_messages cm

      INNER JOIN users u
      ON cm.sender_id = u.id

      INNER JOIN rooms r
      ON cm.room_id = r.id

      WHERE r.room_id = ?

      ORDER BY cm.created_at ASC`,
      [roomId],
    );

    console.log(
      `Chat messages fetched successfully for room ${roomId}`.bgGreen,
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.log(`Error in Chat Controler : ${error.message}`.bgRed);

    return res.status(500).json({
      success: false,
      message: `Error in Chat Controler : ${error.message}`,
    });
  }
};

module.exports = {
  chatController,
};


