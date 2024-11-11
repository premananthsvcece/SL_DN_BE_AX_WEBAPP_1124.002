import mongoose from "mongoose";

// Service Schema for services within procurement
const serviceSchema = new mongoose.Schema({
  service_id: { type: String, required: true },
  service_description: { type: String, required: true },
  price: { type: Number, required: true },
  items_required: [
    {
      inventory_id: { type: String, required: true },
      part_name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      status: { type: String, enum: ["approved", "pending", "rejected", 'saved'], required: true },
    }
  ]
}, { _id: false });

// Procurement Schema
const procurementSchema = new mongoose.Schema(
  {
    appointment_id: { type: String, required: true },
    customer_id: { type: String, required: true },
    vehicle_id: { type: String, required: true },
    mechanic_id: { type: String, required: true },
    services: [serviceSchema],
    appointment_date: { type: Date, required: true },
    appointment_time: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "completed", "canceled"], required: true },
    telecaller: { type: String, required: true },
    notes: { type: String },
  },
  {
    versionKey: false, // Disable the __v version key
    collection: "ProcurementCollection" // Custom collection name
  }
);

const Procurement = mongoose.model("Procurement", procurementSchema);

export default Procurement;
