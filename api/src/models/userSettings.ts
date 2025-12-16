import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSettings extends Document {
  user?: string;
  termsAcceptedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    user: { type: String, immutable: true },
    termsAcceptedDate: Date
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
