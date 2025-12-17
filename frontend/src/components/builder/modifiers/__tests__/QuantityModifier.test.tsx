import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, screen, fireEvent, userEvent, waitFor } from 'utils/test-utils';
import QuantityModifier, { QuantityModifierProps } from '../QuantityModifier';

describe('<QuantityModifier />', () => {
  const renderComponent = (props: QuantityModifierProps | {} = {}) =>
    render(
      <QuantityModifier
        handleUpdateModifier={jest.fn()}
        name="quantity-modifier-test"
        unit=""
        value={0}
        {...(props as Partial<{ value?: number }>)}
      />
    );

  afterAll(() => nock.restore());

  it('can change the quantity', () => {
    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    fireEvent.change(screen.getByRole('textbox', { name: 'Value' }), { target: { value: '3' } });

    expect(handleUpdateModifier).toHaveBeenCalledWith({ unit: '', value: 3 });
  });

  it('can search for and change the unit', async () => {
    const scope = nock('https://clin-table-search.lhc.nlm.nih.gov')
      .get('/api/ucum/v3/search?terms=mg/dL')
      .reply(200, [1, ['mg/dL'], null, [['mg/dL', 'milligram per deciliter']]]);

    const handleUpdateModifier = jest.fn();
    renderComponent({ handleUpdateModifier });

    const unitAutocomplete = screen.getByRole('combobox', { name: 'Unit' });
    await userEvent.click(unitAutocomplete);
    fireEvent.change(unitAutocomplete, { target: { value: 'mg/dL' } });
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'mg/dL (milligram per deciliter)' })));

    expect(handleUpdateModifier).toHaveBeenCalledWith({ unit: 'mg/dL', value: '' });

    scope.done();
  }, 30000);
});
