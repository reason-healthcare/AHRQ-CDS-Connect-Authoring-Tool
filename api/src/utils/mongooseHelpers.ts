/**
 * Helper functions for working with Mongoose documents
 */

import type { Document } from 'mongoose';

/**
 * Converts a Mongoose document to a plain object with proper typing
 */
export function documentToPlainObject<T extends Document>(doc: T): Record<string, unknown> {
  return doc.toObject() as Record<string, unknown>;
}

/**
 * Converts an array of Mongoose documents to plain objects
 */
export function documentsToPlainObjects<T extends Document>(docs: T[]): Array<Record<string, unknown>> {
  return docs.map(doc => documentToPlainObject(doc));
}
