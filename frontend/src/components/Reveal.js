import React from "react";

/** Content wrapper that fades/slides in when scrolled into view (see useRevealObserver). */
export const Reveal = ({ children, className = "", delay = 0, as: Tag = "div", testId }) => (
  <Tag className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined} data-testid={testId}>
    {children}
  </Tag>
);
