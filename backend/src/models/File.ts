import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  storagePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

export const FileModel = mongoose.model('File', fileSchema);
