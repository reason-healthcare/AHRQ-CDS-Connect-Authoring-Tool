import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { render, userEvent, fireEvent, screen, waitFor } from 'utils/test-utils';
import CodeEditor, { type CodeValue } from '../CodeEditor';

interface RootState {
  [key: string]: unknown;
}

interface RenderComponentProps {
  handleUpdateEditor?: jest.Mock;
  isConcept?: boolean;
  value?: unknown;
  [key: string]: unknown;
}

describe('<CodeEditor />', () => {
  const renderUnauthenticatedComponent = (props: RenderComponentProps = {}) =>
    render(
      <CodeEditor
        handleUpdateEditor={jest.fn()}
        isConcept={false}
        value={(props.value ?? null) as CodeValue | CodeValue[] | null}
      />
    );

  const renderComponent = (props: RenderComponentProps = {}) =>
    render(
      <Provider store={createStore((x: RootState) => x, { vsac: { apiKey: 'abcd-1234' } } as RootState)}>
        <CodeEditor
          handleUpdateEditor={(props.handleUpdateEditor as ((value: unknown) => void) | undefined) || jest.fn()}
          isConcept={props.isConcept || false}
          value={(props.value ?? null) as CodeValue | CodeValue[] | null}
        />
      </Provider>
    );

  describe('Code Editor', () => {
    it('shows Authenticate VSAC button if unauthenticated', () => {
      const { getByText } = renderUnauthenticatedComponent();

      expect(getByText('Authenticate VSAC')).toBeInTheDocument();
    });

    it('calls handleUpdateEditor with code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toHaveBeenCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Code '123' from "SNOMED"`
      });
    });

    it('can add more than one code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      await waitFor(() => userEvent.click(screen.getByRole('button', { hidden: true })));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '456' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toHaveBeenCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Code '123' from "SNOMED"`
      });

      expect(handleUpdateEditor).toHaveBeenCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '456',
        display: '',
        str: `Code '456' from "SNOMED"`
      });
    });
  });

  describe('Concept Editor', () => {
    it('shows Authenticate VSAC button if unauthenticated', () => {
      const { getByText } = renderUnauthenticatedComponent({ isConcept: true });

      expect(getByText('Authenticate VSAC')).toBeInTheDocument();
    });

    it('calls handleUpdateEditor with code', async () => {
      const handleUpdateEditor = jest.fn();
      const { getByText } = renderComponent({ handleUpdateEditor, isConcept: true });

      expect(getByText('Add Code')).toBeInTheDocument();

      await waitFor(() => userEvent.click(screen.getByRole('button')));
      fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: '123' } });
      await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: 'Code system' })));
      await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'SNOMED' })));
      await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Select' })));

      expect(handleUpdateEditor).toHaveBeenCalledWith({
        id: expect.any(String),
        system: 'SNOMED',
        uri: 'http://snomed.info/sct',
        code: '123',
        display: '',
        str: `Concept { Code '123' from "SNOMED" }`
      });
    });
  });
});
