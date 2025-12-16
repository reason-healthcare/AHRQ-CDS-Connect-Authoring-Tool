import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, userEvent, screen, waitFor } from 'utils/test-utils';
import SelectModifier from '../SelectModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  name?: string;
  value?: string;
  [key: string]: unknown;
}

describe('<SelectModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<SelectModifier handleUpdateModifier={jest.fn()} name="select-modifier-test" value="" {...props} />);

  afterAll(() => nock.restore());

  it('calls handleUpdateModifier on selection change', async () => {
    nock('http://localhost')
      .get('/authoring/api/config/conversions')
      .reply(200, [{ name: 'Convert.to_mg_per_dL', description: 'mmol/L to mg/dL' }]);

    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /select-modifier-test/ })));
    await waitFor(() => userEvent.click(screen.getByText('mmol/L to mg/dL')));

    expect(handleUpdateModifier).toHaveBeenCalledWith({
      value: 'Convert.to_mg_per_dL',
      templateName: 'Convert.to_mg_per_dL',
      description: 'mmol/L to mg/dL'
    });
  });
});
