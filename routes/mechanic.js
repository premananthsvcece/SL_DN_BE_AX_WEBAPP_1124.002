import express from 'express';
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Create a new mechanic
router.post('/', async (req, res) => {
  try {
    const { mechanic_id, mechanic_name, phone, email, specialties } = req.body;
    await knex('mechanics').insert({
      mechanic_id,
      mechanic_name,
      phone,
      email,
      specialties: JSON.stringify(specialties) // Store array as JSON string
    });
    res.status(201).json({ message: 'Mechanic created successfully' });
  } catch (error) {
    console.log('Error creating mechanic:', error);
    res.status(400).json({ error: 'Error creating mechanic', details: error.message });
  }
});

// Get all mechanics
router.get('/', async (req, res) => {
  try {
    const mechanics = await knex('mechanics').select('*');
    // Parse specialties from JSON string to array
    mechanics.forEach(mechanic => {
      mechanic.specialties = JSON.parse(mechanic.specialties);
    });
    res.status(200).json(mechanics);
  } catch (error) {
    console.log('Error fetching mechanics:', error);
    res.status(500).json({ error: 'Error fetching mechanics', details: error.message });
  }
});

// Get a specific mechanic by ID
router.get('/:mechanic_id', async (req, res) => {
  try {
    const mechanic = await knex('mechanics').where('mechanic_id', req.params.mechanic_id).first();
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    mechanic.specialties = JSON.parse(mechanic.specialties); // Parse specialties
    res.status(200).json(mechanic);
  } catch (error) {
    console.log('Error fetching mechanic:', error);
    res.status(500).json({ error: 'Error fetching mechanic', details: error.message });
  }
});

// Update a mechanic by ID
router.put('/:mechanic_id', async (req, res) => {
  try {
    const { mechanic_name, phone, email, specialties } = req.body;
    const updated = await knex('mechanics')
      .where('mechanic_id', req.params.mechanic_id)
      .update({
        mechanic_name,
        phone,
        email,
        specialties: JSON.stringify(specialties) // Store array as JSON string
      });

    if (!updated) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.status(200).json({ message: 'Mechanic updated successfully' });
  } catch (error) {
    console.log('Error updating mechanic:', error);
    res.status(400).json({ error: 'Error updating mechanic', details: error.message });
  }
});

// Delete a mechanic by ID
router.delete('/:mechanic_id', async (req, res) => {
  try {
    const deleted = await knex('mechanics').where('mechanic_id', req.params.mechanic_id).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.status(200).json({ message: 'Mechanic deleted successfully' });
  } catch (error) {
    console.log('Error deleting mechanic:', error);
    res.status(500).json({ error: 'Error deleting mechanic', details: error.message });
  }
});

export default router;