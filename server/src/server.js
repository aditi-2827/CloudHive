require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "cloudhive-api", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);

// Later modules: /api/files, /api/admin

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CloudHive API listening on http://localhost:${PORT}`);
});

module.exports = app;
