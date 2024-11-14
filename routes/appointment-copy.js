import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import {
  generateServiceId,
  generateAppointmentId,
} from "../helpers/idGenerator.js";

const knex = knexLib(knexConfig); // Initialize Knex with the configuration
const router = express.Router();

// Create a new appointment
router.post("/", async (req, res) => {
  try {
    const { vehicle_id } = req.body;

    // Check if there are any incomplete services for the given vehicle_id
    const existingAppointments = await knex("appointments")
      .join("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .where("appointments.vehicle_id", vehicle_id)
      .andWhere("services_actual.service_status", "!=", "Completed");

    if (existingAppointments.length > 0) {
      const AppointmentsArray = existingAppointments[0];
      return res.status(200).json({ error: "Cannot", AppointmentsArray });
    }

    // Generate a unique appointment ID
    const appointment_id = await generateAppointmentId();

    // Create a new appointment object with the provided data and generated ID
    const newAppointment = {
      ...req.body,
      appointment_id,
    };

    // Save the new appointment to the database
    await knex("appointments").insert(newAppointment);
    console.log("New appointment created:", newAppointment);
    const AppointmentsArray = newAppointment;
    res.status(201).json({ error: "Yes", AppointmentsArray });
  } catch (error) {
    console.log("Error creating appointment:", error);
    res
      .status(400)
      .json({ error: "Error creating appointment", details: error.message });
  }
});

// Add services to services_estimate
router.post("/:appointment_id/services_estimate", async (req, res) => {
  await addServices(req, res, "services_estimate");
});

// Add services to services_actual
router.post("/:appointment_id/services_actual", async (req, res) => {
  await addServices(req, res, "services_actual");
});

// Get all appointments with services and items required
router.get("/", async (req, res) => {
  try {
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.vehicle_id",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_id) as service_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_description) as service_descriptions'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.status) as service_statuses'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_status) as service_actual_statuses'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.price) as service_prices'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_type) as service_types'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.item_id) as item_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.item_name) as item_names'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.qty) as item_quantities'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.tax) as item_taxes'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.discount) as item_discounts')
      )
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .groupBy("appointments.appointment_id");

    const formattedAppointments = appointments.map(appointment => {
      const serviceIds = appointment.service_ids ? appointment.service_ids.split(',') : [];
      const serviceDescriptions = appointment.service_descriptions ? appointment.service_descriptions.split(',') : [];
      const serviceStatuses = appointment.service_statuses ? appointment.service_statuses.split(',') : [];
      const serviceActualStatuses = appointment.service_actual_statuses ? appointment.service_actual_statuses.split(',') : [];
      const servicePrices = appointment.service_prices ? appointment.service_prices.split(',') : [];
      const serviceTypes = appointment.service_types ? appointment.service_types.split(',') : [];
      const itemIds = appointment.item_ids ? appointment.item_ids.split(',') : [];
      const itemNames = appointment.item_names ? appointment.item_names.split(',') : [];
      const itemQuantities = appointment.item_quantities ? appointment.item_quantities.split(',') : [];
      const itemTaxes = appointment.item_taxes ? appointment.item_taxes.split(',') : [];
      const itemDiscounts = appointment.item_discounts ? appointment.item_discounts.split(',') : [];

      const servicesActual = serviceIds.map((id, index) => ({
        service_id: id,
        service_description: serviceDescriptions[index],
        status: serviceStatuses[index],
        service_status: serviceActualStatuses[index],
        price: parseFloat(servicePrices[index]),
        service_type: serviceTypes[index],
        items_required: itemIds.map((itemId, itemIndex) => ({
          item_id: itemId,
          item_name: itemNames[itemIndex],
          qty: itemQuantities[itemIndex],
          tax: itemTaxes[itemIndex],
          discount: itemDiscounts[itemIndex],
          _id: `item-${itemIndex}` // Generate a unique ID for each item
        }))
      }));

      return {
        _id: `appointment-${appointment.appointment_id}`, // Generate a unique ID for each appointment
        appointment_id: appointment.appointment_id,
        customer_id: appointment.customer_id,
        vehicle_id: appointment.vehicle_id,
        mechanic_id: appointment.mechanic_id,
        km: appointment.km,
        appointment_date: new Date(appointment.appointment_date).toISOString(),
        appointment_time: appointment.appointment_time,
        status: appointment.status,
        telecaller: appointment.telecaller,
        notes: appointment.notes,
        services_actual: servicesActual
      };
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching appointments", details: error.message });
  }
});

// Get a single appointment by appointment_id
router.get("/:appointment_id", async (req, res) => {
  try {
    const appointment = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.vehicle_id",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_id) as service_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_description) as service_descriptions'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.status) as service_statuses'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_status) as service_actual_statuses'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.price) as service_prices'),
        knex.raw('GROUP_CONCAT(DISTINCT services_actual.service_type) as service_types'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.item_id) as item_ids'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.item_name) as item_names'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.qty) as item_quantities'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.tax) as item_taxes'),
        knex.raw('GROUP_CONCAT(DISTINCT items_required.discount) as item_discounts')
      )
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .where("appointments.appointment_id", req.params.appointment_id)
      .groupBy("appointments.appointment_id")
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const serviceIds = appointment.service_ids ? appointment.service_ids.split(',') : [];
    const serviceDescriptions = appointment.service_descriptions ? appointment.service_descriptions.split(',') : [];
    const serviceStatuses = appointment.service_statuses ? appointment.service_statuses.split(',') : [];
    const serviceActualStatuses = appointment.service_actual_statuses ? appointment.service_actual_statuses.split(',') : [];
    const servicePrices = appointment.service_prices ? appointment.service_prices.split(',') : [];
    const serviceTypes = appointment.service_types ? appointment.service_types.split(',') : [];
    const itemIds = appointment.item_ids ? appointment.item_ids.split(',') : [];
    const itemNames = appointment.item_names ? appointment.item_names.split(',') : [];
    const itemQuantities = appointment.item_quantities ? appointment.item_quantities.split(',') : [];
    const itemTaxes = appointment.item_taxes ? appointment.item_taxes.split(',') : [];
    const itemDiscounts = appointment.item_discounts ? appointment.item_discounts.split(',') : [];

    const servicesActual = serviceIds.map((id, index) => ({
      service_id: id,
      service_description: serviceDescriptions[index],
      status: serviceStatuses[index],
      service_status: serviceActualStatuses[index],
      price: parseFloat(servicePrices[index]),
      service_type: serviceTypes[index],
      items_required: itemIds.map((itemId, itemIndex) => ({
        item_id: itemId,
        item_name: itemNames[itemIndex],
        qty: itemQuantities[itemIndex],
        tax: itemTaxes[itemIndex],
        discount: itemDiscounts[itemIndex],
        _id: `item-${itemIndex}` // Generate a unique ID for each item
      }))
    }));

    const formattedAppointment = {
      _id: `appointment-${appointment.appointment_id}`, // Generate a unique ID for each appointment
      appointment_id: appointment.appointment_id,
      customer_id: appointment.customer_id,
      vehicle_id: appointment.vehicle_id,
      mechanic_id: appointment.mechanic_id,
      km: appointment.km,
      appointment_date: new Date(appointment.appointment_date).toISOString(),
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      telecaller: appointment.telecaller,
      notes: appointment.notes,
      services_actual: servicesActual
    };

    res.status(200).json(formattedAppointment);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching appointment", details: error.message });
  }
});

