import mongoose from 'mongoose';

const EstimateItemSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true
  },
  spareList: {
    type: String,
    trim: true
  },
  qty: {
    type: Number,
    min: 1
  },
  rate: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  estimatedAmount: {
    type: Number,
    min: 0
  }
});

const JobCardSchema = new mongoose.Schema({
  jobCard_id: { type: String, unique: true, required: true }, // Custom ID
  vehicleId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  estimateItems: {
    type: [EstimateItemSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const JobCard = mongoose.model('JobCard', JobCardSchema, 'JobCardCollection');

export default JobCard;