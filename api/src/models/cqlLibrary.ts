import mongoose, { Document, Schema } from 'mongoose';

export interface ICQLLibrary extends Document {
  name?: string;
  version?: string;
  fhirVersion?: string;
  linkedArtifactId?: string;
  user?: string;
  details?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const cqlLibrarySchema = new Schema<ICQLLibrary>(
  {
    name: String,
    version: String,
    fhirVersion: String,
    linkedArtifactId: String,
    user: { type: String, immutable: true },
    details: Object
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model<ICQLLibrary>('CQLLibrary', cqlLibrarySchema);
