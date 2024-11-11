import express from 'express';
import Procurement from '../models/procurement.js';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Create a new procurement
router.post('/', async (req, res) => {
    try {
        const procurement = new Procurement(req.body);
        await procurement.save();
        res.status(201).json(procurement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all procurements
router.get('/', async (req, res) => {
    try {
        const procurements = await Procurement.find();
        res.json(procurements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a procurement by ID
router.get('/:id', async (req, res) => {
    try {
        const procurement = await Procurement.findById(req.params.id);
        if (!procurement) {
            return res.status(404).json({ message: 'Procurement not found' });
        }
        res.json(procurement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a procurement by ID
router.put('/:id', async (req, res) => {
    try {
        const procurement = await Procurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!procurement) {
            return res.status(404).json({ message: 'Procurement not found' });
        }
        res.json(procurement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a procurement by ID
router.delete('/:id', async (req, res) => {
    try {
        const procurement = await Procurement.findByIdAndDelete(req.params.id);
        if (!procurement) {
            return res.status(404).json({ message: 'Procurement not found' });
        }
        res.json({ message: 'Procurement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



export default router;