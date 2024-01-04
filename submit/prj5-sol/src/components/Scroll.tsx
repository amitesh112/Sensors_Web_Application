import React from 'react';

type ScrollProps = {
  prevLink?: string;
  nextLink?: string;
  onPrevClick: () => void;
  onNextClick: () => void;
};

const Scroll: React.FC<ScrollProps> = ({ prevLink, nextLink, onPrevClick, onNextClick }) => {
  return (
    <div className="scroll">
      {prevLink && <a rel="prev" href="#" onClick={onPrevClick}>&lt;&lt;</a>}
      {nextLink && <a rel="next" href="#" onClick={onNextClick}>&gt;&gt;</a>}
    </div>
  );
};

export default Scroll;
// Scroll.tsx

