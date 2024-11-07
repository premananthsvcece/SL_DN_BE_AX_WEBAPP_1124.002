import mongoose from "mongoose";

// Order Schema
const orderSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  quantity: { type: Number, required: true },
});

// Inventory Schema
const inventorySchema = new mongoose.Schema(
  {
    inventory_id: { type: String, unique: true, required: true }, // Custom ID
    part_name: { type: String, required: true },
    part_number: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["spares", "accessories"], required: true }, // Category field with enum values
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    orders: [orderSchema],
    suppliers: [{ type: String, required: true }], // List of supplier IDs as strings
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

const Inventory = mongoose.model(
  "Inventory",
  inventorySchema,
  "InventoryCollection"
);

export default Inventory;
