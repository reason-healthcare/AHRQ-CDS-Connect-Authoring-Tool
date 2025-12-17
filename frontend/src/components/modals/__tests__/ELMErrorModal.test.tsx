import React from 'react';
import { render, userEvent, screen, within, waitFor } from 'utils/test-utils';
import { ELMErrorModal } from 'components/modals';
import { ELMError } from '../ELMErrorModal';

describe('<ELMErrorModal />', () => {
  it('renders the error messages', () => {
    const errors = [{ message: 'Message 1' }, { message: 'Message 2' }, { message: 'Message 1' }] as ELMError[];
    render(<ELMErrorModal handleCloseModal={jest.fn()} errors={errors} />);

    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('We detected some errors in the ELM files you just used:')).toBeInTheDocument();

    const errorMessages = dialog.getAllByRole('listitem');
    expect(errorMessages).toHaveLength(2);
    expect(errorMessages[0]).toHaveTextContent('Message 1');
    expect(errorMessages[1]).toHaveTextContent('Message 2');
  });

  it('calls the closeModal prop when closed', async () => {
    const closeModal = jest.fn();

    const errors = [{ message: 'Message 1' }, { message: 'Message 2' }, { message: 'Message 1' }] as ELMError[];
    render(<ELMErrorModal handleCloseModal={closeModal} errors={errors} />);

    const dialog = within(screen.getByRole('dialog'));
    await waitFor(() => userEvent.click(dialog.getByText('Close')));

    expect(closeModal).toHaveBeenCalled();
  });
});
