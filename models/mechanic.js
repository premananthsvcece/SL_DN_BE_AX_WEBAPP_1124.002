import mongoose from "mongoose";

const mechanicSchema = new mongoose.Schema(
  {
    mechanic_id: { type: String, unique: true, required: true }, // Unique identifier for each mechanic
    mechanic_name: { type: String, required: true }, // Mechanic's name
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: false },
    },
    specialties: [{ type: String }], // Array of specialty strings
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

// Explicitly specify the collection name
const Mechanic = mongoose.model(
  "Mechanic",
  mechanicSchema,
  "MechanicCollection"
);

export default Mechanic;
