import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

const shortcuts = new Map<string, Shortcut>();

function getShortcutKey(shortcut: Omit<Shortcut, 'action' | 'description' | 'category'>): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('ctrl');
  if (shortcut.shift) parts.push('shift');
  if (shortcut.alt) parts.push('alt');
  if (shortcut.meta) parts.push('meta');
  parts.push(shortcut.key.toLowerCase());
  return parts.join('+');
}

export function registerShortcut(shortcut: Shortcut): () => void {
  const key = getShortcutKey(shortcut);
  shortcuts.set(key, shortcut);
  
  // Return unregister function
  return () => {
    shortcuts.delete(key);
  };
}

export function getAllShortcuts(): Shortcut[] {
  return Array.from(shortcuts.values());
}

export function getShortcutsByCategory(category: string): Shortcut[] {
  return Array.from(shortcuts.values()).filter(s => s.category === category);
}

export function useKeyboardShortcuts(enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Exception: Allow Escape key
      if (event.key !== 'Escape') {
        return;
      }
    }

    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    
    const key = parts.join('+');
    const shortcut = shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
}

// Hook for registering shortcuts with automatic cleanup
export function useShortcut(shortcut: Shortcut, deps: any[] = []) {
  useEffect(() => {
    const unregister = registerShortcut(shortcut);
    return unregister;
  }, deps);
}
