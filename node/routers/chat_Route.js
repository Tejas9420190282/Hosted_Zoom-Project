
// chat_Route.js

const express = require("express");
const { chatController } = require("../controllers/chat");
const { authMiddleware } = require("../middleware/auth_Middleware");

const router = express.Router();

// =====================================
//  Chat Message Router
// =====================================

router.get("/:roomId/messages", authMiddleware, chatController);

module.exports = router;

