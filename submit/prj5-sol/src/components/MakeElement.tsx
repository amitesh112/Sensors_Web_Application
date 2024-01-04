import React from 'react';
import ReactDOM from 'react-dom';

type MakeElementProps = {
  tagName: string;
  attrs?: { [attr: string]: string };
  text?: string;
};

const MakeElement: React.FC<MakeElementProps> = ({ tagName, attrs = {}, text = '' }) => {
  const element = React.createElement(tagName, attrs, text);
  return <>{ReactDOM.createPortal(element, document.body)}</>;
};

export default MakeElement;
