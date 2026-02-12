'use client';

import { useEffect } from 'react';

interface LegacyInlineScriptsProps {
  scripts: string[];
}

/**
 * Evaluates inline <script> content extracted from legacy HTML pages.
 * React's dangerouslySetInnerHTML doesn't execute <script> tags,
 * so this component runs them after the DOM content is rendered.
 */
export default function LegacyInlineScripts({ scripts }: LegacyInlineScriptsProps) {
  useEffect(() => {
    if (!scripts.length) return;

    const scriptElements: HTMLScriptElement[] = [];

    scripts.forEach((code) => {
      const script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);
      scriptElements.push(script);
    });

    return () => {
      scriptElements.forEach((el) => el.remove());
    };
  }, [scripts]);

  return null;
}
