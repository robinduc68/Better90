import { useId } from 'react';

/** Unique, url()-safe id for SVG defs (clipPath, gradients) per component instance. */
export function useSvgId(prefix: string): string {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}
