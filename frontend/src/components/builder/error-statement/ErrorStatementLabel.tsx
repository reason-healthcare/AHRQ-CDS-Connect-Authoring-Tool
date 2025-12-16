import React from 'react';

import useStyles from './styles';

interface ErrorStatementLabelProps {
  text: string;
}

const ErrorStatementLabel: React.FC<ErrorStatementLabelProps> = ({ text }) => {
  const styles = useStyles();

  return (
    <div className={styles.label}>
      <div className={styles.labelCorner} />
      <div className={styles.labelLine} />
      <div className={styles.labelText}>{text}</div>
    </div>
  );
};

export default ErrorStatementLabel;
