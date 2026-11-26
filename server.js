
require("dotenv").config();

const express = require("express");
const http = require("http");
const connectDB = require("./db");
const cors = require("cors");
const router = require("./router/router");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("API working");
});

app.use("/api", router);

const PORT = process.env.PORT || 3002;

// Start server only after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

startServer();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
