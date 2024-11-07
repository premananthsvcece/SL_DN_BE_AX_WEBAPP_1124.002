import mongoose from 'mongoose';

const numberRangeSchema = new mongoose.Schema({
  id_type: { type: String, required: true, unique: true },  // e.g., 'Customer', 'Vehicle'
  range_start: { type: Number, required: true },           // Starting number in the range
  range_end: { type: Number, required: true },             // Ending number in the range
  running_number: { type: Number, required: true },        // Current running number
  prefix: { type: String, required: true, unique: true },  // Prefix like 'CUST', 'VEH', etc.
});

// Use the correct collection name 'NumberRangeCollection'
const NumberRange = mongoose.model('NumberRange', numberRangeSchema, 'NumberRangeCollection');

export default NumberRange;