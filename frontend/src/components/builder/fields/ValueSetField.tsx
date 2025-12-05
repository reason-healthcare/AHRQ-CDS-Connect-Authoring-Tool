import React from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { Dropdown } from 'components/elements';
import fetchValueSets from 'queries/fetchValueSets';
import { useFieldStyles } from 'styles/hooks';
import type { Field } from '../../../types/artifact';

interface ValueSetOption {
  id: string;
  name: string;
  label?: string;
  value?: string | number;
  [key: string]: unknown;
}

interface ValueSetFieldProps {
  field: Field & { select?: string; value?: ValueSetOption };
  handleUpdateField: (field: Field) => void;
}

const ValueSetField: React.FC<ValueSetFieldProps> = ({ field, handleUpdateField }) => {
  const fieldStyles = useFieldStyles();
  const query = { type: field.select || '' };
  const { data } = useQuery({
    queryKey: ['valueSets', query],
    queryFn: () => fetchValueSets(query),
    staleTime: Infinity
  });

  // The API returns an array directly, not an expansion object
  const valueSets: ValueSetOption[] = (data as unknown as ValueSetOption[]) || [];

  return (
    <div id="value-set-field">
      <Dropdown
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputMd)}
        id={field.id}
        label={field.name}
        labelKey="name"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const selectedValueSet = valueSets.find(valueSet => valueSet.id === event.target.value);
          if (selectedValueSet) {
            handleUpdateField({
              ...field,
              value: selectedValueSet as Field['value']
            });
          }
        }}
        options={valueSets.map(vs => ({ ...vs, label: vs.name, value: vs.id }))}
        value={
          valueSets.length > 0 && field.value && typeof field.value === 'object' && 'id' in field.value
            ? field.value.id
            : ''
        }
        valueKey="id"
      />
    </div>
  );
};

export default ValueSetField;
