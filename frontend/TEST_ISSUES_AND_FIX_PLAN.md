# Frontend Test Issues and Fix Plan

**Last Updated:** Current test run  
**Current Status:** 2 failing tests, 710 passing tests, 3 skipped tests

## Test Summary

- **Test Suites:** 2 failed, 72 passed, 74 total
- **Tests:** 2 failed, 710 passed, 3 skipped, 715 total
- **Success Rate:** 99.7% (710/712 non-skipped tests passing)

## Failing Tests

### 1. ExternalCql.test.js - "already includes" Info Banner Test

**Test:** `when a library is uploaded that the AT already includes › does not upload the library and displays an info banner`

**Location:** `frontend/src/components/builder/external-cql/__tests__/ExternalCql.test.js:304`

**Issue:**
The test expects an info banner with the message "The CDS Authoring Tool already includes a version of the same library by default" to be displayed when uploading a library that already exists. However, the mutation is succeeding (`onSuccess` is called) instead of failing (`onError` is called), causing "Library successfully added" to be displayed instead.

**Expected:**
```javascript
expect(
  await screen.findByText(/the CDS Authoring Tool already includes a version of the same library by default/i)
).toBeInTheDocument();
```

**Actual:**
```
Unable to find an element with the text: /the CDS Authoring Tool already includes a version of the same library by default/i
```

The test shows "Library successfully added" instead, indicating the mutation succeeded when it should have failed.

**Root Cause:**
The `addExternalCql` function should detect the error string response and reject the promise, triggering `onError` in the mutation. However, the mutation is calling `onSuccess` instead, suggesting:

1. The nock mock may not be matching the actual request
2. Axios may be parsing the response differently than expected (e.g., as JSON instead of string)
3. The response detection logic in `addExternalCql.ts` may not be correctly identifying the error string

**Current Implementation:**
- The nock mock is set up with a permissive body matcher: `.post('/authoring/api/externalCQL', () => true)`
- The response includes `Content-Type: 'text/plain'` header
- The `addExternalCql` function checks if `data` is a string and contains "already includes"
- The `ExternalCqlDropZone` component's `onError` callback should display the message as an info alert

**Files Involved:**
- `frontend/src/components/builder/external-cql/__tests__/ExternalCql.test.js` - Test setup and expectations
- `frontend/src/queries/external-cql/addExternalCql.ts` - API call and error detection logic
- `frontend/src/components/builder/external-cql/ExternalCqlDropZone.tsx` - Mutation and error handling

**Investigation Steps:**
1. ✅ Made nock mock more permissive with `() => true` body matcher
2. ✅ Added `Content-Type: 'text/plain'` header to nock response
3. ✅ Updated `addExternalCql` to handle string responses
4. ✅ Updated `ExternalCqlDropZone` to display "already includes" messages as info instead of error
5. ⏳ Verify nock mock is actually matching the request
6. ⏳ Check if axios is parsing the response as JSON instead of string
7. ⏳ Add debug logging to verify response type and content

**Possible Solutions:**
1. **Verify nock mock matching**: Add logging or use nock's `isDone()` to verify the mock is being hit
2. **Force string response handling**: Configure axios with `responseType: 'text'` or use `transformResponse` to ensure string responses aren't parsed as JSON
3. **Check response parsing**: Verify how axios handles responses with `Content-Type: 'text/plain'` - it may be parsing as JSON anyway
4. **Compare with working test**: The "different fhir version" test works correctly - compare the nock setup and response handling

**Status:** 🔴 **IN PROGRESS** - Needs further investigation

---

### 2. Tester.test.js - DSTU2 Patient MeetsInclusionCriteria Issue

**Test:** `CQL execution › DSTU2 patients › validates and executes the CQL on selected patients`

**Location:** `frontend/src/components/testing/__tests__/Tester.test.js:192`

**Issue:**
The test expects `MeetsInclusionCriteria` to be `true` (displaying "Yes"), but the actual execution result returns `null`/`undefined`, causing the component to display "No Value" instead.

**Expected:**
```javascript
expect(patientMeetsInclusion[0]).toHaveTextContent('Yes');
```

**Actual:**
```
Expected element to have text content:
  Yes
Received:
  No Value
```

**Root Cause:**
The test performs real CQL execution (not mocked) via `executeArtifact`. The DSTU2 patient data (`mockPatientDstu2`) may not contain the necessary encounter data to satisfy the `MeetsInclusionCriteria` expression, or the execution result mapping is not correctly extracting the boolean value from the CQL execution result.

**Details:**
- The test selects patient "robin67 baumbach677" from `mockPatientDstu2`
- The CQL defines `MeetsInclusionCriteria` as `"Inpatient Encounter Exists"` which checks for encounters matching the "Inpatient Encounter VS" value set
- The summary shows "1 of 1 patients" for Meets Inclusion Criteria, indicating the count logic works, but the individual patient result is null
- The `getValue` function in `TestResultsSection.tsx` returns "No Value" when `result == null`

**Files Involved:**
- `frontend/src/components/testing/__tests__/Tester.test.js` - Test expectations
- `frontend/src/queries/testing/executeArtifact.ts` - CQL execution logic
- `frontend/src/components/testing/TestResultsSection.tsx` - Result display logic
- Test fixtures (mock patient data)

