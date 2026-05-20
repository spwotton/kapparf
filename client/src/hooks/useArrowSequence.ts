import { useEffect, useRef } from "react";

const SEQUENCE = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const RESET_MS = 3000;

export function useArrowSequence(onMatch: () => void) {
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        bufferRef.current = [];
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      const expected = SEQUENCE[bufferRef.current.length];
      if (e.key === expected) {
        bufferRef.current.push(e.key);
      } else {
        bufferRef.current = e.key === SEQUENCE[0] ? [e.key] : [];
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { bufferRef.current = []; }, RESET_MS);

      if (bufferRef.current.length === SEQUENCE.length) {
        bufferRef.current = [];
        if (timerRef.current) clearTimeout(timerRef.current);
        onMatch();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onMatch]);
}
