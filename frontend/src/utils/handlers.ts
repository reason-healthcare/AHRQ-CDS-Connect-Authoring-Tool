import React from 'react';
import { findClosest } from './find';

/**
 * Opens the external link (e.g., signup or feedback) in a new browser window
 * @param e - The event from the handler that invoked this function
 */
export function onVisitExternalForm(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>): void {
  const width = window.innerWidth * 0.9 || 800;
  const height = window.innerHeight * 0.9 || 800;
  const link = findClosest(e.target as Node, 'a') as HTMLAnchorElement | null;
  if (link) {
    window.open(link.href, '', `width=${width}, height=${height} ,resizable=yes , scrollbars=yes`);
  }
  e.preventDefault();
}
