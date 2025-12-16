import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, screen, fireEvent, waitFor } from 'utils/test-utils';
import WithUnitModifier from '../WithUnitModifier';

interface RenderComponentProps {
  handleUpdateModifier?: jest.Mock;
  unit?: string;
  [key: string]: unknown;
}

describe('<WithUnitModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<WithUnitModifier handleUpdateModifier={jest.fn()} unit="" {...props} />);

  afterAll(() => nock.restore());

  it('calls handleUpdateModifier when selection changes', async () => {
    nock('https://clin-table-search.lhc.nlm.nih.gov')
      .get('/api/ucum/v3/search?terms=mg/dL')
      .reply(200, [1, ['mg/dL'], null, [['mg/dL', 'milligram per deciliter']]]);

    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    const autocomplete = screen.getByRole('combobox') as HTMLInputElement;

    fireEvent.focus(autocomplete);
    fireEvent.change(autocomplete, { target: { value: 'mg/dL' } });
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    await waitFor(() => {
      expect(autocomplete.value).toEqual('mg/dL');
    });
  });
});
