import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import vehicleRoutes from "./routes/vehicle.js";

// Import route modules

import customerRoutes from "./routes/customer.js";
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import jobCardRoutes from "./routes/jobCard.js";
import appointmentRoutes from "./routes/appointment.js";
import procurementRoutes from "./routes/procurement.js";
import mechanicRoutes from "./routes/mechanic.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());

// Routes

app.use("/auth", authRoutes);
app.use("/customer", customerRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/vehicle", vehicleRoutes);
app.use("/jobcard", jobCardRoutes);
app.use("/appointment", appointmentRoutes);
app.use("/procurement", procurementRoutes);
app.use("/mechanic", mechanicRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
