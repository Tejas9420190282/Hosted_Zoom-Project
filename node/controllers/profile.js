//  node/controllers/Profile.js

const { mySqlPool } = require("../config/db");

// =====================================
// Show Profile Controller
// =====================================

const show_Profile_Controller = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user] = await mySqlPool.query(
      `SELECT id, name, email, created_at
        FROM users WHERE id = ?`,
      [userId],
    );

    if (user.length === 0) {
      console.log("User not found".bgRed);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `Profile retrieved successfully for user ID: ${userId}`.bgGreen,
    );

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      user: user[0],
    });
  } catch (error) {
    console.error(`Error occurred while showing profile: ${error}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.show_Profile_Controller = show_Profile_Controller;
