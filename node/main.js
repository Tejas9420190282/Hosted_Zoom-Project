// main.js (Node)

const express = require("express");
require("dotenv").config();
const colors = require("colors");
const { mySqlPool } = require("./config/db");
const cors = require("cors");
const profile_Route = require("./routers/profile_Route.js");
const room_Route = require("./routers/room_Route.js");

const chat_Router = require("./routers/chat_Route.js");

const auth = require("./routers/auth_Router");
const { Server } = require("socket.io");

const app = express();

app.use(cors({ origin: "*" /* "http://localhost:5173" */, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", auth);

app.use("/api", profile_Route);

app.use("/api/room", room_Route);

app.use("/api/chat", chat_Router);

const PORT = process.env.PORT || 3000;

mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("Database connection successful".bgGreen);

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`.bgGreen);
    });

    const { initializeSocket } = require("./socket");

    initializeSocket(server);
  })
  .catch((err) => {
    console.error(`Database connection failed ${err}`.bgRed);
  });
