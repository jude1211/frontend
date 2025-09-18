import React from 'react';

type TooltipProps = {
  id?: string;
  children?: React.ReactNode;
};

const ReactTooltip: React.FC<TooltipProps> & { rebuild?: () => void } = ({ children }) => {
  return <>{children}</>;
};

ReactTooltip.rebuild = () => {};

export default ReactTooltip;

