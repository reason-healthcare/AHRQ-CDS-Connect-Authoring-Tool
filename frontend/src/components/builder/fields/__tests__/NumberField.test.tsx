import React from 'react';
import { render, fireEvent } from 'utils/test-utils';
import type { Field as ArtifactField } from 'types/artifact';
import NumberField from '../NumberField';

interface TestField extends ArtifactField {
  exclusive?: boolean;
}

interface RenderComponentProps {
  field?: TestField;
  isInteger?: boolean;
  handleUpdateField?: jest.Mock;
  [key: string]: unknown;
}

describe('<NumberField />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(
      <NumberField
        field={{ exclusive: false, name: 'age', id: 'age', value: '0', ...(props.field || {}) }}
        isInteger={true}
        handleUpdateField={jest.fn()}
        {...props}
      />
    );

  it('changes input with type integer', () => {
    const handleUpdateField = jest.fn();
    renderComponent({ handleUpdateField });

    const numberInput = document.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.change(numberInput, { target: { value: '10' } });

    expect(handleUpdateField).toHaveBeenCalledWith({ age: 10 });
  });

  it('changes input with type float', () => {
    const handleUpdateField = jest.fn();
    renderComponent({ isInteger: false, handleUpdateField });

    const numberInput = document.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.change(numberInput, { target: { value: '10.02345' } });

    expect(handleUpdateField).toHaveBeenCalledWith({ age: 10.02345 });
  });
});
