import React from 'react';
import { render, screen, fireEvent } from 'utils/test-utils';
import NumberModifier from '../NumberModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  name?: string;
  value?: string;
  [key: string]: unknown;
}

describe('<NumberModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<NumberModifier handleUpdateModifier={jest.fn()} name="number-modifier-test" value={'0'} {...props} />);

  it('calls handleUpdateModifier on input change for integer', () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: '3' });
  });

  it('calls handleUpdateModifier on input change for decimal', () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '.3' } });

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: '0.3' });
  });

  it('calls handleUpdateModifier on input change for negative decimal', () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-.3' } });

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: '-0.3' });
  });
});
