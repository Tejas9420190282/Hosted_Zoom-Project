// profile_Route.js

const { authMiddleware } = require("../middleware/auth_Middleware");
const colors = require("colors");
const { show_Profile_Controller } = require("../controllers/profile");
const express = require("express");

const router = express.Router();

// =====================================
//  Profile Router
// =====================================

router.get("/profile", authMiddleware,show_Profile_Controller);

module.exports = router;
