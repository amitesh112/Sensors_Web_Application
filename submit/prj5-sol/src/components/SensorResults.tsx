// SensorResults.tsx
import React from 'react';

interface SensorResultsProps {
  results: Record<string, string>[];
}

const SensorResults: React.FC<SensorResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return <p>No results found.</p>;
  }

  return (
    <ul className="results">
      {results.map((result, index) => (
        <ul key={index} className="result">
          <dl>
            {Object.entries(result).map(([key, value]) => (
              <React.Fragment key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </ul>
      ))}
    </ul>
  );
};

export default SensorResults;
