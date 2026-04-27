import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const router = useRouter();
  const debounceTime = 150;
  let lastKeyTime = 0;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in input, textarea, select, or contenteditable
    const target = event.target as HTMLElement;
    const isInputElement = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true';

    if (isInputElement) {
      return;
    }

    // Debounce to prevent multiple triggers
    const currentTime = Date.now();
    if (currentTime - lastKeyTime < debounceTime) {
      return;
    }
    lastKeyTime = currentTime;

    const pressedKey = event.key.toLowerCase();
    
    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => 
      shortcut.key.toLowerCase() === pressedKey
    );

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, debounceTime]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
