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

    // Check if there are any appointments for the given vehicle_id that are not completed
    const existingAppointments = await knex("appointments")
      .where("vehicle_id", vehicle_id)
      .andWhere("status", "!=", "Completed");

    if (existingAppointments.length > 0) {
      const AppointmentsArray = existingAppointments[0];
      // console.log(AppointmentsArray);
      return res.status(400).json({error: "Cannot", AppointmentsArray});
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
    res.status(200).json({ message: "Appointment created successfully", AppointmentsArray: newAppointment });
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
// Fetch and format all appointments with services and items required
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
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.discount"
      )
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .orderBy("appointments.appointment_id");

    const formattedAppointments = [];
    const appointmentMap = {};

    appointments.forEach((row) => {
      if (!appointmentMap[row.appointment_id]) {
        appointmentMap[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          vehicle_id: row.vehicle_id,
          mechanic_id: row.mechanic_id,
          km: row.km,
          appointment_date: new Date(row.appointment_date).toISOString(),
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          services_actual: [],
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id
      );

      if (!service) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      if (row.item_id) {
        service.items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name,
          qty: row.qty,
          tax: row.tax,
          discount: row.discount,
        });
      }
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.log("Error fetching appointments:", error);
    res.status(500).json({
      error: "Error fetching appointments",
      details: error.message,
    });
  }
});

// // Get a single appointment by appointment_id
// router.get("/:appointment_id", async (req, res) => {
//   try {
//     const appointmentData = await knex("appointments")
//       .select(
//         "appointments.appointment_id",
//         "appointments.customer_id",
//         "appointments.vehicle_id",
//         "appointments.mechanic_id",
//         "appointments.km",
//         "appointments.appointment_date",
//         "appointments.appointment_time",
//         "appointments.status",
//         "appointments.telecaller",
//         "appointments.notes",
//         "services_actual.service_id",
//         "services_actual.service_description",
//         "services_actual.status as service_status",
//         "services_actual.service_status as service_actual_status",
//         "services_actual.price",
//         "services_actual.service_type",
//         "items_required.item_id",
//         "items_required.item_name",
//         "items_required.qty",
//         "items_required.tax",
//         "items_required.discount",
//       )
//       .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
//       .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
//       .where("appointments.appointment_id", req.params.appointment_id);

//     if (appointmentData.length === 0) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = {
//       _id: `appointment-${appointmentData[0].appointment_id}`,
//       appointment_id: appointmentData[0].appointment_id,
//       customer_id: appointmentData[0].customer_id,
//       vehicle_id: appointmentData[0].vehicle_id,
//       mechanic_id: appointmentData[0].mechanic_id,
//       km: appointmentData[0].km,
//       appointment_date: new Date(appointmentData[0].appointment_date).toISOString(),
//       appointment_time: appointmentData[0].appointment_time,
//       status: appointmentData[0].status,
//       telecaller: appointmentData[0].telecaller,
//       notes: appointmentData[0].notes,
//       services_actual: [],
//     };

//     const serviceMap = {};

//     appointmentData.forEach((row) => {
//       if (!serviceMap[row.service_id]) {
//         serviceMap[row.service_id] = {
//           _id: `service-${row.service_id}`,
//           service_id: row.service_id,
//           service_description: row.service_description,
//           status: row.service_status,
//           service_status: row.service_actual_status,
//           price: row.price,
//           service_type: row.service_type,
//           items_required: [],
//         };
//         appointment.services_actual.push(serviceMap[row.service_id]);
//       }

//       if (row.item_id) {
//         serviceMap[row.service_id].items_required.push({
//           _id: `item-${row.item_id}`,
//           item_id: row.item_id,
//           item_name: row.item_name,
//           qty: row.qty,
//           tax: row.tax,
//           discount: row.discount,
//         });
//       }
//     });

//     res.status(200).json(appointment);
//   } catch (error) {
//     console.log("Error fetching appointment:", error);
//     res.status(500).json({
//       error: "Error fetching appointment",
//       details: error.message,
//     });
//   }
// });

