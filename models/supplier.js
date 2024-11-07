import mongoose from "mongoose";

// Shipping Options Schema
const shippingOptionSchema = new mongoose.Schema({
  carrier: { type: String, required: true },
  estimated_time: { type: String, required: true },
  cost: { type: Number, required: true },
});

// Product Schema for items supplied by the supplier
const productSchema = new mongoose.Schema({
  inventory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  part_name: { type: String, required: true },
  part_number: { type: String, required: true },
  price: { type: Number, required: true },
});

// Supplier Schema
const supplierSchema = new mongoose.Schema(
  {
    supplier_id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
      },
    },
    payment_terms: { type: String },
    shipping_options: [shippingOptionSchema], // Array of shipping options
    products: [productSchema], // Array of products
    notes: { type: String },
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

// Explicitly specify the collection name
const Supplier = mongoose.model(
  "Supplier",
  supplierSchema,
  "SupplierCollection"
);

export default Supplier;
