import express from "express";
import User from "../models/auth.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
} from "../helpers/auth.js";
import { generateCustomId } from "../helpers/idGenerator.js";

const router = express.Router();

// Register a new user
const MIN_PASSWORD_LENGTH = 8; // Minimum length for password
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character

router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const passwordHash = await hashPassword(password);
    const userId = await generateCustomId("USER"); // Generate custom ID
    const user = new User({ user_id: userId, username, passwordHash, email });
    await user.save();
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(400)
      .send({ error: "Registration failed", details: error.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", { email });

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log("Login successful for user:", email);
    res.status(200).send({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).send({ error: "Login failed", details: error.message });
  }
});

export default router;
