import React, { useMemo } from 'react';
import clsx from 'clsx';

import useStyles from './styles';

interface KeyValueItem {
  key: string;
  value: React.ReactNode;
}

interface KeyValueListProps {
  dense?: boolean;
  list: KeyValueItem[];
}

let id = 0;

const KeyValueList: React.FC<KeyValueListProps> = ({ dense = false, list }) => {
  const styles = useStyles();
  const uniqueId = useMemo(() => `kv-${(id += 1)}`, []);

  return (
    <div className={clsx(styles.list, dense && styles.denseList)}>
      {list.map((item, index) => (
        <div key={index} className={clsx(styles.item, dense && styles.denseItem)}>
          <div id={`kv-${uniqueId}-${index}`} className={clsx(styles.key, dense && styles.denseKey)}>
            {item.key}:
          </div>
          <div aria-labelledby={`kv-${uniqueId}-${index}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default KeyValueList;
