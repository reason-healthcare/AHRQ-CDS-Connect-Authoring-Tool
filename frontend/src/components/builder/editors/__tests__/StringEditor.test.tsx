import React from 'react';
import { render, fireEvent, screen } from 'utils/test-utils';
import StringEditor from '../StringEditor';

interface RenderComponentProps {
  handleUpdateEditor?: jest.Mock;
  value?: string | null;
  [key: string]: unknown;
}

describe('<StringEditor />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<StringEditor handleUpdateEditor={jest.fn()} value={null} {...props} />);

  it('calls handleUpdateEditor with string', () => {
    const handleUpdateEditor = jest.fn();
    renderComponent({ handleUpdateEditor });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });

    expect(handleUpdateEditor).toHaveBeenCalledWith(`'test'`);
  });

  it('calls handleUpdateEditor with empty', () => {
    const handleUpdateEditor = jest.fn();
    renderComponent({ handleUpdateEditor, value: 'test' });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });

    expect(handleUpdateEditor).toHaveBeenCalledWith(null);
  });
});