// Update an appointment by appointment_id
router.put("/:appointment_id", async (req, res) => {
  try {
    const updated = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .update(req.body);

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    const appointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();
    res.status(200).json(appointment);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error updating appointment", details: error.message });
  }
});

// Delete an appointment by appointment_id
router.delete("/:appointment_id", async (req, res) => {
  try {
    const deleted = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .del();

    if (!deleted) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting appointment", details: error.message });
  }
});

// Helper function to add services
async function addServices(req, res, serviceType) {
  try {
    const services = req.body.services.map(service => ({
      ...service,
      appointment_id: req.params.appointment_id,
      service_id: generateServiceId()
    }));

    await knex(serviceType).insert(services);

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log(`Error adding services to ${serviceType}:`, error);
    res.status(400).json({
      error: `Error adding services to ${serviceType}`,
      details: error.message,
    });
  }
}

// Assign mechanic to appointment
router.post('/:appointment_id/assign_mechanic', async (req, res) => {
  const { mechanic_id } = req.body;
  try {
    const updated = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .update({ mechanic_id });

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    const appointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();
    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({
      error: "Error assigning mechanic",
      details: error.message,
    });
  }
});

// Update km of appointment
router.put('/:appointment_id/update_km', async (req, res) => {
  const { km } = req.body;
  try {
    const updated = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .update({ km });

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    const appointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();
    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({
      error: "Error updating km",
      details: error.message,
    });
  }
});

// Update each service status in services_actual by service_id
router.put('/:appointment_id/update_service_status/:service_id', async (req, res) => {
  const { service_status } = req.body;
  try {
    const updated = await knex("services_actual")
      .where("appointment_id", req.params.appointment_id)
      .andWhere("service_id", req.params.service_id)
      .update({ service_status });

    if (!updated) {
      return res.status(404).json({ error: "Service not found" });
    }
    const appointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();
    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({
      error: "Error updating service status",
      details: error.message,
    });
  }
});

export default router;