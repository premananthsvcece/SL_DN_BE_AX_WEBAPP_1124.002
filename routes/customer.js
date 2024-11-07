import express from 'express';
import Customer from '../models/Customer.js';
import authenticateToken from '../middleware/middleware.js';
import VehicleCollection from '../models/vehicle.js'; // Import VehicleCollection
import { body, validationResult } from 'express-validator';
import { generateCustomId, generateVehicleId } from '../helpers/idGenerator.js'; // Import generateVehicleId

const router = express.Router();






// Create a new customer
router.post(
  '/',
  
  authenticateToken,
  [
    // body('name.first').notEmpty().withMessage('First name is required'),
    // body('name.last').notEmpty().withMessage('Last name is required'),
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('contact.phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('contact.address.street').notEmpty().withMessage('Street is required'),
    body('contact.address.city').notEmpty().withMessage('City is required'),
    body('contact.address.state').notEmpty().withMessage('State is required'),
    body('vehicles').isArray().withMessage('Vehicles must be an array'),
    body('vehicles.*.make').notEmpty().withMessage('Vehicle make is required'),
    body('vehicles.*.model').notEmpty().withMessage('Vehicle model is required'),
    body('vehicles.*.year').isInt({ min: 1886 }).withMessage('Valid vehicle year is required'),
    body('vehicles.*.vin').notEmpty().withMessage('Vehicle VIN is required'),
    body('vehicles.*.plate_number').notEmpty().withMessage('Vehicle plate number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customerId = await generateCustomId('CUST');

      // Generate vehicle IDs for each vehicle
      const vehiclesWithIds = await Promise.all(req.body.vehicles.map(async (vehicle) => {
        const vehicleId = vehicle.plate_number ;
        return { ...vehicle, vehicle_id: vehicleId };
      }));

      const customer = new Customer({ ...req.body, customer_id: customerId, vehicles: vehiclesWithIds });
      await customer.save();

      // Save each vehicle to VehicleCollection
      await Promise.all(vehiclesWithIds.map(async (vehicle) => {
        const vehicleData = {
          vehicle_id: vehicle.vehicle_id,
          customer_id: customerId,
          plate_number: vehicle.plate_number,
        };
        const vehicleEntry = new VehicleCollection(vehicleData);
        await vehicleEntry.save();
      }));

      res.status(201).send(customer);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: 'Error creating customer', details: error.message });
    }
  }
);

// ... existing code ...

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).send(customers);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching customers', details: error.message });
  }
});

// Get a single customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customer_id: req.params.id });
    if (!customer) {
      return res.status(404).send({ error: 'Customer not found' });
    }
    res.status(200).send(customer);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching customer', details: error.message });
  }
});

// Update a customer by ID
router.put(
  '/:id',
  authenticateToken,
  [
    body('name.first').optional().notEmpty().withMessage('First name is required'),
    body('name.last').optional().notEmpty().withMessage('Last name is required'),
    body('contact.phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('contact.email').optional().isEmail().withMessage('Valid email is required'),
    body('contact.address.street').optional().notEmpty().withMessage('Street is required'),
    body('contact.address.city').optional().notEmpty().withMessage('City is required'),
    body('contact.address.state').optional().notEmpty().withMessage('State is required'),
    body('contact.address.zip').optional().notEmpty().withMessage('ZIP code is required'),
    body('vehicles').optional().isArray().withMessage('Vehicles must be an array'),
    body('vehicles.*.make').optional().notEmpty().withMessage('Vehicle make is required'),
    body('vehicles.*.model').optional().notEmpty().withMessage('Vehicle model is required'),
    body('vehicles.*.year').optional().isInt({ min: 1886 }).withMessage('Valid vehicle year is required'),
    body('vehicles.*.vin').optional().notEmpty().withMessage('Vehicle VIN is required'),
    body('vehicles.*.plate_number').optional().notEmpty().withMessage('Vehicle plate number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customer = await Customer.findOneAndUpdate({ customer_id: req.params.id }, req.body, { new: true, runValidators: true });
      if (!customer) {
        return res.status(404).send({ error: 'Customer not found' });
      }
      res.status(200).send(customer);
    } catch (error) {
      res.status(500).send({ error: 'Error updating customer', details: error.message });
    }
  }
);

// Update customer's vehicles by ID
router.put('/vehicles/:id/', authenticateToken, 
  [
    body('vehicles').isArray().withMessage('Vehicles must be an array'),
    body('vehicles.*.make').optional().notEmpty().withMessage('Vehicle make is required'),
    body('vehicles.*.model').optional().notEmpty().withMessage('Vehicle model is required'),
    body('vehicles.*.year').optional().isInt({ min: 1886 }).withMessage('Valid vehicle year is required'),
    body('vehicles.*.vin').optional().notEmpty().withMessage('Vehicle VIN is required'),
    body('vehicles.*.plate_number').optional().notEmpty().withMessage('Vehicle plate number is required'),
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find the customer by ID
      const customer = await Customer.findOne({ customer_id: req.params.id });
      if (!customer) {
        return res.status(404).send({ error: 'Customer not found' });
      }

      // Add vehicle IDs for new vehicles
      const vehiclesWithIds = await Promise.all(req.body.vehicles.map(async (vehicle) => {
        const vehicleId = vehicle.plate_number; // Use plate_number as the vehicle ID
        return { ...vehicle, vehicle_id: vehicleId };
      }));

      // Loop through the incoming vehicles
      await Promise.all(vehiclesWithIds.map(async (vehicle) => {
        // Check if the vehicle already exists in the customer's vehicle list
        const existingVehicle = customer.vehicles.find(v => v.plate_number === vehicle.plate_number);

        if (existingVehicle) {
          // If the vehicle exists, update its data
          existingVehicle.make = vehicle.make || existingVehicle.make;
          existingVehicle.model = vehicle.model || existingVehicle.model;
          existingVehicle.year = vehicle.year || existingVehicle.year;
          existingVehicle.vin = vehicle.vin || existingVehicle.vin;
          existingVehicle.plate_number = vehicle.plate_number || existingVehicle.plate_number;
        } else {
          // If the vehicle doesn't exist, add it to the customer's vehicle list
          customer.vehicles.push(vehicle);
        }

        // Now, add/update the vehicle in the VehicleCollection
        const vehicleEntry = await VehicleCollection.findOne({ plate_number: vehicle.plate_number, customer_id: customer.customer_id });
        if (vehicleEntry) {
          // Update existing vehicle in VehicleCollection
          vehicleEntry.make = vehicle.make;
          vehicleEntry.model = vehicle.model;
          vehicleEntry.year = vehicle.year;
          vehicleEntry.vin = vehicle.vin;
          await vehicleEntry.save();
        } else {
          // Add new vehicle to VehicleCollection if it doesn't exist
          const newVehicleEntry = new VehicleCollection({
            vehicle_id: vehicle.vehicle_id,
            customer_id: customer.customer_id,
            plate_number: vehicle.plate_number,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
          });
          await newVehicleEntry.save();
        }
      }));

      // Save updated customer object with updated vehicles list
      await customer.save();

      // Respond with updated customer data
      res.status(200).send(customer);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: 'Error updating vehicles', details: error.message });
    }
  }
);


// Delete a customer by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ customer_id: req.params.id });
    if (!customer) {
      return res.status(404).send({ error: 'Customer not found' });
    }
    res.status(200).send({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).send({ error: 'Error deleting customer', details: error.message });
  }
});

export default router;