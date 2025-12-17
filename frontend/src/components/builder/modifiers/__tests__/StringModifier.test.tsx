import React from 'react';
import { screen, render, fireEvent } from 'utils/test-utils';
import StringModifier from '../StringModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  name?: string;
  value?: string;
  [key: string]: unknown;
}

describe('<StringModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<StringModifier handleUpdateModifier={jest.fn()} name="string-modifier-test" value="" {...props} />);

  it('calls handleUpdateModifier on input change', () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: 'test' });
  });
});
