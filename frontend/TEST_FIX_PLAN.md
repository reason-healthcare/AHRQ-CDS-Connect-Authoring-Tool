# Test Fix Plan

## Current Status

- **Total Tests**: 687 passing, 25 failing, 3 skipped
- **Test Suites**: 70 passing, 4 failing

## Failing Test Suites

### 1. Recommendations.test.js (16 failing, 10 passing) - HIGH PRIORITY

**Root Cause:**
The `Recommendation` component's `onChange` handlers use `recommendationRef.current`, which becomes stale because:

1. The test uses a mock Redux store that doesn't update: `createStore(x => x, ...)`
2. When `handleUpdateRecommendations` is called, Redux doesn't update
3. The parent component doesn't re-render with new props
4. `recommendationRef.current` stays stale even after `useEffect` runs

**Solution:**
Use the `recommendation` prop directly in handlers (it's current at render time). The prop contains the structure we need; we only update the specific field with the event value.

**Implementation:**

1. Remove `recommendationRef` and related `useEffect`
2. Update all handlers to use `recommendation` prop directly
3. For text field: `{ ...recommendation, text: event.target.value }`
4. Apply same pattern to all update handlers

**Files:**

- `frontend/src/components/builder/recommendations/Recommendation.js`

**Steps:**

```javascript
// Remove:
const recommendationRef = useRef(recommendation);
useEffect(() => {
  recommendationRef.current = recommendation;
}, [recommendation]);

// Change all handlers from:
updateRecommendation(recommendationRef.current, 'field', value)
// To:
updateRecommendation(recommendation, 'field', value)

// Or for direct construction:
{ ...recommendation, field: value }
```

---

### 2. ModifierModal.test.js (7 failing) - MEDIUM PRIORITY

**Root Cause:**
The `testId='operator-select'` IS defined in the code (`RuleCard.tsx` line 96), but it's not being applied to the DOM element. The issue is:

1. `SelectProps.SelectDisplayProps` is passed to the `Dropdown` component
2. `Dropdown` uses Material-UI's `TextField` with `select={true}` and spreads `{...props}`
3. Material-UI's `TextField` with `select` should forward `SelectProps`, but `SelectDisplayProps` may not be applied correctly
4. The `testId` exists in code but doesn't appear in the rendered DOM

**Solution:**

1. **Option A**: Apply `data-testid` directly to the `TextField` in `Dropdown` component when `SelectProps.SelectDisplayProps` is provided
2. **Option B**: Update `RuleCard` to pass `data-testid` directly as a prop to `Dropdown` instead of nested in `SelectProps`
3. **Option C**: Update test to use alternative query method (e.g., `getByRole('combobox')` with label)

**Files to Modify:**

- `frontend/src/components/elements/Dropdown/Dropdown.tsx` - Apply SelectDisplayProps correctly
- OR `frontend/src/components/modals/ModifierModal/ModifierBuilder/RuleCard.tsx` - Pass testId differently
- OR `frontend/src/components/modals/__tests__/ModifierModal.test.js` - Update test queries

**Recommended Approach:**
Apply `SelectDisplayProps` directly to the TextField's input element, or extract and apply the testId from `SelectProps.SelectDisplayProps` in the `Dropdown` component.

**Steps:**

1. Check how Material-UI TextField with select handles SelectDisplayProps
2. Modify `Dropdown` to extract and apply `SelectDisplayProps.data-testid` to the input element
3. Or modify `RuleCard` to pass testId as a direct prop
4. Test to verify the testId appears in DOM

---

### 3. Tester.test.js (1 failing) - LOW PRIORITY

**Root Cause:**
DSTU2 patient test expects `MeetsInclusionCriteria = true` but gets `null`. Likely mock data or CQL execution issue.

**Solution:**

1. Check `mockPatientDstu2` has required encounter resources
2. Verify CQL execution result mapping
3. Check patient ID matching

**Files:**

- `frontend/src/components/testing/__tests__/Tester.test.js`
- `frontend/src/queries/testing/executeArtifact.ts`
- Test fixtures

---

### 4. Workspace.test.js - VERIFY

**Status:** Should be fixed (added `aria-label` to `ElementCardLabel`)

**Action:** Run test to confirm it passes

---

## Implementation Order

1. **Fix Recommendations tests** (16 failures)
   - Remove ref approach
   - Use `recommendation` prop directly
   - Test each failing test

2. **Fix ModifierModal tests** (7 failures)
   - Find operator select component
   - Add testId or update test query

3. **Investigate Tester test** (1 failure)
   - Check mock data
   - Verify execution logic

4. **Verify Workspace test** (should pass)

## Testing Commands

```bash
# Run specific test suite
npm run test -- --testPathPattern="Recommendations"

# Run specific test
npm run test -- --testPathPattern="Recommendations" --testNamePattern="can update a recommendation"

# Run all tests
npm run test -- --watchAll=false

# Check linting
npm run lint

# Check formatting
npm run format
```

## Success Criteria

✅ All 25 failing tests pass
✅ No new failures introduced
✅ All 687 passing tests continue to pass
✅ Code passes linting and formatting
