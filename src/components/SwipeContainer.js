import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addDays, startOfDay } from '../utils/dates';

const SWIPE_THRESHOLD = 80;
const AXIS_LOCK = 10;
const OUT_DISTANCE = 160;
const ANIMATION_MS = 220;

const isIgnoredTarget = (target) => {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select') ||
    target.closest('[role="dialog"]') ||
    target.closest('.week-strip') ||
    target.closest('.app-modal-overlay')
  );
};

const SwipeContainer = ({
  children,
  selectedDate,
  minDate,
  maxDate,
  onDateChange,
}) => {
  const surfaceRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const axis = useRef(null);
  const didSwipe = useRef(false);
  const dragXRef = useRef(0);
  const selectedRef = useRef(selectedDate);
  const animating = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);

  selectedRef.current = selectedDate;

  const canGoPrev = startOfDay(selectedDate).getTime() > startOfDay(minDate).getTime();
  const canGoNext = startOfDay(selectedDate).getTime() < startOfDay(maxDate).getTime();
  const canGoPrevRef = useRef(canGoPrev);
  const canGoNextRef = useRef(canGoNext);
  canGoPrevRef.current = canGoPrev;
  canGoNextRef.current = canGoNext;

  const setOffset = (value, withTransition) => {
    dragXRef.current = value;
    setTransitionOn(withTransition);
    setDragX(value);
  };

  const navigate = useCallback((direction) => {
    if (animating.current) return;
    const goingNext = direction === 'next';
    if (goingNext && !canGoNextRef.current) return;
    if (!goingNext && !canGoPrevRef.current) return;

    animating.current = true;
    const out = goingNext ? -OUT_DISTANCE : OUT_DISTANCE;
    setOffset(out, true);

    window.setTimeout(() => {
      setOffset(goingNext ? OUT_DISTANCE : -OUT_DISTANCE, false);
      onDateChange?.(addDays(selectedRef.current, goingNext ? 1 : -1));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOffset(0, true);
          window.setTimeout(() => {
            animating.current = false;
            setOffset(0, false);
          }, ANIMATION_MS);
        });
      });
    }, ANIMATION_MS);
  }, [onDateChange]);

  const applyDrag = (dx) => {
    let next = dx;
    if ((dx > 0 && !canGoPrevRef.current) || (dx < 0 && !canGoNextRef.current)) {
      next = dx * 0.18;
    }
    setOffset(next, false);
  };

  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;

    const onStart = (clientX, clientY, target) => {
      if (animating.current || isIgnoredTarget(target)) return false;
      startX.current = clientX;
      startY.current = clientY;
      tracking.current = true;
      axis.current = null;
      didSwipe.current = false;
      setOffset(0, false);
      return true;
    };

    const onMove = (clientX, clientY, event) => {
      if (!tracking.current || animating.current) return;
      const dx = clientX - startX.current;
      const dy = clientY - startY.current;

      if (!axis.current) {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis.current !== 'x') return;

      event.preventDefault();
      applyDrag(dx);
    };

    const onEnd = () => {
      if (!tracking.current) return;
      tracking.current = false;
      const wasHorizontal = axis.current === 'x';
      const dx = dragXRef.current;
      const abs = Math.abs(dx);
      axis.current = null;

      if (!wasHorizontal) return;

      if (abs > AXIS_LOCK) {
        didSwipe.current = true;
      }

      if (abs >= SWIPE_THRESHOLD) {
        const goingNext = dx < 0;
        if ((goingNext && canGoNextRef.current) || (!goingNext && canGoPrevRef.current)) {
          navigate(goingNext ? 'next' : 'prev');
          return;
        }
      }

      setOffset(0, true);
      window.setTimeout(() => setOffset(0, false), ANIMATION_MS);
    };

    const onTouchStart = (event) => {
      onStart(event.touches[0].clientX, event.touches[0].clientY, event.target);
    };
    const onTouchMove = (event) => {
      if (!event.touches[0]) return;
      onMove(event.touches[0].clientX, event.touches[0].clientY, event);
    };
    const onTouchEnd = () => onEnd();

    const onMouseDown = (event) => {
      if (event.button !== 0) return;
      if (!onStart(event.clientX, event.clientY, event.target)) return;
      const onMouseMove = (moveEvent) => onMove(moveEvent.clientX, moveEvent.clientY, moveEvent);
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        onEnd();
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd);
    node.addEventListener('touchcancel', onTouchEnd);
    node.addEventListener('mousedown', onMouseDown);

    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
      node.removeEventListener('mousedown', onMouseDown);
    };
  }, [navigate]);

  const hintOpacity = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);
  const showLeft = dragX > 12 && canGoPrev;
  const showRight = dragX < -12 && canGoNext;
  const opacity = Math.max(0.35, 1 - Math.abs(dragX) / 280);

  return (
    <div
      ref={surfaceRef}
      className="swipe-container"
      onClickCapture={(event) => {
        if (didSwipe.current) {
          event.preventDefault();
          event.stopPropagation();
          didSwipe.current = false;
        }
      }}
    >
      <div
        className={`swipe-container__stage ${transitionOn ? 'is-animating' : ''}`}
        style={{
          transform: `translateX(${dragX}px)`,
          opacity,
        }}
      >
        {children}
      </div>

      <div
        className={`swipe-arrow swipe-arrow--left ${showLeft ? 'is-visible' : ''}`}
        style={{ opacity: showLeft ? hintOpacity : 0 }}
        aria-hidden="true"
      >
        ‹
      </div>
      <div
        className={`swipe-arrow swipe-arrow--right ${showRight ? 'is-visible' : ''}`}
        style={{ opacity: showRight ? hintOpacity : 0 }}
        aria-hidden="true"
      >
        ›
      </div>

      <p className="swipe-container__hint">
        {canGoPrev ? '←' : ''} Swipe to change days {canGoNext ? '→' : ''}
      </p>
    </div>
  );
};

export default SwipeContainer;
