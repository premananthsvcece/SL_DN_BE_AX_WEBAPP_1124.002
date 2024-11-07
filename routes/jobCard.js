import express from 'express';
import mongoose from 'mongoose';
import AppointmentsCollection from '../models/appointment.js';

const router = express.Router();

// Update services in an existing appointment based on vehicle_id
router.post('/', async (req, res) => {
  try {
    // Log the incoming request data
    console.log('Incoming request data:', JSON.stringify(req.body, null, 2));

    // Find the appointment by vehicle_id
    const appointment = await AppointmentsCollection.findOne({ vehicle_id: req.body.vehicleId });

    if (!appointment) {
      console.log('Appointment not found for vehicle ID:', req.body.vehicleId);
      return res.status(404).json({ error: 'Appointment not found for the given vehicle ID' });
    }

    // Update the services field with all details from estimateItems
    appointment.services = req.body.estimateItems.map(item => ({
      service_id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for each service
      description: item.description || '', // Ensure default value if undefined
      spareList: item.spareList || '', // Ensure default value if undefined
      qty: item.qty || 0, // Ensure default value if undefined
      rate: item.rate || 0, // Ensure default value if undefined
      discount: parseFloat(item.discount) || 0, // Ensure discount is a number
      price: item.estimatedAmount || 0 // Ensure default value if undefined
    }));

    // Log the updated services data
    console.log('Updated services data:', JSON.stringify(appointment.services, null, 2));

    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error updating appointment services:', error);
    res.status(400).json({ error: 'Error updating appointment services', details: error.message });
  }
});

// Other CRUD operations remain unchanged...

export default router;