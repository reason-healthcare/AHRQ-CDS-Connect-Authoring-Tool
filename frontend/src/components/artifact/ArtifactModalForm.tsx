import React, { memo, useEffect } from 'react';
import { Form, useFormikContext } from 'formik';

import { TextField } from 'components/fields';
import cpgFields, { versionHelperText } from './cpgFields';
import useStyles from './styles';

interface ArtifactModalFormProps {
  setSubmitDisabled: (disabled: boolean) => void;
}

const ArtifactModalForm = memo<ArtifactModalFormProps>(({ setSubmitDisabled }) => {
  const { isValid } = useFormikContext();
  const styles = useStyles();

  useEffect(() => {
    setSubmitDisabled(!isValid);
  }, [isValid, setSubmitDisabled]);

  return (
    <Form className={styles.artifactForm}>
      <TextField name="name" label="Artifact Name" required={true} />
      <TextField name="version" label="Version" helperText={String(versionHelperText)} />

      {cpgFields.map(field => {
        const FormComponent = field.component;
        return <FormComponent key={field.name} {...field} />;
      })}
    </Form>
  );
});

ArtifactModalForm.displayName = 'ArtifactModalForm';

export default ArtifactModalForm;
