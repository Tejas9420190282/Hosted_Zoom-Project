// socket.js (node)

const { Server } = require("socket.io");
const { mySqlPool } = require("./config/db");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://10.65.165.224:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", (data) => {
      socket.join(data.roomId);

      console.log(`Socket ${socket.id} joined room ${data.roomId}`);

      socket.to(data.roomId).emit("user-joined", {
        type: "notification",
        message: `${data.userName} joined the meeting`,
      });
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

    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
    });

    socket.on("leave-room", (data) => {
      socket.leave(data.roomId);

      socket.to(data.roomId).emit("user-left", {
        type: "notification",
        message: `${data.userName} left the meeting`,
      });
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
};
