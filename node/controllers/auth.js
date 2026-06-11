// node/controllers/auth.js (Controller)

const { mySqlPool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const colors = require("colors");

// =====================================
//  Register Controller
// =====================================

const register_Controller = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        console.log("Missing required fields".bgRed);
        
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const [existingUser] = await mySqlPool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
        console.log("User with this email already exists".bgRed);
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashPass = await bcrypt.hash(password, 10);

    const [result] = await mySqlPool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashPass],
    );

    console.log(`User registered successfully with email: ${email}`.bgGreen);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    });

  } catch (error) {
    console.error(`Error occurred while registering user: ${error}`);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================
//  Login Controller
// =====================================

const login_Controller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [existingUser] = await mySqlPool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length === 0) {
      console.log("Invalid email or password".bgRed);
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = existingUser[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid email or password".bgRed);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`User logged in successfully`.bgGreen);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user : {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error(`Error occurred while logging in user: ${error}`.bgRed);
    

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  register_Controller,
  login_Controller,
};
