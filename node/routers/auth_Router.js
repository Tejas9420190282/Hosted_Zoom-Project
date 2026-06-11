
//  node/routers/auth_Router.js

const express = require("express");
const { login_Controller, register_Controller } = require("../controllers/auth");

const router = express.Router();

// =====================================
//  Login Router
// =====================================

router.post("/login" , login_Controller);


// =====================================
//  Register Router
// =====================================

router.post("/register" , register_Controller);

module.exports = router;