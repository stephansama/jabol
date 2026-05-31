import { useCallback, useEffect, useRef, useState } from "react";

type Options<T> = {
  items: T[];
  onActivate: (item: T) => void;
  enabled?: boolean;
};

export function useKeyboardNav<T>({ items, onActivate, enabled = true }: Options<T>) {
  const [index, setIndex] = useState(-1);
  const itemsRef = useRef(items);
  const indexRef = useRef(index);
  itemsRef.current = items;
  indexRef.current = index;

  useEffect(() => {
    if (index >= items.length) setIndex(items.length - 1);
  }, [items.length, index]);

  const reset = useCallback(() => setIndex(-1), []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const isTyping = ["INPUT", "TEXTAREA"].includes(tag);
      const list = itemsRef.current;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => (list.length === 0 ? -1 : Math.min(list.length - 1, Math.max(0, i + 1))));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => (list.length === 0 ? -1 : Math.max(0, i - 1)));
      } else if (e.key === "Enter") {
        const current = indexRef.current;
        const target = current >= 0 ? list[current] : list[0];
        if (target) {
          e.preventDefault();
          onActivate(target);
        } else if (!isTyping) {
          // no-op
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onActivate]);

  return { index, setIndex, reset };
}
