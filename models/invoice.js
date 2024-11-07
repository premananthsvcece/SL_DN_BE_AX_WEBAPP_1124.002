import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentsCollection",
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerCollection",
      required: true,
    },
    total_amount: { type: Number, required: true },
    payment_status: {
      type: String,
      enum: ["pending", "paid"],
      required: true,
    },
    payment_date: { type: Date },
  },
  {
    versionKey: false, // Disables the __v versioning field
  }
);

// Explicitly specify the collection name
const Invoice = mongoose.model("Invoice", invoiceSchema, "InvoicesCollection");

export default Invoice;
