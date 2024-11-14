// import dotenv from "dotenv";
// import express from "express";
// import knex from "knex";
// import cors from "cors";
// import vehicleRoutes from "./routes/vehicle.js";

// // Import route modules
// import customerRoutes from "./routes/customer.js";
// import authRoutes from "./routes/auth.js";
// import inventoryRoutes from "./routes/inventory.js";
// import jobCardRoutes from "./routes/jobCard.js";
// import appointmentRoutes from "./routes/appointment.js";
// import procurementRoutes from "./routes/procurement.js";
// import mechanicRoutes from "./routes/mechanic.js";
// import knexConfig from "./knexfile.js";

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Enable CORS for all origins
// app.use(cors());

// // Initialize Knex
// const db = knex(knexConfig);

// // Test the database connection
// db.raw('SELECT 1')
//   .then(() => console.log("MySQL connected via Knex"))
//   .catch((err) => console.error("MySQL connection error:", err));

// // Middleware
// app.use(express.json());

// // Routes
// app.use("/auth", authRoutes);
// app.use("/customer", customerRoutes);
// app.use("/inventory", inventoryRoutes);
// app.use("/vehicle", vehicleRoutes);
// app.use("/jobcard", jobCardRoutes);
// app.use("/appointment", appointmentRoutes);
// app.use("/procurement", procurementRoutes);
// app.use("/mechanic", mechanicRoutes);

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
// server.js
import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import knex from "knex";
import knexConfig from "./knexfile.js";
import initializeSocket from "./middleware/socket.io.js"; // Import the Socket.IO setup function

// Import route modules
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customer.js";
import inventoryRoutes from "./routes/inventory.js";
import appointmentRoutes from "./routes/appointment.js";
import procurementRoutes from "./routes/procurement.js";
import mechanicRoutes from "./routes/mechanic.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 9000;
const server = http.createServer(app); // Create HTTP server

// Enable CORS for all origins
app.use(cors());

// Initialize Knex
const db = knex(knexConfig);

// Test the database connection
db.raw("SELECT 1")
  .then(() => console.log("MySQL connected via Knex"))
  .catch((err) => console.error("MySQL connection error:", err));

// Middleware
app.use(express.json());

// Define API endpoint routes
app.use("/auth", authRoutes);
app.use("/customer", customerRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/appointment", appointmentRoutes);
app.use("/procurement", procurementRoutes);
app.use("/mechanic", mechanicRoutes);

// Simple test endpoint to verify the server is running
app.get("/api", (req, res) => {
  res.send({ message: "Hello from the Express server!" });
});

// Initialize Socket.IO by passing the server instance
initializeSocket(server);

// Start the server with both API and Socket.IO on the same port
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
