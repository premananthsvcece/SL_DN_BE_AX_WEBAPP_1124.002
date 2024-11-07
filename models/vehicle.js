import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true },
  customer_id: { type: String, required: true },
  plate_number: { type: String, required: true },
}, {
  versionKey: false
});

const VehicleCollection = mongoose.model('VehicleCollection', vehicleSchema, 'VehicleCollection');

export default VehicleCollection;