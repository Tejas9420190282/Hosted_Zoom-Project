//  node/routers/room_Route.js

const express = require("express");
const { authMiddleware } = require("../middleware/auth_Middleware");
const {
  create_Room_Controller,
  join_Room_Controller,
  get_Room_Participants_Controller,
  leave_Room_Controller,
  end_Meeting_Controller,
} = require("../controllers/room");

const router = express.Router();

// =====================================
//  Join Room Router
// =====================================

router.post("/join-room", authMiddleware, join_Room_Controller);

// =====================================
//  Create Room Router
// =====================================

router.post("/create-room", authMiddleware, create_Room_Controller);

// =====================================
// Get Room Participants Router
// =====================================

router.get("/:roomId/participants", authMiddleware,
  get_Room_Participants_Controller,
);


// =====================================
// Leave Meeting & Room Router
// =====================================

router.post("/leave-room", authMiddleware, leave_Room_Controller);

module.exports = router;


// =====================================
// End Meeting & Room Router
// =====================================

router.post("/end-meeting", authMiddleware, end_Meeting_Controller);

module.exports = router;
