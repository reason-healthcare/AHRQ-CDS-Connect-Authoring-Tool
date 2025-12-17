import { isReturnTypeValid } from '../instances';
import type { Instance } from '../instances';
import createTemplateInstance from '../templates';
import { genericInstance, emptyInstanceTree } from '../test_fixtures';

describe('instance utils', () => {
  describe('isReturnTypeValid', () => {
    describe('and and or', () => {
      it('should return true if return type is boolean', () => {
        const isValid_and = isReturnTypeValid('boolean', 'And', []);
        expect(isValid_and).toEqual(true);
        const isValid_or = isReturnTypeValid('boolean', 'Or', []);
        expect(isValid_or).toEqual(true);
      });

      it('should return true if there is only one child no matter the return type', () => {
        const isValid_and = isReturnTypeValid('observation', 'And', [
          createTemplateInstance(genericInstance) as Instance
        ]);
        expect(isValid_and).toEqual(true);
        const isValid_or = isReturnTypeValid('observation', 'Or', [
          createTemplateInstance(genericInstance) as Instance
        ]);
        expect(isValid_or).toEqual(true);
      });

      it('should return true if return type is not true and there are multiple children', () => {
        const childInstances = [createTemplateInstance(genericInstance), createTemplateInstance(genericInstance)];
        const isValid_and = isReturnTypeValid('boolean', 'And', childInstances as Instance[]);
        expect(isValid_and).toEqual(true);
        const isValid_or = isReturnTypeValid('boolean', 'Or', childInstances as Instance[]);
        expect(isValid_or).toEqual(true);
      });

      it('should return false if return type is not true and there are multiple children', () => {
        const childInstances = [createTemplateInstance(genericInstance), createTemplateInstance(genericInstance)];
        const isValid_and = isReturnTypeValid('observation', 'And', childInstances as Instance[]);
        expect(isValid_and).toEqual(false);
        const isValid_or = isReturnTypeValid('observation', 'Or', childInstances as Instance[]);
        expect(isValid_or).toEqual(false);
      });

      it('should return true if there are multiple nested children but return type is boolean', () => {
        const nestedAnd = createTemplateInstance(emptyInstanceTree);
        const childInstances = [createTemplateInstance(genericInstance), createTemplateInstance(genericInstance)];
        nestedAnd.childInstances = childInstances as Instance[];
        const isValid_and = isReturnTypeValid('boolean', 'And', [nestedAnd as Instance]);
        expect(isValid_and).toEqual(true);
        const isValid_or = isReturnTypeValid('boolean', 'Or', [nestedAnd as Instance]);
        expect(isValid_or).toEqual(true);
      });

      it('should return false if there are multiple nested children and return type is not boolean', () => {
        const nestedAnd = createTemplateInstance(emptyInstanceTree);
        const childInstances = [createTemplateInstance(genericInstance), createTemplateInstance(genericInstance)];
        nestedAnd.childInstances = childInstances as Instance[];
        const isValid_and = isReturnTypeValid('observation', 'And', [nestedAnd as Instance]);
        expect(isValid_and).toEqual(false);
        const isValid_or = isReturnTypeValid('observation', 'Or', [nestedAnd as Instance]);
        expect(isValid_or).toEqual(false);
      });
    });

    describe('union and intersect', () => {
      it('should always be true no matter what', () => {
        const isValid_union = isReturnTypeValid('observation', 'Union', []);
        expect(isValid_union).toEqual(true);

        const isValid_intersect = isReturnTypeValid('observation', 'Intersect', []);
        expect(isValid_intersect).toEqual(true);
      });
    });
  });
});
