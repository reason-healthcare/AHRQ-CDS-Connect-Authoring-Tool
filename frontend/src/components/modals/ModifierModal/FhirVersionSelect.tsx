import React from 'react';
import { Button } from '@mui/material';

import { useTextStyles } from 'styles/hooks';
import useStyles from './styles';

interface FhirVersion {
  version: string;
  label: string;
}

const fhirVersions: FhirVersion[] = [
  { version: '4.0.x', label: 'R4' },
  { version: '3.0.0', label: 'STU3' },
  { version: '1.0.2', label: 'DSTU2' }
];

interface FhirVersionSelectProps {
  handleSetFhirVersion: (version: string) => void;
}

const FhirVersionSelect: React.FC<FhirVersionSelectProps> = ({ handleSetFhirVersion }) => {
  const textStyles = useTextStyles();
  const styles = useStyles();

  return (
    <div>
      <div>
        <div>Select FHIR version to use:</div>

        <span className={textStyles.italic}>
          <span className={textStyles.bold}>Note:</span> Once the modifier you built is added, the artifact will be
          'locked' to the version you select here unless removed.
        </span>
      </div>

      <div>
        {fhirVersions.map(fhirVersion => (
          <Button
            key={fhirVersion.version}
            className={styles.versionButton}
            color="primary"
            onClick={() => handleSetFhirVersion(fhirVersion.version)}
            variant="contained"
          >
            {fhirVersion.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FhirVersionSelect;
