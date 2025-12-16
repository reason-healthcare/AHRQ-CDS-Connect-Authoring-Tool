import React from 'react';
import { changeDate, changeTime, render, userEvent, screen, waitFor } from 'utils/test-utils';
import DateTimeModifier from '../DateTimeModifier';

interface DateTimeValues {
  date?: string;
  time?: string | null;
  precision?: string;
}

interface RenderComponentProps {
  name?: string;
  handleUpdateModifier?: jest.Mock;
  values?: DateTimeValues;
  [key: string]: unknown;
}

describe('<DateTimeModifier />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(<DateTimeModifier name="date-time-modifier-test" handleUpdateModifier={jest.fn()} values={{}} {...props} />);

  it('calls handleUpdateModifier on input change for date time modifier with no precision', async () => {
    const handleUpdateModifier = jest.fn();
    const values: DateTimeValues = { date: '', time: '' };
    renderComponent({ handleUpdateModifier, values });

    await changeDate('01/01/2020');
    expect(handleUpdateModifier).toHaveBeenCalledTimes(1);
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: '@2020-01-01',
      time: null
    });

    await waitFor(() => expect(screen.queryByRole('button', { name: /ok/i })).toBeNull(), {
      interval: 200
    });

    await changeTime('10:00:00');
    expect(handleUpdateModifier).toHaveBeenCalledTimes(2);
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: null,
      time: '@T10:00:00'
    });
  }, 30000);

  it('calls handleUpdateModifier on input change for date time modifier with precision', async () => {
    const handleUpdateModifier = jest.fn();
    const values: DateTimeValues = { date: '', time: '', precision: '' };
    renderComponent({ handleUpdateModifier, values });

    await changeDate('01/01/2020');
    await waitFor(() => expect(screen.queryByRole('button', { name: /ok/i })).toBeNull(), {
      interval: 200
    });
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: '@2020-01-01',
      time: null
    });

    await changeTime('10:00:00');
    await waitFor(() => expect(screen.queryByRole('button', { name: /ok/i })).toBeNull(), {
      interval: 200
    });
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: null,
      time: '@T10:00:00'
    });

    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /Precision/ })));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'year' })));
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: null,
      time: null,
      precision: 'year'
    });
  }, 60000);

  it('calls handleUpdateModifier on input change for date time modifier with time and precision', async () => {
    const handleUpdateModifier = jest.fn();
    const values: DateTimeValues = { time: '', precision: '' };
    renderComponent({ handleUpdateModifier, values });

    await changeTime('10:00:00');
    await waitFor(() => expect(screen.queryByRole('button', { name: /ok/i })).toBeNull(), {
      interval: 200
    });
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: null,
      time: '@T10:00:00'
    });

    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: /Precision/ })));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'minute' })));
    expect(handleUpdateModifier).toHaveBeenCalledWith({
      date: null,
      time: null,
      precision: 'minute'
    });
  }, 60000);
});
