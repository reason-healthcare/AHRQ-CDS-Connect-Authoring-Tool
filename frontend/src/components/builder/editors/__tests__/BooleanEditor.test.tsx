import React from 'react';
import { render, userEvent, screen, waitFor } from 'utils/test-utils';
import BooleanEditor from '../BooleanEditor';

interface RenderComponentProps {
  handleUpdateEditor?: jest.Mock;
  value?: string | null;
  [key: string]: unknown;
}

describe('<BooleanEditor />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<BooleanEditor handleUpdateEditor={jest.fn()} value={null} {...props} />);

  it('calls handleUpdateEditor with True', async () => {
    const handleUpdateEditor = jest.fn();
    renderComponent({ handleUpdateEditor });

    await waitFor(() => userEvent.click(screen.getByRole('combobox')));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'True' })));

    expect(handleUpdateEditor).toHaveBeenCalledWith('true');
  });

  it('calls handleUpdateEditor with False', async () => {
    const handleUpdateEditor = jest.fn();
    renderComponent({ handleUpdateEditor });

    await waitFor(() => userEvent.click(screen.getByRole('combobox')));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'False' })));

    expect(handleUpdateEditor).toHaveBeenCalledWith('false');
  });
});
