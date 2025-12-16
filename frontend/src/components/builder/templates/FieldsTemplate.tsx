import React from 'react';
import clsx from 'clsx';

import { NumberField, StaticField, StringField, TextAreaField, ValueSetField } from 'components/builder/fields';
import type { Field } from '../../../types/artifact';
import { useFieldStyles } from 'styles/hooks';

interface FieldTemplateProps {
  field: Field;
  handleUpdateField: (field: Field) => void;
}

const FieldTemplate: React.FC<FieldTemplateProps> = ({ field, handleUpdateField }) => {
  const fieldStyles = useFieldStyles();

  const fieldComponent = (() => {
    if (field.static) return <StaticField />;

    switch (field.type) {
      case 'number':
        return <NumberField field={field} handleUpdateField={handleUpdateField} />;
      case 'string':
        return <StringField field={field} handleUpdateField={handleUpdateField} />;
      case 'textarea':
        return <TextAreaField field={field} handleUpdateField={handleUpdateField} />;
      case 'valueset':
        return (
          <ValueSetField
            field={
              field as Field & {
                select?: string;
                value?: { id: string; name: string; label?: string; value?: string | number; [key: string]: unknown };
              }
            }
            handleUpdateField={handleUpdateField}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className={fieldStyles.field} id="field-template">
      <div className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelTall)}>{field.name}:</div>
      <div className={fieldStyles.fieldInputGroup}>{fieldComponent}</div>
    </div>
  );
};

interface FieldsTemplateProps {
  fields: Field[];
  handleUpdateField: (field: Field) => void;
}

const FieldsTemplate: React.FC<FieldsTemplateProps> = ({ fields, handleUpdateField }) => (
  <div id="fields-template">
    {fields.map((field, index) => (
      <FieldTemplate key={index} field={field} handleUpdateField={handleUpdateField} />
    ))}
  </div>
);

export default FieldsTemplate;
