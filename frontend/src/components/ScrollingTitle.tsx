'use client';

import { useEffect, useRef } from 'react';

export default function ScrollingTitle({ title }: { title: string }) {
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = text.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const measure = () => {
      const offset = parent.clientWidth - element.scrollWidth;
      element.dataset.overflow = String(offset < 0);
      element.style.setProperty('--wl-marquee-offset', `${offset}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [title]);
  return (
    <span ref={text} className="inline-block w-max whitespace-nowrap">
      {title}
    </span>
  );
}
