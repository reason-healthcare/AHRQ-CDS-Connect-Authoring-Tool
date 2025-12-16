import React from 'react';
import { render, userEvent, screen, waitFor } from 'utils/test-utils';
import CheckExistenceModifier from '../CheckExistenceModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  value?: string;
  [key: string]: unknown;
}

describe('<CheckExistenceModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<CheckExistenceModifier handleUpdateModifier={jest.fn()} value="" {...props} />);

  it('calls handleUpdateModifier on input change', async () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /Check existence/ })));
    await waitFor(() => userEvent.click(screen.getByText('is null')));

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: 'is null' });
  });
});
