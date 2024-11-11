import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customer_id: { type: String, unique: false, required: true }, // Custom ID
    customer_name: { type: String, required: false },
    gstNumber: { type: String, required: false },
    contact: {
      phone: { type: String, required: false },
      email: { type: String, required: false },
      address: {
        street: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        zip: { type: String, required: false },
      },
    },
    vehicles: [
      {
        vehicle_id: { type: String, required: true }, // Plate number as ID
        make: { type: String, required: true },
        model: { type: String, required: true },
        fuelType: { type: String, required: true },
        year: { type: Number, required: false },
        vin: { type: String, required: false },
        address: {
          street: { type: String, required: false },
          city: { type: String, required: false },
          state: { type: String, required: false },
          zip: { type: String, required: false },
        },
      },
    ],
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

// Explicitly specify the collection name
const CustomerCollection = mongoose.model(
  "CustomerCollection",
  customerSchema,
  "CustomersCollection"
);

export default CustomerCollection;
