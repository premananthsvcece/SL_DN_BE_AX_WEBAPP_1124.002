import express from 'express';
import Inventory from '../models/inventory.js';
import { generateInventoryId } from '../helpers/idGenerator.js';

const router = express.Router();

// Create a new inventory item
router.post('/', async (req, res) => {
  try {
    const inventoryId = await generateInventoryId();
    const inventoryItem = new Inventory({ ...req.body, inventory_id: inventoryId });
    await inventoryItem.save();
    res.status(201).json(inventoryItem);
  } catch (error) {
    res.status(400).json({ error: 'Error creating inventory item', details: error.message });
  }
});

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();
    res.status(200).json(inventoryItems);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory items', details: error.message });
  }
});

// Get a single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(inventoryItem);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory item', details: error.message });
  }
});

// Update an inventory item by ID
router.put('/:id', async (req, res) => {
  try {
    const inventoryItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(inventoryItem);
  } catch (error) {
    res.status(400).json({ error: 'Error updating inventory item', details: error.message });
  }
});

// Delete an inventory item by ID
router.delete('/:id', async (req, res) => {
  try {
    const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting inventory item', details: error.message });
  }
});

export default router;