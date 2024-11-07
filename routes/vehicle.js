import express from 'express';
import mongoose from 'mongoose';
import AppointmentsCollection from '../models/appointment.js';

const router = express.Router();

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const newAppointment = new AppointmentsCollection(req.body);
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ error: 'Error creating appointment', details: error.message });
  }
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await AppointmentsCollection.find();
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Error fetching appointments', details: error.message });
  }
});

// Get an appointment by vehicle_id
router.get('/:vehicleId', async (req, res) => {
  try {
    const appointments = await AppointmentsCollection.find({ vehicle_id: req.params.vehicleId });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for the given vehicle ID' });
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error finding appointments by vehicle ID:', error);
    res.status(500).json({ error: 'Error finding appointments', details: error.message });
  }
});

// Update an appointment by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedAppointment = await AppointmentsCollection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(400).json({ error: 'Error updating appointment', details: error.message });
  }
});

// Delete an appointment by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedAppointment = await AppointmentsCollection.findByIdAndDelete(req.params.id);

    if (!deletedAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Error deleting appointment', details: error.message });
  }
});

export default router;