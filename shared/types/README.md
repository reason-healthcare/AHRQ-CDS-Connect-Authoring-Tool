# Shared Types

This directory contains TypeScript type definitions that are shared between the backend (API) and frontend applications.

## Structure

- `artifact.ts` - Core artifact type definitions used by both frontend and backend
- `api.ts` - API request/response type definitions
- `index.ts` - Main export file

**Note**: FHIR types are provided by the `@types/fhir` package. Import them directly:
```typescript
import type { fhir } from '@types/fhir';
// Use fhir.Patient, fhir.ValueSet, etc.
```

## Usage

**Important**: Use **relative imports** instead of path aliases. TypeScript path mappings are compile-time only and won't work at runtime.

### Backend

```typescript
// From api/src/handlers/artifactHandler.ts
import type { ArtifactStructure, ArtifactField } from '../../../shared/types/index.js';

// From api/src/models/artifact.ts
import type { ArtifactStructure } from '../../types/artifact.js';
```

### Frontend

```typescript
// From frontend/src/queries/artifacts/fetchArtifact.ts
import type { ArtifactStructure } from '../../../shared/types/index';

// From frontend/src/types/artifact.ts
import type { ArtifactStructure } from '../../shared/types';
```

## TypeScript Configuration

Both `api/tsconfig.json` and `frontend/tsconfig.json` include this directory in their compilation:

- **Backend**: `"include": ["src/**/*", "../shared/types/**/*"]`
- **Frontend**: `"include": ["src", "../shared/types"]`

**Note**: We use relative imports (not path aliases) because:
1. TypeScript path mappings are compile-time only
2. Node.js runtime doesn't understand TypeScript path mappings
3. Webpack would need additional configuration for path aliases
4. Relative imports work at both compile-time and runtime

See [PRODUCTION_NOTES.md](./PRODUCTION_NOTES.md) for detailed production considerations.

## Guidelines

1. **Only truly shared types**: Only include types that are used by both frontend and backend
2. **API contracts**: Types that define the contract between frontend and backend (request/response types)
3. **Core domain types**: Fundamental types like `Artifact`, `Parameter`, etc. that represent the core domain model
4. **Avoid UI-specific types**: Don't include React component props, Redux-specific types, or other UI-only types
5. **Avoid backend-specific types**: Don't include Mongoose document types, Express-specific types, etc.

## Migration Strategy

1. Identify truly shared types (API contracts, core domain types)
2. Move shared types to this directory
3. Update imports in both frontend and backend
4. Keep domain-specific types in their respective directories

