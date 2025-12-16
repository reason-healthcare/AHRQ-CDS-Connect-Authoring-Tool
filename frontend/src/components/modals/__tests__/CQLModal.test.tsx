import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, userEvent, screen, waitFor } from 'utils/test-utils';
import CQLModal from '../CQLModal';

interface ApiResponse {
  cqlFiles: Array<{
    name: string;
    text: string;
  }>;
}

describe('<CQLModal />', () => {
  afterAll(() => nock.restore());

  const apiResponse: ApiResponse = {
    cqlFiles: [
      {
        name: 'Example CQL File Name',
        text: "library \"Example\" version '1'\r\n\r\nusing FHIR version '4.0.1'\r\n\r\ncodesystem \"CONDVERSTATUS\": 'http://terminology.hl7.org/CodeSystem/condition-ver-status'\r\n\r\n"
      }
    ]
  };

  it('can close modal with "Close" button', async () => {
    nock('http://localhost').post('/authoring/api/cql/viewCql').reply(200, apiResponse);
    const handleCloseModal = jest.fn();
    render(<CQLModal handleCloseModal={handleCloseModal} artifact={{}} dataModel={{ version: '4.0.1' }} />);
    await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Close' })));
    expect(handleCloseModal).toHaveBeenCalled();
  });

  it('displays expected CQL', async () => {
    nock('http://localhost').post('/authoring/api/cql/viewCql').reply(200, apiResponse);
    const handleCloseModal = jest.fn();
    render(<CQLModal handleCloseModal={handleCloseModal} artifact={{}} dataModel={{ version: '4.0.1' }} />);
    expect(await screen.findByText(/Example CQL File Name/)).toBeInTheDocument();
    expect(await screen.findByText(/CONDVERSTATUS/)).toBeInTheDocument();
  });
});
