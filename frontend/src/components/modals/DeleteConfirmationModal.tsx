import React from 'react';
import _ from 'lodash';

import { Modal } from 'components/elements';

interface DeleteConfirmationModalProps {
  children?: React.ReactElement;
  deleteType: string;
  handleCloseModal: () => void;
  handleDelete: () => void | Promise<void>;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  children,
  deleteType,
  handleCloseModal,
  handleDelete
}) => (
  <Modal
    title={`Delete ${_.upperFirst(deleteType)} Confirmation`}
    submitButtonText="Delete"
    isOpen
    handleCloseModal={handleCloseModal}
    handleSaveModal={handleDelete}
  >
    <>
      <h5>
        Are you sure you want to permanently delete the {children && 'following '}
        {deleteType}?
      </h5>
      {children && children}
    </>
  </Modal>
);

export default DeleteConfirmationModal;
