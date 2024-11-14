import express from 'express';
import knexLib from 'knex'; // Import the Knex library
import knexConfig from '../knexfile.js'; // Import your Knex configuration
import authenticateToken from '../middleware/authenticate.js';
import { body, validationResult } from 'express-validator';
import { generateCustomId } from '../helpers/idGenerator.js'; // Import generateCustomId

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();

// Create a new customer
router.post(
  '/',
  [
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
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const customerId = await generateCustomId('CUST');

      // Insert customer into the database
      await knex('customers').insert({
        customer_id: customerId,
        customer_name: req.body.customer_name,
        phone: req.body.contact.phone,
        street: req.body.contact.address.street,
        city: req.body.contact.address.city,
        state: req.body.contact.address.state,
      });

      // Insert vehicles into the database
      const vehicles = req.body.vehicles.map(vehicle => {
        let plateNumber = vehicle.plate_number;
        if (plateNumber === "For Registration") {
          const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit random number
          plateNumber = `For-Regn-${randomNum}`;
        }

        return {
          vehicle_id: plateNumber,
          customer_id: customerId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          plate_number: plateNumber,
        };
      });

      await knex('vehicles').insert(vehicles);

      res.status(201).send({ customer_id: customerId });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: 'Error creating customer', details: error.message });
    }
  }
);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await knex('customers')
      .leftJoin('vehicles', 'customers.customer_id', 'vehicles.customer_id')
      .select(
        'customers.customer_id',
        'customers.customer_name',
        'customers.phone',
        'customers.street as customer_street',
        'customers.city as customer_city',
        'customers.state as customer_state',
        'vehicles.vehicle_id',
        'vehicles.make',
        'vehicles.model',
        'vehicles.year',
        'vehicles.vin'
      );

    const formattedCustomers = customers.reduce((acc, curr) => {
      let customer = acc.find(c => c.customer_id === curr.customer_id);
      if (!customer) {
        customer = {
          customer_id: curr.customer_id,
          customer_name: curr.customer_name,
          contact: {
            phone: curr.phone,
            address: {
              street: curr.customer_street,
              city: curr.customer_city,
              state: curr.customer_state,
              zip: '',
            },
          },
          vehicles: [],
        };
        acc.push(customer);
      }
      if (curr.vehicle_id) {
        customer.vehicles.push({
          vehicle_id: curr.vehicle_id,
          make: curr.make,
          model: curr.model,
          year: curr.year,
          vin: curr.vin,
        });
      }
      return acc;
    }, []);

    res.status(200).send(formattedCustomers);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching customers', details: error.message });
  }
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await knex('customers')
      .leftJoin('vehicles', 'customers.customer_id', 'vehicles.customer_id')
      .select(
        'customers.customer_id',
        'customers.customer_name',
        'customers.phone',
        'customers.street as customer_street',
        'customers.city as customer_city',
        'customers.state as customer_state',
        'vehicles.vehicle_id',
        'vehicles.make',
        'vehicles.model',
        'vehicles.year',
        'vehicles.vin'
      )
      .where('customers.customer_id', req.params.id);

    if (customer.length === 0) {
      return res.status(404).send({ error: 'Customer not found' });
    }

    const formattedCustomer = {
      customer_id: customer[0].customer_id,
      customer_name: customer[0].customer_name,
      contact: {
        phone: customer[0].phone,
        address: {
          street: customer[0].customer_street,
          city: customer[0].customer_city,
          state: customer[0].customer_state,
          zip: '',
        },
      },
      vehicles: customer.map(vehicle => ({
        vehicle_id: vehicle.vehicle_id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
      })),
    };

    res.status(200).send(formattedCustomer);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching customer', details: error.message });
  }
});

// Update a customer by ID
router.put(
  '/:id',
  authenticateToken,
  [
    body('customer_name').optional().notEmpty().withMessage('Customer name is required'),
    body('contact.phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('contact.address.street').optional().notEmpty().withMessage('Street is required'),
    body('contact.address.city').optional().notEmpty().withMessage('City is required'),
    body('contact.address.state').optional().notEmpty().withMessage('State is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updated = await knex('customers')
        .where({ customer_id: req.params.id })
        .update(req.body);

      if (!updated) {
        return res.status(404).send({ error: 'Customer not found' });
      }
      res.status(200).send({ message: 'Customer updated' });
    } catch (error) {
      res.status(500).send({ error: 'Error updating customer', details: error.message });
    }
  }
);

// Delete a customer by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await knex('customers').where({ customer_id: req.params.id }).del();
    if (!deleted) {
      return res.status(404).send({ error: 'Customer not found' });
    }
    res.status(200).send({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).send({ error: 'Error deleting customer', details: error.message });
  }
});


// ADD A NEW VEHICLE TO A CUSTOMER BY CUSTOMER_ID /VEHICLES/CUSTOMER_ID
router.put('/vehicles/:customer_id', async (req, res) => {
  const customer_id = req.params.customer_id;
  const vehicleData = req.body.vehicles[0]; // Access the first vehicle in the array

  // Log the incoming data for debugging
  console.log("Received data:", { ...vehicleData, customer_id });

  // Check for required fields
  if (!vehicleData.vin || !vehicleData.plate_number) {
    return res.status(400).json({ error: "VIN and plate number are required" });
  }

  // Handle "For Registration" case
  let plateNumber = vehicleData.plate_number;
  if (plateNumber === "For Registration") {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit random number
    plateNumber = `For-Regn-${randomNum}`;
  }

  try {
    // Insert the new vehicle into the database
    const newVehicle = await knex('vehicles').insert({
      make: vehicleData.make,
      vehicle_id: plateNumber, // Use the modified plate number
      model: vehicleData.model,
      year: vehicleData.year,
      fuel_type: vehicleData.fuelType, // Assuming the database field is named `fuel_type`
      vin: vehicleData.vin,
      plate_number: plateNumber, // Use the modified plate number
      customer_id
    });

    console.log("Vehicle added successfully:", newVehicle);

    res.status(201).json({ message: "Vehicle added successfully", newVehicle });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({ error: "Error adding vehicle", details: error.message });
  }
});

export default router;