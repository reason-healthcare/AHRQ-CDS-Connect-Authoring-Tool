import React from 'react';
import LabelModifier from '../LabelModifier';
import { render } from 'utils/test-utils';

interface RenderComponentProps {
  name?: string;
  [key: string]: unknown;
}

describe('<LabelModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) => render(<LabelModifier name="label" {...props} />);

  it('renders the name', () => {
    const { container } = renderComponent({ name: 'label modifier test' });

    expect(container).toHaveTextContent('label modifier test');
  });
});