// Get a single appointment by appointment_id
router.get("/:appointment_id", async (req, res) => {
  try {
    const appointmentData = await knex("appointments")
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
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.discount",
        "procurement_services.pr_no" // Include pr_no from procurement_services
      )
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .leftJoin("procurement_services", function() {
        this.on("services_actual.service_id", "=", "procurement_services.service_id")
          .andOn("appointments.appointment_id", "=", "procurement_services.appointment_id");
      })
      .where("appointments.appointment_id", req.params.appointment_id);

    if (appointmentData.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = {
      _id: `appointment-${appointmentData[0].appointment_id}`,
      appointment_id: appointmentData[0].appointment_id,
      customer_id: appointmentData[0].customer_id,
      vehicle_id: appointmentData[0].vehicle_id,
      mechanic_id: appointmentData[0].mechanic_id,
      km: appointmentData[0].km,
      appointment_date: new Date(appointmentData[0].appointment_date).toISOString(),
      appointment_time: appointmentData[0].appointment_time,
      status: appointmentData[0].status,
      telecaller: appointmentData[0].telecaller,
      notes: appointmentData[0].notes,
      services_actual: [],
    };

    const serviceMap = {};

    appointmentData.forEach((row) => {
      if (!serviceMap[row.service_id]) {
        serviceMap[row.service_id] = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          pr_no: row.pr_no || null, // Include pr_no if it exists
          items_required: [],
        };
        appointment.services_actual.push(serviceMap[row.service_id]);
      }

      if (row.item_id) {
        serviceMap[row.service_id].items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name,
          qty: row.qty,
          tax: row.tax,
          discount: row.discount,
        });
      }
    });

    res.status(200).json(appointment);
  } catch (error) {
    console.log("Error fetching appointment:", error);
    res.status(500).json({
      error: "Error fetching appointment",
      details: error.message,
    });
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

// Helper function to add or update services and their items using Knex.js
// Helper function to add or update services and their items using Knex.js
async function addServices(req, res, serviceType) {
  try {
    const services = req.body; // Assuming an array of services is sent

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "No services provided" });
    }

    for (const service of services) {
      let {
        service_id,
        service_description,
        price,
        items_required,
        status,
        service_type,
        service_status,
      } = service;

      // Validate required fields
      if (
        !service_description ||
        !price ||
        !status ||
        !Array.isArray(items_required) ||
        items_required.length === 0
      ) {
        return res.status(400).json({
          error:
            "Missing required fields: service_description, price, status, or items_required",
        });
      }

      // Validate enum values
      const validStatuses = ["approved", "pending", "rejected", "saved", "released"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status value. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      if (service_id) {
        // Update existing service
        const updated = await knex(serviceType)
          .where("appointment_id", req.params.appointment_id)
          .andWhere("service_id", service_id)
          .update({
            service_description,
            price,
            status,
            service_type,
            service_status,
          });

        if (!updated) {
          return res.status(404).json({ error: "Service not found" });
        }

        // Update or insert items_required
        for (const item of items_required) {
          const existingItem = await knex("items_required")
            .where("service_id", service_id)
            .andWhere("item_id", item.item_id)
            .first();

          if (existingItem) {
            // Update existing item
            await knex("items_required")
              .where("service_id", service_id)
              .andWhere("item_id", item.item_id)
              .update(item);
          } else {
            // Insert new item
            await knex("items_required").insert({
              ...item,
              service_id,
            });
          }
        }
      } else {
        // Generate new service_id and add new service
        service_id = await generateServiceId();
        await knex(serviceType).insert({
          service_id,
          appointment_id: req.params.appointment_id,
          service_description,
          price,
          status,
          service_type,
          service_status,
        });

        // Insert items_required
        for (const item of items_required) {
          await knex("items_required").insert({
            ...item,
            service_id,
          });
        }
      }
    }

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


// Get services_actual data by appointment_id with items
router.get('/:appointment_id/services_actual', async (req, res) => {
  try {
    const servicesData = await knex("services_actual")
      .select(
        "services_actual.service_id",
        "services_actual.appointment_id",
        "services_actual.service_description",
        "services_actual.status",
        "services_actual.service_status",
        "services_actual.price",
        "services_actual.service_type",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.discount"
      )
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .where("services_actual.appointment_id", req.params.appointment_id);

    const formattedServices = [];
    const serviceMap = {};

    servicesData.forEach((row) => {
      if (!serviceMap[row.service_id]) {
        serviceMap[row.service_id] = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.status,
          service_status: row.service_status,
          price: row.price,
          service_type: row.service_type,
          items_required: [],
        };
        formattedServices.push(serviceMap[row.service_id]);
      }

      if (row.item_id) {
        serviceMap[row.service_id].items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name,
          qty: row.qty,
          tax: row.tax,
          discount: row.discount,
        });
      }
    });

    res.status(200).json({ _id: `appointment-${req.params.appointment_id}`, services_actual: formattedServices });
  } catch (error) {
    console.log("Error fetching services_actual:", error);
    res.status(500).json({
      error: "Error fetching services_actual",
      details: error.message,
    });
  }
});

// Update each service status in services_actual by service_id
router.put('/:appointment_id/update_service_status/:service_id', async (req, res) => {
  const { service_status } = req.body;
  try {
    // console.log(`Updating service status for appointment_id: ${req.params.appointment_id}, service_id: ${req.params.service_id}, new status: ${service_status}`);

    const updated = await knex("services_actual")
      .where("appointment_id", req.params.appointment_id)
      .andWhere("service_id", req.params.service_id)
      .update({ service_status });

    // console.log(`Rows affected: ${updated}`);

    if (!updated) {
      console.log("Service not found or no update made");
      return res.status(404).json({ error: "Service not found" });
    }

    // console.log("Service status updated successfully");

    const appointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();

    res.status(200).json(appointment);
  } catch (error) {
    console.log("Error updating service status:", error);
    res.status(400).json({
      error: "Error updating service status",
      details: error.message,
    });
  }
});

export default router;