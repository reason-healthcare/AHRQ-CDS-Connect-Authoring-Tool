import React from 'react';
import { Highlight } from 'prism-react-renderer';
import type { PrismTheme } from 'prism-react-renderer';

interface CodeViewerProps {
  code: string;
  language: string;
  theme: PrismTheme;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, language, theme }) => {
  return (
    <Highlight code={code} language={language} theme={theme}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: '10px', marginBottom: '0px' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

export default CodeViewer;
