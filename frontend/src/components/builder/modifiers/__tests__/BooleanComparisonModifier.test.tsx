import React from 'react';
import { render, userEvent, screen, waitFor } from 'utils/test-utils';
import BooleanComparisonModifier from '../BooleanComparisonModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  value?: string;
  [key: string]: unknown;
}

describe('<BooleanComparisonModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<BooleanComparisonModifier handleUpdateModifier={jest.fn()} value="" {...props} />);

  it('calls handleUpdateModifier on input change', async () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    await waitFor(() => userEvent.click(screen.getByLabelText('Boolean')));
    await waitFor(() => userEvent.click(screen.getByText('is not true')));

    expect(handleUpdateModifier).toHaveBeenCalledWith({ value: 'is not true' });
  });
});
