import { useState, useEffect, useCallback, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from './icons';
import './Drawer.scss';

interface DrawerProps {
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  width?: number | string;
  position?: 'left' | 'right';
}

const CLOSE_ANIMATION_DURATION = 300;
const DRAWER_LOCK_CLASS = 'drawer-open';
let activeDrawerCount = 0;

const lockScroll = () => {
  if (typeof document === 'undefined') return;
  if (activeDrawerCount === 0) {
    document.body?.classList.add(DRAWER_LOCK_CLASS);
    document.documentElement?.classList.add(DRAWER_LOCK_CLASS);
  }
  activeDrawerCount += 1;
};

const unlockScroll = () => {
  if (typeof document === 'undefined') return;
  activeDrawerCount = Math.max(0, activeDrawerCount - 1);
  if (activeDrawerCount === 0) {
    document.body?.classList.remove(DRAWER_LOCK_CLASS);
    document.documentElement?.classList.remove(DRAWER_LOCK_CLASS);
  }
};

export function Drawer({ open, title, onClose, width = 600, position = 'right', children }: PropsWithChildren<DrawerProps>) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startClose = useCallback(
    (notifyParent: boolean) => {
      if (closeTimerRef.current !== null) return;
      setIsClosing(true);
      closeTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        closeTimerRef.current = null;
        if (notifyParent) {
          onClose();
        }
      }, CLOSE_ANIMATION_DURATION);
    },
    [onClose]
  );

  useEffect(() => {
    let cancelled = false;

    if (open) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      queueMicrotask(() => {
        if (cancelled) return;
        setIsVisible(true);
        setIsClosing(false);
      });
    } else if (isVisible) {
      queueMicrotask(() => {
        if (cancelled) return;
        startClose(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [open, isVisible, startClose]);

  const handleClose = useCallback(() => {
    startClose(true);
  }, [startClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const shouldLockScroll = open || isVisible;

  useEffect(() => {
    if (!shouldLockScroll) return;
    lockScroll();
    return () => unlockScroll();
  }, [shouldLockScroll]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open && !isVisible) return null;

  const overlayClass = `drawer-overlay ${isClosing ? 'drawer-overlay-closing' : 'drawer-overlay-entering'}`;
  const drawerClass = `drawer drawer-${position} drawer-${position} ${isClosing ? 'drawer-closing' : 'drawer-entering'}`;


  const drawerContent = (
    <div className={overlayClass} onClick={handleClose}>
      <div
        className={drawerClass}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title">{title}</div>
          <button className="drawer-close" onClick={handleClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return drawerContent;
  }

  return createPortal(drawerContent, document.body);
}
