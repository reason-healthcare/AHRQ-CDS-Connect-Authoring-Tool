import React from 'react';
import { Prism } from 'prism-react-renderer';
import type { Grammar } from 'prismjs';
import CodeViewer from './CodeViewer';
import cqlStylingRules from './CqlStylingRules';
import cqlStylingTheme from './CqlStylingTheme';

Prism.languages.cql = cqlStylingRules as Grammar;

interface CqlViewerProps {
  code: string;
}

// Component that shows syntax highlighted CQL code
const CqlViewer: React.FC<CqlViewerProps> = ({ code }) => {
  return <CodeViewer code={code} language={'cql'} theme={cqlStylingTheme} />;
};

export default CqlViewer;
