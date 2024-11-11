import express from 'express';
import Mechanic from '../models/mechanic.js';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Create a new mechanic
router.post('/', async (req, res) => {
  try {
    const newMechanic = new Mechanic(req.body);
    await newMechanic.save();
    res.status(201).json(newMechanic);
  } catch (error) {
    console.log('Error creating mechanic:', error);
    res.status(400).json({ error: 'Error creating mechanic', details: error.message });
  }
});

// Get all mechanics
router.get('/', async (req, res) => {
  try {
    const mechanics = await Mechanic.find();
    res.status(200).json(mechanics);
  } catch (error) {
    console.log('Error fetching mechanics:', error);
    res.status(500).json({ error: 'Error fetching mechanics', details: error.message });
  }
});

// Get a specific mechanic by ID
router.get('/:mechanic_id', async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ mechanic_id: req.params.mechanic_id });
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.status(200).json(mechanic);
  } catch (error) {
    console.log('Error fetching mechanic:', error);
    res.status(500).json({ error: 'Error fetching mechanic', details: error.message });
  }
});

// Update a mechanic by ID
router.put('/:mechanic_id', async (req, res) => {
  try {
    const updatedMechanic = await Mechanic.findOneAndUpdate(
      { mechanic_id: req.params.mechanic_id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.status(200).json(updatedMechanic);
  } catch (error) {
    console.log('Error updating mechanic:', error);
    res.status(400).json({ error: 'Error updating mechanic', details: error.message });
  }
});

// Delete a mechanic by ID
router.delete('/:mechanic_id', async (req, res) => {
  try {
    const deletedMechanic = await Mechanic.findOneAndDelete({ mechanic_id: req.params.mechanic_id });
    if (!deletedMechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    res.status(200).json({ message: 'Mechanic deleted successfully' });
  } catch (error) {
    console.log('Error deleting mechanic:', error);
    res.status(500).json({ error: 'Error deleting mechanic', details: error.message });
  }
});

export default router;