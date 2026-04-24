import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    from_name:  { type: String, required: true },
    from_email: { type: String, required: true },
    message:    { type: String, required: true },
    read:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
