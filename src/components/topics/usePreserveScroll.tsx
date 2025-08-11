"use client";

import { useEffect, useRef } from 'react';

export function usePreserveScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const scrollPosRef = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = scrollPosRef.current;
    const onScroll = () => { scrollPosRef.current = el.scrollTop; };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  });
  return ref;
}

