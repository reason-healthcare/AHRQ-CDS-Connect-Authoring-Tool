# Test Issues - Manual Investigation Needed

## Status

- **248 tests passing** (up from 183 originally)
- **2 tests failing**:
  1. Suggestion-related with actions (see below)
  2. `getValueSetCodeCount` test (see below)
- **Main fix completed**: Query modifiers now work correctly (changed `isRoot` to `true`)

**Important Note**:

- After undoing unstaged changes to `cqlHandler.ts`, only 1 test is now failing
- Our formatting fix attempts introduced 4 additional failing tests (regressions)
- The original issue remains: 1 failing test related to suggestions with actions
- The TypeScript migration itself did not introduce these failures

## Failing Test

**Current Status**: Only 1 test is failing after undoing unstaged changes:

- `should export a suggestion with a List of multiple actions`

**Note**: Our formatting fix attempts introduced 4 additional failing tests, which were reverted. The original single failing test remains. The other 4 suggestion tests with actions are now passing.

## Error Details

The error message indicates that the suggestions section is not being found in the output:

```
AssertionError: expected 'library "a-test" version \'1\'\r\n\r\…' to include '\ndefine "Suggestions":\r\n  if "InPo…'
```

This suggests that:

- The suggestions section is not being generated at all for these test cases
- OR the format is so different that the test can't match it

## What Works

- Suggestions with empty actions arrays work correctly (2 tests passing)
- General suggestions generation works (test: "should export all suggestions for each recommendation that has them" passes)
- Suggestions with no actions work (test: "should export no suggestions when none included" passes)

## Code Location

The issue is in `api/src/handlers/cqlHandler.ts` in the `constructSuggestion` method, specifically:

- Lines 1308-1343: Action processing logic
- Lines 1347-1359: Formatting logic for actions

## What We've Tried

1. ✅ Added error handling around action processing (try-catch) - **REVERTED** (introduced regressions)
2. ✅ Added filtering for empty action strings - **REVERTED** (introduced regressions)
3. ✅ Added defensive checks for concept processing - **REVERTED** (introduced regressions)
4. ✅ Verified templates exist (`MedicationRequestResource`, `ServiceRequestResource`)
5. ✅ Verified resourceType is accessible in test data
6. ✅ Attempted various formatting fixes for closing braces - **REVERTED** (introduced regressions)

**Result**: All formatting fix attempts were reverted. The original single failing test remains. The issue needs a different approach.

## Expected Format

Based on the test expectations, the format should be:

- Single action: `Tuple { ... } } } }` (4 closing braces)
- Multiple actions: `Tuple { ... } },Tuple { ... } } } }` (4 closing braces at end)

The test shows:

- Line 2926: `} },Tuple {` - first action ends with `} }`, then `,Tuple {`
- Line 2935: `} } } }` - 4 closing braces total

## Potential Issues to Investigate

1. **Template rendering errors**: Check if `ejs.render()` is throwing errors that are being caught silently
2. **Concept processing**: Verify that `buildConceptObjectForCodes` and `addConcepts` are working correctly with the test data format
3. **Format mismatch**: The exact format being generated may not match what the test expects
4. **Empty actions**: Check if actions are being filtered out incorrectly
5. **Resource property access**: Verify that `medicationCodeableConcept`, `reasonCode`, `category` properties are being accessed correctly

## Test Data Structure

The failing tests use this structure:

```javascript
raw.recommendations[0].suggestions = [
  {
    uid: 'suggestion-01-01',
    label: 'First suggestion for first recommendation',
    actions: [
      {
        type: 'create',
        description: 'First action - a MedicationRequest',
        resource: {
          resourceType: 'MedicationRequest',
          medicationCodeableConcept: { text: '...', code: '...', system: '...', uri: '...' },
          status: 'draft',
          intent: 'proposal',
          priority: 'routine',
          reasonCode: { text: '...', code: '...', system: '...', uri: '...' },
          category: { text: '...', code: '...', system: '...', uri: '...' }
        }
      }
    ]
  }
];
```

## Debugging Suggestions

1. Add console.log statements in `constructSuggestion` to see:
   - What `actionsText` contains
   - What `validActions` contains after filtering
   - What the final return value is
2. Check if `ejs.render()` is throwing errors by adding more detailed error logging
3. Verify the exact output format by logging the generated CQL string
4. Compare the working test (empty actions) with the failing tests to see what's different

## Related Files

- `api/src/handlers/cqlHandler.ts` - Main handler file
- `api/test/handlers/cqlHandler.test.ts` - Test file (lines 2592-2937)
- `api/src/data/cql/templates/MedicationRequestResource` - Template file
- `api/src/data/cql/templates/ServiceRequestResource` - Template file

---

# getValueSetCodeCount Test Issue

## Status

- **Test**: `FHIRClient #getValueSetCodeCount should get the code count for a value set`
- **Location**: `api/test/vsac/fhirClient.test.ts` (lines 109-125)
- **Error**: `AssertionError: expected +0 to equal 1`

## Problem

The test is failing because the nock mock is not intercepting the HTTP request made by `getValueSetCodeCount`. The function returns 0 (the default when the request fails or times out) instead of the expected value of 1.

## Code Location

- **Handler**: `api/src/vsac/FHIRClient.ts` (lines 170-184)
- **Test**: `api/test/vsac/fhirClient.test.ts` (lines 109-125)

## What We've Tried

1. ✅ Changed function to use `params: { count: 1 }` instead of query string in URL
2. ✅ Tried various nock query matchers: `{ count: '1' }`, `{ count: 1 }`, `query(true)`
3. ✅ Tried matching exact path with query: `/fhir/ValueSet/1234/$expand?count=1`
4. ✅ Tried using `.persist()` to keep mock active
5. ✅ Verified standalone test works with same nock setup

**Result**: Standalone test confirms the nock setup works correctly, but the test environment appears to have interference preventing nock from matching the request.

## Current Implementation

The function now uses:
```typescript
url: `${VSAC_FHIR_ENDPOINT}/ValueSet/${oid}/$expand`,
params: { count: 1 }, // Use params instead of query string in URL
```

The test uses:
```typescript
nock('https://cts.nlm.nih.gov')
  .get('/fhir/ValueSet/1234/$expand')
  .query(true) // Accept any query parameters
  .reply(200, FHIRMocks.ValueSet);
```

## Potential Issues

1. **Test environment interference**: The `nock.cleanAll()` in `afterEach` might be interfering
2. **Timing issues**: The async nature of the request might not be properly awaited
3. **Axios configuration**: The way axios handles `params` vs query strings in URLs might differ
4. **Nock version compatibility**: There might be a version-specific issue with how nock matches requests

## Debugging Suggestions

1. Add logging to see the actual request URL being made by axios
2. Check if nock is active and has pending mocks before the request
3. Try using a custom axios adapter to inspect the outgoing request
4. Verify the exact format of the query string that axios generates from `params`
5. Check if there are any other nock mocks that might be interfering

## Related Files

- `api/src/vsac/FHIRClient.ts` - FHIR client implementation
- `api/test/vsac/fhirClient.test.ts` - Test file
- `api/test/vsac/fixtures/FHIRfixtures.js` - Test fixtures
