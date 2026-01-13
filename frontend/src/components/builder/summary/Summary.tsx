import React from 'react';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import SummaryDetails from './SummaryDetails';
import SummaryHeader from './SummaryHeader';
import { CircularProgress } from '@mui/material';
import type { Artifact } from '../../../types/artifact';
import type { Instance } from '../../../utils/instances';
import type { InclusionExclusionChild } from './InclusionExclusionCard';

interface SummaryProps {
  handleSaveArtifact: (artifact: Artifact | null, artifactProps: Record<string, unknown>) => void;
}

const Summary: React.FC<SummaryProps> = ({ handleSaveArtifact }) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);

  const getSummaryDetailsFromInstance = (instance: Instance) => {
    const isGroup = instance.name === 'And' || instance.name === 'Or';
    const nameField = instance.fields?.find(field => field.id === 'element_name');
    return {
      elementId: instance.uniqueId,
      elementName: (nameField as { value?: string })?.value,
      elementType: isGroup ? 'Group' : instance.name,
      operand: isGroup ? instance.name : null
    };
  };

  interface SummaryTreeItem {
    elementId?: string;
    elementName?: string;
    elementType?: string;
    operand?: string | null;
    childInstances?: SummaryTreeItem[];
  }

  const getSummaryDetailsFromTree = (tree: Instance): SummaryTreeItem[] => {
    return (tree.childInstances || []).map(instance => {
      const details = getSummaryDetailsFromInstance(instance);
      return {
        ...details,
        childInstances: instance.childInstances ? getSummaryDetailsFromTree(instance) : []
      };
    });
  };

  const getSummaryDetailsFromArtifact = (treeName: string): SummaryTreeItem[] => {
    if (!artifact) return [];
    const tree = (artifact as Record<string, Instance | undefined>)[treeName] as Instance | undefined;
    if (!tree) return [];
    return getSummaryDetailsFromTree(tree);
  };

  if (!artifact) {
    return <CircularProgress />;
  }

  return (
    <>
      <SummaryHeader handleSaveArtifact={handleSaveArtifact} />
      <SummaryDetails
        summaryType="expTreeInclude"
        summaryDetails={{
          childInstances: getSummaryDetailsFromArtifact('expTreeInclude') as InclusionExclusionChild[]
        }}
      />
      <SummaryDetails
        summaryType="expTreeExclude"
        summaryDetails={{
          childInstances: getSummaryDetailsFromArtifact('expTreeExclude') as InclusionExclusionChild[]
        }}
      />
      <SummaryDetails
        summaryType="recommendations"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summaryDetails={{ recommendations: (artifact.recommendations || []) as any }}
      />
    </>
  );
};

export default Summary;
