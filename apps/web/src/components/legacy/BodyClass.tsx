'use client';

import { useEffect } from 'react';

interface BodyClassProps {
  className?: string;
}

export default function BodyClass({ className }: BodyClassProps) {
  useEffect(() => {
    if (!className) return;
    const classes = className.split(' ').filter(Boolean);
    if (classes.length === 0) return;

    document.body.classList.add(...classes);
    return () => {
      document.body.classList.remove(...classes);
    };
  }, [className]);

  return null;
}
