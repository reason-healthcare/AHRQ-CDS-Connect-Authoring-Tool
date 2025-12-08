# Frontend Test Issues

**Current Status:** 24 failing tests, 688 passing tests

**Failing Test Suites:**

- Recommendations.test.js: 16 failing
- ModifierModal.test.js: 7 failing
- Tester.test.js: 1 failing

**Note:** All tests for recently migrated TypeScript components (error-statement, external-cql, element-select) are passing. ListGroup test has been fixed.

## Tester.test.js - DSTU2 Patient MeetsInclusionCriteria Issue

**Test:** `DSTU2 patients › validates and executes the CQL on selected patients`

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

**Possible Solutions:**

1. Verify the mock patient data contains the required encounter resources
2. Check the patient ID mapping between execution results and displayed patients
3. Verify the CQL execution result structure matches what `TestResults` expects
4. Consider mocking the execution results instead of performing real execution

**Status:** Documented - needs investigation

## Recommendations.test.js - Multiple Test Failures

**Location:** `frontend/src/components/builder/recommendations/__tests__/Recommendations.test.js`

**Issue:**
16 tests are failing in the Recommendations test suite. The main issues appear to be:

1. Component update handlers not being called with expected values
2. Test expectations not matching actual component behavior after TypeScript migration

**Progress:**

- Fixed: "can add a recommendation" test (now passing)
- Fixed: Updated Recommendation interface to include `links` and `suggestions` properties
- Fixed: Updated `updateRecommendation` function in `Recommendation.js` to correctly use `produce`
- Fixed: Updated button text from "new recommendation" to "Add Recommendation" in test

**Remaining Failures:**

- can update a recommendation
- can delete a recommendation
- can add a subpopulation to a recommendation
- can add a rationale to a recommendation
- can add a comment to a recommendation
- can add a link to a recommendation
- can add a suggestion to a recommendation
- can add another suggestion to a recommendation that already has suggestions
- can add an action to a suggestion on a recommendation
- can edit an action already on a suggestion on a recommendation
- can delete a subpopulation from a recommendation
- can delete a rationale from a recommendation
- can delete a comment from a recommendation
- can delete a link from a recommendation
- can delete a suggestion from a recommendation
- can delete an action from a suggestion on a recommendation

**Status:** In progress - 10 passing, 16 failing

## Workspace.test.js - "can edit a template instance" Test Failure

**Test:** `can edit a template instance`

**Location:** `frontend/src/components/builder/workspace/__tests__/Workspace.test.js:117`

**Issue:**
The test is looking for a label with text "Age Range" using `getByLabelText('Age Range')`, but the label is rendered as plain text in `ElementCardLabel`, not as an accessible label element.

**Error:**

```
Unable to find a label with the text: Age Range
```

**Root Cause:**
The `ElementCardLabel` component renders the label as plain text in a `Box` component, not as an HTML `<label>` element with an `aria-label` or `htmlFor` attribute. Therefore, `getByLabelText` cannot find it.

**Details:**

- The test fixture `instanceTree` contains an instance with `name: 'Age Range'`
- This name is passed as the `label` prop to `ArtifactElement`, which passes it to `ElementCard`
- `ElementCard` renders it via `ElementCardLabel`, which displays it as plain text
- The test needs to use a different query method (e.g., `getByText`, `getByRole` with text content, or find the element by its text content)

**Possible Solutions:**

1. Update the test to use `getByText('Age Range')` instead of `getByLabelText('Age Range')`
2. Add an `aria-label` attribute to `ElementCardLabel` to make it accessible via `getByLabelText`
3. Find the element by its text content using a different query method

**Status:** Documented - needs fix

## ModifierModal.test.js - Multiple Test Failures

**Location:** `frontend/src/components/modals/__tests__/ModifierModal.test.js`

**Issue:**
7 tests are failing in the ModifierModal test suite. The main issue is that the test is looking for `testId='operator-select'`, which is defined in the code but not being applied to the DOM element.

**Failing Tests:**

- can add an operator
- includes only predefined code operators when predefined codes are required and custom codes not allowed
- includes predefined code operators and custom code operators when predefined codes are required and custom codes are allowed
- does not include predefined code operators when no predefined codes are defined
- can correctly determine when a rule is complete and display the correct modifier expression
- can add a custom modifier to the element
- can edit a custom modifier

**Error:**

```
Unable to find an element by: [data-testid="operator-select"]
```

**Root Cause:**
The `testId` IS defined in the code (`RuleCard.tsx` line 96):

```typescript
SelectProps={{
  SelectDisplayProps: { 'data-testid': 'operator-select' } as React.HTMLAttributes<HTMLDivElement>
}}
```

However, it's not being applied to the DOM element. The issue is:

1. The `testId` is passed via `SelectProps.SelectDisplayProps` to the `Dropdown` component
2. The `Dropdown` component uses Material-UI's `TextField` with `select={true}` and spreads `{...props}`
3. Material-UI's `TextField` with `select` should forward `SelectProps` to the internal `Select` component
4. However, `SelectDisplayProps` may not be correctly applied to the display element, or the prop structure changed during the TypeScript migration

**Why This Happened:**

- The code structure is the same as before, but Material-UI's type definitions or prop forwarding behavior may have changed
- The `Dropdown` component may need to explicitly extract and apply `SelectDisplayProps` from `SelectProps`
- TypeScript's stricter typing may have revealed an issue that existed but wasn't caught in JavaScript

**Files Involved:**

- `frontend/src/components/modals/ModifierModal/ModifierBuilder/RuleCard.tsx` (line 95-97) - Defines the testId
- `frontend/src/components/elements/Dropdown/Dropdown.tsx` - Should forward SelectProps
- `frontend/src/components/modals/__tests__/ModifierModal.test.js` - Test looking for the testId

**Possible Solutions:**

1. **Modify `Dropdown` component**: Extract `SelectDisplayProps` from `SelectProps` and apply it directly to the TextField's input element
2. **Modify `RuleCard`**: Pass `data-testid` directly as a prop to `Dropdown` instead of nested in `SelectProps`
3. **Update test**: Use alternative query method (e.g., `getByRole('combobox', { name: 'Operator' })`)

**Status:** Documented - needs fix (testId exists in code but not applied to DOM)

## ListGroup.test.js - Comment Update Test Failure

**Test:** `should call updateLists when list comment is updated`

**Location:** `frontend/src/components/builder/__tests__/ListGroup.test.js:138`

**Issue:**
The test fails because `updateLists` is not being called when typing in the comment field.

**Error:**

```
expect(jest.fn()).toBeCalled()
Expected number of calls: >= 1
Received number of calls:    0
```

**Root Cause:**
`getAllByLabelText('Comment')` was returning label elements (the visible "Comment:" text), not the actual textarea input elements. When `userEvent.type` tried to type into a label element, it failed silently, and `updateLists` was never called.

**Solution:**
Changed the test to use `getAllByRole('textbox')` and filter by `aria-label === 'Comment'` to find the actual textarea input element that TextAreaField renders.

**Fix Applied:**

```javascript
// Before:
const commentInputs = within(container).getAllByLabelText('Comment');
const commentInput = commentInputs[0];

// After:
const commentTextareas = await waitFor(() => within(container).getAllByRole('textbox'));
const commentInput =
  commentTextareas.find(textarea => {
    const label = textarea.getAttribute('aria-label');
    return label === 'Comment';
  }) || commentTextareas[commentTextareas.length - 1];
```

**Status:** ✅ **FIXED** - Test now passes (all 19 ListGroup tests passing)
