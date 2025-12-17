import React from 'react';
import Landing from '../Landing';
import { render } from 'utils/test-utils';

describe('<Landing />', () => {
  const renderComponent = ({ pathname = '/', ...props }: { pathname?: string; [key: string]: unknown } = {}) =>
    render(<Landing {...props} />);

  it('renders without crashing', () => {
    const { container } = renderComponent();

    expect(container).not.toBeEmptyDOMElement();
  });
});
