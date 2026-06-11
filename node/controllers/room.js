// controllers/room.js

const { mySqlPool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const colors = require("colors");

// =====================================
// Create Room Controller
// =====================================

const create_Room_Controller = async (req, res) => {
  try {
    const userId = req.user.userId;

    const roomId = uuidv4();

    const roomName = `Meeting-${Date.now()}`;

    const [result] = await mySqlPool.query(
      `INSERT INTO rooms
      (room_id, room_name, host_id)
      VALUES (?, ?, ?)`,
      [roomId, roomName, userId],
    );

    await mySqlPool.query(
      `INSERT INTO room_participants
   (room_id, user_id)
   VALUES (?, ?)`,
      [result.insertId, userId],
    );

    console.log(`Room Create Successfully`.bgGreen);

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        id: result.insertId,
        roomId,
        roomName,
        hostId: userId,
      },
    });
  } catch (error) {
    console.error(`Create Room Error: ${error}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
// Join Room Controller
// =====================================

const join_Room_Controller = async (req, res) => {
  try {
    const { roomId } = req.body;

    const userId = req.user.userId;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    // Check room exists
    const [rooms] = await mySqlPool.query(
      `
      SELECT *
      FROM rooms
      WHERE room_id = ?
      AND status = 'active'
      `,
      [roomId],
    );

    if (rooms.length === 0) {
      console.log("Room not found".bgRed);

      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const room = rooms[0];

    // Check if already joined
    /* const [existingParticipant] = await mySqlPool.query(
      `
      SELECT *
      FROM room_participants
      WHERE room_id = ?
      AND user_id = ?
      `,
      [room.id, userId],
    ); */

    // Check participant record
    const [participant] = await mySqlPool.query(
      `
  SELECT *
  FROM room_participants
  WHERE room_id = ?
  AND user_id = ?
  `,
      [room.id, userId],
    );

    // User already active in room
    if (participant.length > 0 && participant[0].left_at === null) {
      return res.status(409).json({
        success: false,
        message: "User already joined this room",
      });
    }

    // User joined before and left
    if (participant.length > 0) {
      await mySqlPool.query(
        `
    UPDATE room_participants
    SET
      left_at = NULL,
      joined_at = NOW()
    WHERE room_id = ?
    AND user_id = ?
    `,
        [room.id, userId],
      );
    } else {
      // First time joining
      await mySqlPool.query(
        `
    INSERT INTO room_participants
    (room_id, user_id)
    VALUES (?, ?)
    `,
        [room.id, userId],
      );
    }

    console.log(`User ${userId} joined room ${roomId}`.bgGreen);

    return res.status(200).json({
      success: true,
      message: "Room joined successfully",
      room: {
        id: room.id,
        roomId: room.room_id,
        roomName: room.room_name,
        hostId: room.host_id,
      },
    });
  } catch (error) {
    console.error(`Error occurred while joining room: ${error}`.bgRed);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
// Get Room Participants Controller
// =====================================

const get_Room_Participants_Controller = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check room exists
    const [rooms] = await mySqlPool.query(
      `
      SELECT id, room_id, room_name, host_id
      FROM rooms
      WHERE room_id = ?
      `,
      [roomId],
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const room = rooms[0];

    // Get participants
    const [participants] = await mySqlPool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        rp.joined_at
      FROM room_participants rp

      INNER JOIN users u
      ON rp.user_id = u.id

      WHERE rp.room_id = ?
      AND rp.left_at IS NULL
      `,
      [room.id],
    );

    return res.status(200).json({
      success: true,
      room: {
        roomId: room.room_id,
        roomName: room.room_name,
        hostId: room.host_id,
      },
      participants,
    });
  } catch (error) {
    console.error(`Error while fetching participants: ${error}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
// Leave Room Controller
// =====================================

const leave_Room_Controller = async (req, res) => {
  try {
    const { roomId } = req.body;

    const userId = req.user.userId;

    const [rooms] = await mySqlPool.query(
      `
      SELECT id
      FROM rooms
      WHERE room_id = ?
      `,
      [roomId],
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    await mySqlPool.query(
      `
      UPDATE room_participants
      SET left_at = NOW()
      WHERE room_id = ?
      AND user_id = ?
      `,
      [rooms[0].id, userId],
    );

    return res.status(200).json({
      success: true,
      message: "Left room successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
// End Meeting Controller
// =====================================

const end_Meeting_Controller = async (req, res) => {
  try {
    const { roomId } = req.body;

    const userId = req.user.userId;

    const [rooms] = await mySqlPool.query(
      `
      SELECT *
      FROM rooms
      WHERE room_id = ?
      `,
      [roomId],
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const room = rooms[0];

    // Only host can end meeting
    if (room.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only host can end meeting",
      });
    }

    // End room
    await mySqlPool.query(
      `
      UPDATE rooms
      SET status = 'ended'
      WHERE id = ?
      `,
      [room.id],
    );

    // Mark all participants as left
    await mySqlPool.query(
      `
      UPDATE room_participants
      SET left_at = NOW()
      WHERE room_id = ?
      `,
      [room.id],
    );

    // Delete chat history
    await mySqlPool.query(
      `
      DELETE FROM chat_messages
      WHERE room_id = ?
      `,
      [room.id],
    );

    return res.status(200).json({
      success: true,
      message: "Meeting ended successfully",
    });
  } catch (error) {
    console.error(`End Meeting Error: ${error}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  create_Room_Controller,
  join_Room_Controller,
  get_Room_Participants_Controller,
  leave_Room_Controller,
  end_Meeting_Controller,
};
