import React, { useState, useEffect } from 'react';

type FormResultProps = {
  resultContainerId: string;
  result: Record<string, string>;
};

const FormResult: React.FC<FormResultProps> = ({ result }) => {

    const [dlElement, setDlElement] = useState<JSX.Element | null>(null);

  useEffect(() => {
    // Generate dl elements based on the result
    const dlElement = (
        <dl className="result">
          {Object.entries(result).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      );

    setDlElement(dlElement);
  }, [result]);

  return <div className="results">{dlElement}</div>;
};

export default FormResult;