**Possible Solutions:**
1. **Verify mock patient data**: Check if `mockPatientDstu2` contains the required encounter resources with the correct coding
2. **Check patient ID mapping**: Verify the patient ID mapping between execution results and displayed patients matches correctly
3. **Verify CQL execution result structure**: Ensure the CQL execution result structure matches what `TestResults` expects
4. **Consider mocking execution results**: Instead of performing real execution, mock the execution results to have more control over test data
5. **Check DSTU2 FHIR version compatibility**: Verify that the CQL execution engine correctly handles DSTU2 patient data

**Status:** 🟡 **DOCUMENTED** - Needs investigation (LOW PRIORITY)

---

## Previously Fixed Issues

### ✅ ModifierModal.test.js - Operator Select Dropdown

**Status:** ✅ **FIXED**

**Resolution:**
1. Made the nock mock more permissive for the operator query endpoint
2. Replaced `getByTestId` with semantic `getByRole`/`findByRole` queries
3. Simplified `Dropdown.tsx` by removing complex `data-testid` forwarding logic
4. Removed `SelectDisplayProps` from `RuleCard.tsx`

**Files Changed:**
- `frontend/src/components/modals/__tests__/ModifierModal.test.js`
- `frontend/src/components/elements/Dropdown/Dropdown.tsx`
- `frontend/src/components/modals/ModifierModal/ModifierBuilder/RuleCard.tsx`

---

### ✅ Recommendations.test.js - Multiple Test Failures

**Status:** ✅ **FIXED**

**Resolution:**
- Fixed Redux store update handling in tests
- Reverted `Recommendations.tsx` to use `useSelector` instead of `useAppSelector` for test compatibility
- Updated test to handle Redux store updates correctly

**Files Changed:**
- `frontend/src/components/builder/recommendations/Recommendations.tsx`
- `frontend/src/components/builder/recommendations/__tests__/Recommendations.test.js`

---

### ✅ ListGroup.test.js - Comment Update Test

**Status:** ✅ **FIXED**

**Resolution:**
Changed the test to use `getAllByRole('textbox')` and filter by `aria-label === 'Comment'` to find the actual textarea input element.

**Files Changed:**
- `frontend/src/components/builder/__tests__/ListGroup.test.js`

---

## Test Fix Plan

### Priority 1: ExternalCql Test (HIGH PRIORITY)

**Goal:** Fix the "already includes" info banner test

**Steps:**
1. **Verify nock mock is matching**
   - Add `nock.isDone()` check after the test to verify all mocks were called
   - Add logging to see if the POST request is being made
   - Check if the request URL and body match the nock mock

2. **Investigate axios response handling**
   - Add console.log to `addExternalCql.ts` to see what `data` type and content is received
   - Check if axios is parsing the string response as JSON
   - Verify `Content-Type: 'text/plain'` is being respected

3. **Compare with working test**
   - The "different fhir version" test works correctly
   - Compare nock setup, response format, and error handling
   - Identify what's different between the two tests

4. **Fix response detection**
   - If axios is parsing as JSON, configure `responseType: 'text'` or use `transformResponse`
   - Ensure the string check logic correctly identifies error messages
   - Verify the promise rejection is working correctly

5. **Test and verify**
   - Run the test to verify it passes
   - Ensure no other tests are broken
   - Check that the component behavior matches expectations

**Estimated Time:** 1-2 hours

---

### Priority 2: Tester Test (LOW PRIORITY)

**Goal:** Fix the DSTU2 patient MeetsInclusionCriteria test

**Steps:**
1. **Investigate mock patient data**
   - Check `mockPatientDstu2` structure and content
   - Verify it contains encounter resources with correct coding
   - Compare with R4 patient data that works correctly

2. **Check CQL execution**
   - Verify the CQL execution result structure
   - Check if patient ID mapping is correct
   - Verify DSTU2 FHIR version compatibility

3. **Fix execution or mock data**
   - Either fix the mock patient data to include required encounters
   - Or fix the execution result mapping
   - Or mock the execution results for more control

4. **Test and verify**
   - Run the test to verify it passes
   - Ensure no other tests are broken

**Estimated Time:** 2-4 hours

---

## Testing Commands

```bash
# Run all tests
npm test -- --watchAll=false --no-coverage

# Run specific test suite
npm test -- --testPathPattern="ExternalCql" --watchAll=false --no-coverage
npm test -- --testPathPattern="Tester" --watchAll=false --no-coverage

# Run specific test
npm test -- --testPathPattern="ExternalCql" --testNamePattern="does not upload" --watchAll=false --no-coverage
npm test -- --testPathPattern="Tester" --testNamePattern="DSTU2" --watchAll=false --no-coverage

# Check linting
npm run lint

# Check formatting
npm run format
```

## Success Criteria

- ✅ All 2 failing tests pass
- ✅ No new failures introduced
- ✅ All 710 passing tests continue to pass
- ✅ Code passes linting and formatting
- ✅ Test coverage maintained or improved

## Notes

- **ModifierModal and Recommendations tests are now passing** - These were fixed in previous sessions
- **ExternalCql test** - The mutation rejection logic needs investigation
- **Tester test** - This is a lower priority issue related to CQL execution with DSTU2 patient data
- All other test suites are passing (72/74 test suites)

