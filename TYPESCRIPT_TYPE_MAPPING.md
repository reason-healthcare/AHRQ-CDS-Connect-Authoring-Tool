# TypeScript Type Mapping Guide

This document maps type definitions between the backend (API) and frontend to ensure type safety across boundaries.

## TypeScript Configuration

### Backend (`api/tsconfig.json`)
- **Strict Mode**: `true` (enabled)
- **Target**: ES2020
- **Module**: ES2020
- **Key Features**:
  - `noUnusedLocals`: true
  - `noUnusedParameters`: true
  - `noImplicitReturns`: true
  - `declaration`: true (generates .d.ts files)

### Frontend (`frontend/tsconfig.json`)
- **Strict Mode**: `false` (disabled for gradual migration)
- **Target**: ES2020
- **Module**: ESNext
- **Key Features**:
  - JSX: `react-jsx`
  - Path aliases: `@/*` → `src/*`
  - `noEmit`: true (CRACO handles compilation)

**Note**: Frontend strict mode is intentionally disabled to allow gradual migration. Consider enabling strict mode incrementally in future phases.

## FHIR Types

Both backend and frontend use **FHIR R4** types from `@types/fhir`:

- **Backend**: `import fhir4 from 'fhir/r4'`
- **Frontend**: `import type fhir4 from 'fhir/r4'`

**Usage Locations**:
- Backend: `api/src/models/artifact.ts`, `api/src/models/patient.ts`, `api/src/vsac/FHIRClient.ts`
- Frontend: `frontend/src/types/patient.ts`

## Artifact Type Mappings

### Backend Types (`api/src/types/artifact.ts`)

| Backend Type | Frontend Equivalent | Notes |
|-------------|---------------------|-------|
| `ArtifactField` | `Field` | Similar structure, frontend has additional properties (`valueSets`, `codes`, `select`, etc.) |
| `ArtifactModifier` | `Modifier` (from `utils/instances.ts`) | Backend uses `values` object, frontend uses different structure |
| `ArtifactElement` | `Instance` (from `utils/instances.ts`) | Core element structure, frontend extends with more properties |
| `ArtifactParameter` | `Parameter` | Similar structure |
| `ArtifactSubpopulation` | `Subpopulation` | Similar structure |
| `ArtifactRecommendation` | `Recommendation` | Frontend has additional properties (`links`, `suggestions`) |
| `ArtifactErrorStatement` | `ErrorStatement` | Similar structure |
| `ArtifactContext` | N/A | Backend-specific for FHIR context conversion |
| `ArtifactStructure` | `Artifact` | Full artifact structure |

### Frontend Types (`frontend/src/types/artifact.ts`)

| Frontend Type | Backend Equivalent | Notes |
|--------------|-------------------|-------|
| `Field` | `ArtifactField` | Frontend has more UI-specific properties |
| `ExpressionTree` | `ArtifactElement` | Frontend extends `Instance` with tree-specific properties |
| `Subpopulation` | `ArtifactSubpopulation` | Similar structure |
| `Recommendation` | `ArtifactRecommendation` | Frontend has `links` and `suggestions` properties |
| `Parameter` | `ArtifactParameter` | Similar structure |
| `BaseElement` | `ArtifactElement` | Frontend extends `Instance` with `usedBy` property |
| `ErrorStatement` | `ArtifactErrorStatement` | Similar structure |
| `Artifact` | `ArtifactStructure` | Main artifact interface |

## API Request/Response Types

### Artifact Endpoints

#### GET `/authoring/api/artifacts`
- **Request**: `AuthenticatedRequest` (extends Express `Request` with `user` property)
- **Response**: `Array<ArtifactStructure>` (backend) / `Array<Artifact>` (frontend)

#### GET `/authoring/api/artifacts/:artifact`
- **Request**: `AuthenticatedRequest` with `params.artifact: string`
- **Response**: `ArtifactStructure` (backend) / `Artifact` (frontend)

#### POST `/authoring/api/artifacts`
- **Request**: `AuthenticatedRequest` with `body: ArtifactStructure`
- **Response**: `ArtifactStructure` (created artifact)

#### PUT `/authoring/api/artifacts/:artifact`
- **Request**: `AuthenticatedRequest` with `params.artifact: string` and `body: ArtifactStructure`
- **Response**: `ArtifactStructure` (updated artifact)

### Patient Endpoints

#### GET `/authoring/api/testing/patients`
- **Request**: `AuthenticatedRequest`
- **Response**: `Array<IPatient>` (backend) / `Array<Patient>` (frontend)

#### POST `/authoring/api/testing/patients`
- **Request**: `AuthenticatedRequest` with `body: PatientBundle`
- **Response**: `IPatient` (backend) / `Patient` (frontend)

### VSAC/FHIR Endpoints

#### GET `/authoring/api/fhir/ValueSet/:oid`
- **Request**: `AuthenticatedRequest` with `params.oid: string`
- **Response**: `fhir4.ValueSet`

#### POST `/authoring/api/fhir/ValueSet/$expand`
- **Request**: `AuthenticatedRequest` with `body: fhir4.Parameters`
- **Response**: `fhir4.ValueSet`

## Type Conversion Notes

### Backend → Frontend
- Backend uses `Date` objects for `createdAt`/`updatedAt`, frontend uses `string`
- Backend `ArtifactElement` maps to frontend `Instance` with additional properties
- Backend `ArtifactStructure` maps to frontend `Artifact` with some property differences

### Frontend → Backend
- Frontend `ExpressionTree` (extends `Instance`) maps to backend `ArtifactElement`
- Frontend `Field` has more properties than backend `ArtifactField` - only core properties are sent
- Frontend `Recommendation` has `links` and `suggestions` that may not be in backend structure

## Recommendations

1. **Shared Types**: Consider creating a shared types package or monorepo structure for truly shared types
2. **Type Guards**: Use type guards when converting between backend and frontend types
3. **API Contracts**: Document API request/response types in OpenAPI/Swagger format
4. **Validation**: Add runtime validation (e.g., Zod, Yup) to ensure API contracts are met
5. **Strict Mode**: Gradually enable strict mode in frontend after resolving all type issues

