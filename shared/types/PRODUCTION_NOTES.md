# Production Considerations for Shared Types

## Runtime Module Resolution

**Critical**: TypeScript path mappings (`@shared/*`) are **compile-time only**. They do NOT work at runtime.

### Backend (Node.js)

When TypeScript compiles to JavaScript:
- TypeScript resolves `@shared/*` during compilation
- But the compiled JavaScript still contains `@shared/*` in import statements
- Node.js doesn't know how to resolve `@shared/*` at runtime → **Runtime Error**

**Solution**: Use relative imports:
```typescript
// ✅ Works at compile-time AND runtime
import type { ArtifactStructure } from '../../../shared/types/index.js';

// ❌ Only works at compile-time, fails at runtime
import type { ArtifactStructure } from '@shared/types';
```

### Frontend (Webpack)

Webpack can resolve path aliases, but requires configuration:
- Would need to add `@shared/*` to `craco.config.js` webpack resolve.alias
- Relative imports work without additional configuration

**Solution**: Use relative imports (simpler, no config needed):
```typescript
// ✅ Works with Webpack
import type { ArtifactStructure } from '../../../shared/types';

// ⚠️ Requires webpack alias configuration
import type { ArtifactStructure } from '@shared/types';
```

## Build Process Impact

### Backend Build (`npm run build`)

1. TypeScript compiles `api/src/**/*.ts` → `api/dist/**/*.js`
2. Shared types are included in compilation for type checking
3. **Shared types are NOT copied to `dist/`** (they're only used for types)
4. Runtime imports use relative paths that resolve correctly

**No production impact** - relative imports work correctly.

### Frontend Build (`npm run build`)

1. Webpack bundles all source files
2. Shared types are included in type checking
3. Webpack resolves relative imports during bundling
4. Final bundle contains all necessary code

**No production impact** - relative imports work correctly.

## Recommended Approach

1. ✅ Use relative imports: `from '../../../shared/types'`
2. ✅ Include shared types in tsconfig `include` array
3. ❌ Don't use TypeScript path aliases for shared types
4. ✅ Keep shared types as TypeScript files (not compiled)

## Migration Path

If you want to use path aliases in the future:

### Backend
- Use `tsconfig-paths` or `ts-node/register` at runtime
- Or use a build tool that resolves paths (e.g., `tsc-alias`)

### Frontend
- Configure Webpack alias in `craco.config.js`:
  ```js
  webpack: {
    configure: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@shared': path.resolve(__dirname, '../shared/types')
      };
      return config;
    }
  }
  ```

For now, **relative imports are the safest and simplest approach**.

