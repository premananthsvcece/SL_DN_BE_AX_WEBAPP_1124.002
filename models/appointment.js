import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointment_id: { type: String, required: true },
    customer_id: {
      type: String,
      ref: "CustomerCollection",
      required: true,
    },
    vehicle_id: {
      type: String,
      ref: "VehicleCollection",
      required: true,
    },
    mechanic_id: {
      type: String,
      ref: "MechanicsCollection",
      required: false,
    },
    km: { type: Number, required: false },
    services_estimate: [
      {
        service_id: {
          type: String,
          ref: "ServiceCollection",
          required: true,
        },
        service_description: { type: String, required: true },
        price: { type: Number, required: true },
        service_type: { type: String, required: true },
        items_required: [
          {
            item_id: { type: String, required: true },
            item_name: { type: String, required: true },
          },
        ],
        status: {
          type: String,
          enum: ["approved", "pending", "rejected", "saved"],
          required: true,
        },
      },
    ],
    services_actual: [
      {
        service_id: {
          type: String,
          ref: "ServiceCollection",
          required: true,
        },
        service_description: { type: String, required: true },
        status: {
          type: String,
          enum: ["approved", "pending", "rejected", "saved"],
          required: false,
        },
        service_status: {
          type: String,
          enum: ["scheduled", "completed", "canceled", "saved", "approved"],
          default: "scheduled",
        },
        price: { type: Number, required: true },
        // estimate_amount: { type: Number, required: true },
        service_type: { type: String, required: true },
        items_required: [
          {
            item_id: { type: String, required: true },
            item_name: { type: String, required: true },
            qty: { type: String, required: false },
            tax: { type: String, required: false },
            discount: { type: String, required: false },
          },
        ],
      },
    ],
    appointment_date: { type: Date, required: false },
    appointment_time: { type: String, required: false }, // Store time as a string in HH:MM format
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled", "saved", "approved"],
      default: "scheduled",
    },
    telecaller: { type: String, required: true }, // "self" or the name of the employee
    notes: { type: String },
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

// Explicitly specify the collection name
const AppointmentsCollection = mongoose.model(
  "AppointmentsCollection",
  appointmentSchema,
  "AppointmentsCollection"
);

export default AppointmentsCollection;
