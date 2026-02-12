'use client';

import { useEffect, useRef } from 'react';

interface LegacyContentRunnerProps {
  html: string;
}

/**
 * Renders legacy HTML content and executes any inline <script> tags.
 *
 * React's dangerouslySetInnerHTML doesn't execute <script> tags inserted via innerHTML.
 * This component works around that by:
 * 1. Inserting the HTML (including <script> tags) via innerHTML
 * 2. Finding all <script> elements in the container
 * 3. Replacing each with a fresh <script> element (which the browser WILL execute)
 */
export default function LegacyContentRunner({ html }: LegacyContentRunnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || executedRef.current) return;
    executedRef.current = true;

    // Find all script tags that were inserted via innerHTML (they won't have executed)
    const scripts = container.querySelectorAll('script');
    const created: HTMLScriptElement[] = [];

    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');

      // Copy all attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy the inline code
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      // Replace the old (non-executing) script with the new one
      oldScript.parentNode?.replaceChild(newScript, oldScript);
      created.push(newScript);
    });

    return () => {
      created.forEach((el) => {
        try { el.remove(); } catch {}
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
