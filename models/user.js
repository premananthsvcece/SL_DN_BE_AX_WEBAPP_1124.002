import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  user_id: { type: String, unique: true, required: true }, // Custom ID
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
  },
});

const UsersCollection = mongoose.model('UsersCollection', userSchema, 'UsersCollection');

export default UsersCollection;