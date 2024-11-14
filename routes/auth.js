import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration

const knex = knexLib(knexConfig); // Initialize Knex with the configuration
const router = express.Router();
import {
  generateToken,
  hashPassword,
  comparePassword,
} from "../helpers/auth.js";
import { generateCustomId } from "../helpers/idGenerator.js";



// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, role, firstName, lastName, phone } = req.body;

    const passwordHash = await hashPassword(password);
    const userId = await generateCustomId("USER");

    await knex('UsersCollection').insert({
      user_id: userId,
      username,
      passwordHash,
      email,
      role,
      firstName,
      lastName,
      phone,
    });

    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).send({ error: "Registration failed", details: error.message });
  }
});
//get all users
router.get("/users", async (req, res) => {
  const users = await knex('UsersCollection').select('*');
  res.status(200).send(users);
});

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", { email });

    const user = await knex('UsersCollection').where({ email }).first();
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
    res.status(200).send({ token , user});
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).send({ error: "Login failed", details: error.message });
  }
});

// Update user by user ID
router.put("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, email, role, access } = req.body;

    const updateData = {};

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
    if (email) {
      updateData.email = email;
    }
    if (role) {
      updateData.role = role;
    }
    if (access !== undefined) {
      updateData.access = JSON.stringify(access); // Convert array to JSON string
    } else {
      updateData.access = JSON.stringify([]); // Default to an empty array if not provided
    }

    const updatedRows = await knex('UsersCollection')
      .where({ user_id: userId })
      .update(updateData);

    if (updatedRows) {
      res.status(200).send({ message: "User updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
});

export default router;