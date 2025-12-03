import mongoose, { Document, Schema } from 'mongoose';
import fhir4 from 'fhir/r4';

export interface IPatient extends Document {
  name?: string;
  patient?: fhir4.Patient;
  fhirVersion?: string;
  user?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: String,
    patient: Object,
    fhirVersion: String,
    user: { type: String, immutable: true }
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
