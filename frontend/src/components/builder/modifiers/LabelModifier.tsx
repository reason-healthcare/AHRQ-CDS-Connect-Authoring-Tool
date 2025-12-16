import React from 'react';

import useStyles from './styles';

interface LabelModifierProps {
  name: string;
}

const LabelModifier: React.FC<LabelModifierProps> = ({ name }) => {
  const styles = useStyles();

  return <div className={styles.modifier}>{name}</div>;
};

export default LabelModifier;
