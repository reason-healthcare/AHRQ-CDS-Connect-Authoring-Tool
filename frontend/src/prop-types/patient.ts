/**
 * Legacy PropTypes converted to TypeScript interfaces
 * These types are provided for backward compatibility
 * Consider using types from '../types/patient' for new code
 */

export interface PatientProps {
  id?: string;
  patient?: Record<string, unknown>;
  user?: string;
}

export default PatientProps;
