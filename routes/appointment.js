import express from 'express';
import AppointmentsCollection from '../models/appointment.js';
import { generateServiceId, generateAppointmentId } from '../helpers/idGenerator.js';

const router = express.Router();

// router.post('/', async (req, res) => {
//   try {
//     // Generate a unique appointment ID
//     const appointment_id = await generateAppointmentId();

//     // Create a new appointment object with the provided data and generated ID
//     const newAppointment = new AppointmentsCollection({
//       ...req.body,
//       appointment_id,
//     });
//     // console.log(req.body);

//     // Save the new appointment to the database
//     await newAppointment.save();

//     // Respond with the created appointment
//     res.status(201).json(newAppointment);
//   } catch (error) {
//     console.log('Error creating appointment:', error);
//     res.status(400).json({ error: 'Error creating appointment', details: error.message });
//   }
// });

router.post('/', async (req, res) => {
  try {
    const { vehicle_id } = req.body;

    // Check if there are any incomplete services for the given vehicle_id
    const existingAppointments = await AppointmentsCollection.find({
      vehicle_id,
      'services_actual.service_status': { $ne: 'Completed' }
    });

    if (existingAppointments.length > 0) {
      const AppointmentsArray = existingAppointments[0];
      // console.log('Existing appointments:', existingAppointments);
      return res.status(200).json({ error: 'Cannot', AppointmentsArray } );
    }

    // Generate a unique appointment ID
    const appointment_id = await generateAppointmentId();

    // Create a new appointment object with the provided data and generated ID
    const newAppointment = new AppointmentsCollection({
      ...req.body,
      appointment_id,
    });

    // Save the new appointment to the database
    await newAppointment.save();
    console.log('New appointment created:', newAppointment);
    const AppointmentsArray = newAppointment;
    // Respond with the created appointment
    res.status(201).json({ error: 'Yes', AppointmentsArray });
  } catch (error) {
    console.log('Error creating appointment:', error);
    res.status(400).json({ error: 'Error creating appointment', details: error.message });
  }
});
// Add services to services_estimate
router.post('/:appointment_id/services_estimate', async (req, res) => {
  try {
    // Log the incoming request data
    console.log('Incoming request data:', JSON.stringify(req.body, null, 2));

    const services = req.body; // Assuming an array of services is sent

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'No services provided' });
    }

    const appointment = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    for (const service of services) {
      const { service_description, price, items_required, status } = service;

      // Log the service data being processed
      console.log('Processing service:', JSON.stringify(service, null, 2));

      // Validate required fields
      if (!service_description || !price || !status || !Array.isArray(items_required) || items_required.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: service_description, price, status, or items_required' });
      }

      // Validate enum values
      const validStatuses = ['approved', 'pending', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
      }

      const service_id = await generateServiceId();

      await AppointmentsCollection.updateOne(
        { appointment_id: req.params.appointment_id },
        {
          $push: {
            services_estimate: { service_id, service_description, price, items_required, status }
          }
        }
      );
    }

    const updatedAppointment = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id });
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log('Error adding services to services_estimate:', error);
    res.status(400).json({ error: 'Error adding services to services_estimate', details: error.message });
  }
});



// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await AppointmentsCollection.find();
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointments', details: error.message });
  }
});

// Get a single appointment by appointment_id
router.get('/:appointment_id', async (req, res) => {
  try {
    const appointment = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching appointment', details: error.message });
  }
});

// Update an appointment by appointment_id
router.put('/:appointment_id', async (req, res) => {
  try {
    const appointment = await AppointmentsCollection.findOneAndUpdate(
      { appointment_id: req.params.appointment_id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Error updating appointment', details: error.message });
  }
});

// Delete an appointment by appointment_id
router.delete('/:appointment_id', async (req, res) => {
  try {
    const appointment = await AppointmentsCollection.findOneAndDelete({ appointment_id: req.params.appointment_id });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting appointment', details: error.message });
  }
});



// Middleware to parse JSON bodies
router.use(express.json());

// Helper function to add services
async function addServices(req, res, serviceType) {
  try {
    // Log the incoming request data
    console.log(`Incoming request data for ${serviceType}:`, JSON.stringify(req.body, null, 2));

    const services = req.body; // Assuming an array of services is sent

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'No services provided' });
    }

    const appointment = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    for (const service of services) {
      const { service_description, price, items_required, status } = service;

      // Log the service data being processed
      console.log(`Processing service for ${serviceType}:`, JSON.stringify(service, null, 2));

      // Validate required fields
      if (!service_description || !price || !status || !Array.isArray(items_required) || items_required.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: service_description, price, status, or items_required' });
      }

      // Validate enum values
      const validStatuses = ['approved', 'pending', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
      }

      const service_id = await generateServiceId();

      await AppointmentsCollection.updateOne(
        { appointment_id: req.params.appointment_id },
        {
          $push: {
            [serviceType]: { service_id, service_description, price, items_required, status, service_type }
          }
        }
      );
    }

    const updatedAppointment = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id });
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log(`Error adding services to ${serviceType}:`, error);
    res.status(400).json({ error: `Error adding services to ${serviceType}`, details: error.message });
  }
}

// Add services to services_estimate
router.post('/:appointment_id/services_estimate', (req, res) => {
  addServices(req, res, 'services_estimate');
});

// Add services to services_actual
router.post('/:appointment_id/services_actual', (req, res) => {
  addServices(req, res, 'services_actual');
});

//get services_actual data by appoinment id
router.get('/:appointment_id/services_actual', async (req, res) => {
  const services = await AppointmentsCollection.findOne({ appointment_id: req.params.appointment_id }, { services_actual: 1 });
  res.status(200).json(services);
});

export default router;
