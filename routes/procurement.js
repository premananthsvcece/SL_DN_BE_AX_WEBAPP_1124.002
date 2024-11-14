import express from 'express';
import knexLib from "knex"; // Import the Knex library
import { generatePrNo } from '../helpers/idGenerator.js';
import knexConfig from "../knexfile.js"; // Import your Knex configuration

// Initialize Knex with the configuration
const knex = knexLib(knexConfig);

const router = express.Router();

// Ensure JSON bodies are parsed
router.use(express.json());

// Create a new procurement
router.post('/', async (req, res) => {
  try {
    const {
      telecaller,
      status,
      appointment_time,
      appointment_date,
      mechanic_id,
      vehicle_id,
      customer_id,
      appointment_id,
      services = []
    } = req.body;

    // Check for required fields
    if (![appointment_id, customer_id, vehicle_id, mechanic_id, appointment_date, appointment_time, status, telecaller].every(Boolean)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Insert procurement data
    await knex('procurements').insert({
      appointment_id,
      customer_id,
      vehicle_id,
      mechanic_id,
      appointment_date,
      appointment_time,
      status,
      telecaller,
      notes: req.body.notes || ''
    }).onConflict('appointment_id').merge();

    // Insert or update services data into procurement_services table
    for (let service of services) {
      const pr_no = req.body.pr_no || await generatePrNo();

      await knex.raw(`
        INSERT INTO procurement_services (appointment_id, service_id, service_description, price, quantity, pr_no)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          service_description = VALUES(service_description),
          price = VALUES(price),
          quantity = VALUES(quantity),
          pr_no = VALUES(pr_no)
      `, [
        appointment_id,
        service.service_id,
        service.reportedIssue,
        service.price,
        service.qty,
        pr_no
      ]);

      // Update pr_no in services_actual table
      await knex('services_actual')
        .where('appointment_id', appointment_id)
        .andWhere('service_id', service.service_id)
        .update({ pr_no });
    }

    res.status(201).json({ message: "Procurement inserted or updated successfully" });
  } catch (error) {
    console.error('Error creating or updating procurement:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all procurements
router.get('/', async (req, res) => {
  try {
    const procurementsData = await knex('procurements')
      .select(
        'procurements.appointment_id',
        'procurements.customer_id',
        'procurements.vehicle_id',
        'procurements.mechanic_id',
        'procurements.appointment_date',
        'procurements.appointment_time',
        'procurements.status',
        'procurements.telecaller',
        'procurements.notes',
        'procurement_services.service_id',
        'procurement_services.service_description',
        'procurement_services.price',
        'procurement_services.pr_no',
        'items_required.item_id',
        'items_required.item_name'
      )
      .leftJoin('procurement_services', 'procurements.appointment_id', 'procurement_services.appointment_id')
      .leftJoin('items_required', 'procurement_services.service_id', 'items_required.service_id');

    const procurementsMap = {};

    procurementsData.forEach(row => {
      if (!procurementsMap[row.appointment_id]) {
        procurementsMap[row.appointment_id] = {
          _id: `procurement-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          vehicle_id: row.vehicle_id,
          mechanic_id: row.mechanic_id,
          services: [],
          appointment_date: new Date(row.appointment_date).toISOString(),
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes
        };
      }

      const procurement = procurementsMap[row.appointment_id];

      let service = procurement.services.find(s => s.service_id === row.service_id);
      if (!service) {
        service = {
          service_id: row.service_id,
          service_description: row.service_description,
          price: row.price,
          pr_no: row.pr_no,
          items_required: [],
          status: 'approved' // Assuming status is approved, adjust as needed
        };
        procurement.services.push(service);
      }

      if (row.inventory_id) {
        service.items_required.push({
          inventory_id: row.inventory_id,
          part_name: row.part_name
        });
      }
    });

    res.json(Object.values(procurementsMap));
  } catch (error) {
    console.error('Error fetching procurements:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a procurement by ID
router.get('/:id', async (req, res) => {
  try {
    const procurementData = await knex('procurements')
      .select(
        'procurements.appointment_id',
        'procurements.customer_id',
        'procurements.vehicle_id',
        'procurements.mechanic_id',
        'procurements.appointment_date',
        'procurements.appointment_time',
        'procurements.status',
        'procurements.telecaller',
        'procurements.notes',
        'procurement_services.service_id',
        'procurement_services.service_description',
        'procurement_services.price',
        'procurement_services.pr_no',
        'items_required.inventory_id',
        'items_required.part_name'
      )
      .leftJoin('procurement_services', 'procurements.appointment_id', 'procurement_services.appointment_id')
      .leftJoin('items_required', 'procurement_services.service_id', 'items_required.service_id')
      .where('procurements.appointment_id', req.params.id);

    if (procurementData.length === 0) {
      return res.status(404).json({ message: 'Procurement not found' });
    }

    const procurement = {
      _id: `procurement-${procurementData[0].appointment_id}`,
      appointment_id: procurementData[0].appointment_id,
      customer_id: procurementData[0].customer_id,
      vehicle_id: procurementData[0].vehicle_id,
      mechanic_id: procurementData[0].mechanic_id,
      services: [],
      appointment_date: new Date(procurementData[0].appointment_date).toISOString(),
      appointment_time: procurementData[0].appointment_time,
      status: procurementData[0].status,
      telecaller: procurementData[0].telecaller,
      notes: procurementData[0].notes
    };

    const serviceMap = {};

    procurementData.forEach(row => {
      if (!serviceMap[row.service_id]) {
        serviceMap[row.service_id] = {
          service_id: row.service_id,
          service_description: row.service_description,
          price: row.price,
          pr_no: row.pr_no,
          items_required: [],
          status: 'approved' // Assuming status is approved, adjust as needed
        };
        procurement.services.push(serviceMap[row.service_id]);
      }

      if (row.inventory_id) {
        serviceMap[row.service_id].items_required.push({
          inventory_id: row.inventory_id,
          part_name: row.part_name
        });
      }
    });

    res.json(procurement);
  } catch (error) {
    console.error('Error fetching procurement:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a procurement by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await knex('procurements').where('appointment_id', req.params.id).update(req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Procurement not found' });
    }
    res.json({ message: 'Procurement updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a procurement by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await knex('procurements').where('appointment_id', req.params.id).del();
    if (!deleted) {
      return res.status(404).json({ message: 'Procurement not found' });
    }
    res.json({ message: 'Procurement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;