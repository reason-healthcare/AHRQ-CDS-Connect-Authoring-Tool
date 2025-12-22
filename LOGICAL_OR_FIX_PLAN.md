# Logical OR Migration Fix Plan

## Summary

The TypeScript migration introduced `||` and `??` operators that change runtime behavior by providing default values where the original JavaScript passed `undefined` or relied on truthiness.

## Current Status

| Priority | Original | Fixed | Remaining | Notes |
|----------|----------|-------|-----------|-------|
| Critical | 23 | 21 | 2 | Remaining 2 are false positives |
| High | 12 | 0 | 12 | `?.length || 0` patterns - need review |
| Medium | 88 | 0 | 88 | String defaults - many intentional |

**Tests:** 708 passing, 4 failing (pre-existing failures, not caused by these fixes)

## Completed Fixes

### Critical Priority Files (13 files)

| File | Changes Made |
|------|--------------|
| `ConjunctionCard.tsx` | Removed `rules ?? []` (3 instances) |
| `artifacts.ts` | Restored original ternary: `elementInUse ? elementInUse.usedBy : []` |
| `ArtifactElement.tsx` | Removed `artifact || {}`, `value ?? true`, `setShowAllContent` wrapper |
| `element-select/utils.ts` | Removed `?.definitions || []`, `?.functions || []` |
| `RecommendationActionModal.tsx` | Removed `element.options || []` |
| `getFHIRVersion.ts` | Removed `recommendations || []`, `suggestions || []` |
| `ElementCard.tsx` | Removed `hasErrors || false`, `disableTitleField || false` |
| `baseElements.ts` | Removed `instance.fields || []` (2 instances) |
| `warnings.ts` | Removed `modifiers || []` |
| `ModifiersTemplate.tsx` | Removed `modifiers || []` |
| `getAllElements.ts` | Removed `subpopulations || []` |
| `ModifierModal.tsx` | Removed `elementInstance.modifiers || []` |
| `instances.ts` | Removed `elementTemplate || []` |

### Additional Files Fixed (41 files)

| File | Changes Made |
|------|--------------|
| `ConjunctionGroup.tsx` | Removed `baseElements || []`, `parameters || []`, `validateReturnType || false`, `instance.path || ''`, `instance.uniqueId || ''` |
| `ListGroup.tsx` | Removed `artifact.baseElements || []`, `artifact.parameters || []`, `listInstance.uniqueId || null` |
| `Subpopulation.tsx` | Removed `subpopulation.uniqueId || ''` |
| `Subpopulations.tsx` | Removed `subpopulations || []`, `recommendations || []`, `parameters || []`, `baseElements || []` |
| `BaseElements.tsx` | Removed `baseElements || []`, `parameters || []` |
| `ArtifactElementBody.tsx` | Removed `newModifiers || []`, `baseElements || []`, `field.type || ''` |
| `ElementSelect.tsx` | Removed `artifact || {}`, `artifactId || ''`, `externalCqlList || []`, `entry.name || ''` |
| `tabUtils.ts` | Removed `parameters || []`, `subpopulations || []`, `baseElements || []`, `childInstances || []` (multiple instances) |
| `WorkspaceTabs.tsx` | Removed `recommendations || []` |
| `ArgumentsTemplate.tsx` | Removed `artifact || {}`, `externalCqlList || []`, `parameter.name || ''` |
| `executeArtifact.ts` | Removed `value.decimal || '0'`, `value.str || ''`, `value.code || ''`, `value.quantity || 0` |
| `isBlankArtifact.ts` | Removed `?.length || 0` patterns for `recommendations`, `subpopulations`, `parameters`, `ifThenClauses` |
| `auth.ts` | Removed `?? 0` and `?? ''` from error response handling |
| `editors/utils.ts` | Removed `|| ''` from validation value access |
| `fields.ts` | Removed `!values.xxx ||` checks from isCpgComplete |
| `convertToExpression.ts` | Fixed stray apostrophes in modifier value access |
| `ModifierForm.tsx` | Fixed stray apostrophes, restored `|| ''` patterns that were in original |
| `ModifierModalHeader.tsx` | Removed `?? []` and `?? 0` from modifiers |
| `ReferenceTemplate.tsx` | Fixed stray apostrophes |
| `ExpressionPhrase.tsx` | Fixed formatting |
| `Parameter.tsx` | Fixed parsing error |
| `Parameters.tsx` | Fixed formatting |
| `getTree.ts` | Fixed formatting |
| `getParametersInUse.ts` | Fixed formatting |
| `getBaseElementsInUse.ts` | Fixed formatting |
| `getElementNames.ts` | Fixed formatting |
| And 15+ more files with stray apostrophe fixes |

### False Positives (Not Fixed - Intentional Code)

1. `RecommendationActionModal.tsx` - `codeValue ?? {}` - exists in original JS
2. `ModifierSelector.tsx` - `modifierMap ?? {}` - new code, not a migration issue

## Remaining High Priority Issues

These `?.length || 0` patterns need review to determine if they match original JS:

| File | Pattern |
|------|---------|
| `warnings.ts` | `listInstance.childInstances?.length \|\| 0` |
| `base-elements/utils.ts` | `baseElement.modifiers?.length \|\| 0` |
| `ElementOption.tsx` | `option.arguments?.length \|\| 0` |
| `IfThenClause.tsx` | `ifThenClause.statements?.length \|\| 0` |
| `NestedErrorStatement.tsx` | `statement.ifThenClauses?.length \|\| 0` |
| `parameters/utils.ts` | `use.modifiers?.length \|\| 0` |
| `ruleIsComplete.ts` | `rule.rules?.length ?? 0` |
| `ModifierSelectorRow.tsx` | `elementInstance.usedBy?.length ?? 0` |
| `QualifierModifier.tsx` | `selectedOption?.value \|\| null` |
| `WorkspaceTabs.tsx` | `element.index \|\| null` |
| `ValueSetSearchResultsTable.tsx` | `searchResultTotal \|\| 0` |
| `auth.ts` | `action.settings.termsAcceptedDate ?? null` |

## How to Verify Issues

Compare current TypeScript with original JavaScript:
```bash
git show master:frontend/src/path/to/file.js
```

## Analysis Script

Re-run analysis after making fixes:
```bash
node scripts/analyze-logical-or.js
```

This outputs:
- Console summary of remaining issues
- `logical-or-analysis.json` with detailed issue data
