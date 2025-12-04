import PropTypes from 'prop-types';

type PropTypesValidator = PropTypes.Validator<unknown> & { isRequired?: PropTypes.Validator<unknown> };

export default function requiredIf(type: PropTypesValidator, condition: (props: Record<string, unknown>) => boolean) {
  return function testProps(props: Record<string, unknown>, propName: string, componentName: string) {
    const test = condition(props) ? type.isRequired || type : type;
    return test.apply(this, [props, propName, componentName]);
  };
}
