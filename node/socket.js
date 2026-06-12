// socket.js (node)

const { Server } = require("socket.io");
const { mySqlPool } = require("./config/db");

const connectedUsers = {};
let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async (data) => {
      socket.join(data.roomId);

      try {
        const [rooms] = await mySqlPool.query(
          `
      SELECT id
      FROM rooms
      WHERE room_id = ?
      `,
          [data.roomId],
        );

        if (rooms.length > 0) {
          connectedUsers[socket.id] = {
            roomId: data.roomId,
            roomDbId: rooms[0].id,
            userId: data.userId,
            userName: data.userName,
          };
        }

        console.log(`Socket ${socket.id} joined room ${data.roomId}`);

        socket.to(data.roomId).emit("user-joined", {
          type: "notification",
          message: `${data.userName} joined the meeting`,
        });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("send-message", async (data) => {
      try {
        const [room] = await mySqlPool.query(
          `
      SELECT id
      FROM rooms
      WHERE room_id = ?
      `,
          [data.roomId],
        );

        if (room.length === 0) {
          return;
        }

        const roomDbId = room[0].id;

        // TEMPORARY
        const senderId = 1;

        await mySqlPool.query(
          `
      INSERT INTO chat_messages
      (
        room_id,
        sender_id,
        message
      )
      VALUES (?, ?, ?)
      `,
          [roomDbId, senderId, data.message],
        );

        io.to(data.roomId).emit("receive-message", data);
      } catch (error) {
        console.error(`Chat Save Error: ${error.message}`);
      }
    });

    socket.on("raise-hand", (data) => {
      io.to(data.roomId).emit("hand-raised", data);
    });

    // =====================================
    // WebRTC Offer
    // =====================================

    socket.on("offer", (data) => {
      socket.to(data.roomId).emit("offer", {
        offer: data.offer,
        senderId: socket.id,
      });
    });

    // =====================================
    // WebRTC Answer
    // =====================================

    socket.on("answer", (data) => {
      socket.to(data.roomId).emit("answer", {
        answer: data.answer,
        senderId: socket.id,
      });
    });

    // =====================================
    // ICE Candidate
    // =====================================

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        senderId: socket.id,
      });
    });

    // =====================================
    // End Meeting Socket Event
    // =====================================

    socket.on("end-meeting", (roomId) => {
      console.log(`Meeting Ended: ${roomId}`);

      io.to(roomId).emit("meeting-ended", "Host has ended the meeting");
    });

    socket.on("disconnect", async () => {
      try {
        console.log(`User Disconnected: ${socket.id}`);

        const user = connectedUsers[socket.id];

        if (!user) return;

        await mySqlPool.query(
          `
      UPDATE room_participants
      SET left_at = NOW()
      WHERE room_id = ?
      AND user_id = ?
      AND left_at IS NULL
      `,
          [user.roomDbId, user.userId],
        );

        io.to(user.roomId).emit("user-left", {
          type: "notification",
          message: `${user.userName} disconnected`,
        });

        delete connectedUsers[socket.id];
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("leave-room", async (data) => {
      try {
        const user = connectedUsers[socket.id];

        if (user) {
          await mySqlPool.query(
            `
        UPDATE room_participants
        SET left_at = NOW()
        WHERE room_id = ?
        AND user_id = ?
        AND left_at IS NULL
        `,
            [user.roomDbId, user.userId],
          );
        }

        delete connectedUsers[socket.id];

        socket.leave(data.roomId);

        socket.to(data.roomId).emit("user-left", {
          type: "notification",
          message: `${data.userName} left the meeting`,
        });

        delete connectedUsers[socket.id];
      } catch (error) {
        console.error(error);
      }
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
};
