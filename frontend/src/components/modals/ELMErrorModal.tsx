import React from 'react';

import { Modal } from 'components/elements';

export interface ELMError {
  message: string;
  [key: string]: unknown;
}

interface ELMErrorModalProps {
  handleCloseModal: () => void;
  errors: ELMError[];
}

const ELMErrorModal: React.FC<ELMErrorModalProps> = ({ handleCloseModal, errors }) => {
  const uniqueErrors = [...new Set(errors.map(error => error.message))];

  return (
    <Modal
      title="About your CQL..."
      submitButtonText="Close"
      isOpen
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleCloseModal}
    >
      <div>
        We detected some errors in the ELM files you just used:
        <ul>
          {uniqueErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default ELMErrorModal;
