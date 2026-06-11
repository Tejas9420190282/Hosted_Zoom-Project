// middlewares/auth_Middleware.js
/* 
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {

    console.log(`AUTH HEADER: ${req.headers.authorization}`.bgBlue);

    const token = req.headers.authorization?.split(" ")[1];

    console.log("TOKEN:", token.bgblue);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
      console.log("DECODED:", decoded.bgGreen);
    req.user = decoded;

    next();

  } catch (error) {

     console.log("JWT ERROR:", error.message.bgRed);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

exports.authMiddleware = authMiddleware; */

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("TOKEN:", token);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("DECODED:", decoded);

    req.user = decoded;

    next();

  } catch (error) {

    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = {
  authMiddleware,
};