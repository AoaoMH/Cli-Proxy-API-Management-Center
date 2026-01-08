import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import './ContentTransition.scss';

type LayerStatus = 'current' | 'exiting';

type Layer = {
  key: string;
  node: ReactNode;
  status: LayerStatus;
};

type TransitionDirection = 'forward' | 'backward';

const TRANSITION_DURATION = 0.22;
const EXIT_DURATION = 0.18;
const ENTER_DELAY = 0.03;

export function ContentTransition({
  transitionKey,
  children,
  getOrder,
  className,
  travel = 36,
}: {
  transitionKey: string;
  children: ReactNode;
  getOrder?: (key: string) => number | null;
  className?: string;
  travel?: number;
}) {
  const currentLayerRef = useRef<HTMLDivElement>(null);
  const exitingLayerRef = useRef<HTMLDivElement>(null);
  
  const prevKeyRef = useRef<string>(transitionKey);
  const prevChildrenRef = useRef<ReactNode>(children);

  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('forward');
  
  const [layers, setLayers] = useState<Layer[]>(() => [{
    key: transitionKey,
    node: children,
    status: 'current',
  }]);

  useEffect(() => {
    // If key hasn't changed, just keep tracking the latest children
    if (transitionKey === prevKeyRef.current) {
      prevChildrenRef.current = children;
      return;
    }
    
    // If animating, we wait for it to finish.
    // The previous logic ignored updates during animation, so we do the same here.
    if (isAnimating) {
      return;
    }

    const fromKey = prevKeyRef.current;
    const toKey = transitionKey;
    const fromNode = prevChildrenRef.current;

    const resolveOrderIndex = (key: string) => {
      if (!getOrder) return null;
      const index = getOrder(key);
      return typeof index === 'number' && index >= 0 ? index : null;
    };

    const fromIndex = resolveOrderIndex(fromKey);
    const toIndex = resolveOrderIndex(toKey);
    const nextDirection: TransitionDirection =
      fromIndex === null || toIndex === null || fromIndex === toIndex
        ? 'forward'
        : toIndex > fromIndex
          ? 'forward'
          : 'backward';
    
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      
      setTransitionDirection(nextDirection);
      setLayers([
        {
          key: fromKey,
          node: fromNode,
          status: 'exiting',
        },
        {
          key: toKey,
          node: children,
          status: 'current',
        },
      ]);
      setIsAnimating(true);
    });
    
    prevKeyRef.current = transitionKey;
    prevChildrenRef.current = children;

    return () => {
      cancelled = true;
    };
  }, [transitionKey, children, isAnimating, getOrder]);

  useLayoutEffect(() => {
    if (!isAnimating) return;
    if (!currentLayerRef.current) return;

    const currentEl = currentLayerRef.current;
    const exitingEl = exitingLayerRef.current;

    const enterFromX = transitionDirection === 'forward' ? travel : -travel;
    const exitToX = transitionDirection === 'forward' ? -travel : travel;

    const tl = gsap.timeline({
      onComplete: () => {
        setLayers((prev) => prev.filter((l) => l.status === 'current'));
        setIsAnimating(false);
      },
    });

    if (exitingEl) {
      tl.fromTo(
        exitingEl,
        { x: 0, opacity: 1 },
        {
          x: exitToX,
          opacity: 0,
          duration: EXIT_DURATION,
          ease: 'power2.in',
          force3D: true,
        },
        0
      );
    }

    tl.fromTo(
      currentEl,
      { x: enterFromX, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: TRANSITION_DURATION,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        force3D: true,
      },
      ENTER_DELAY
    );

    return () => {
      tl.kill();
      gsap.killTweensOf([currentEl, exitingEl]);
    };
  }, [isAnimating, travel, transitionDirection]);

  // Live-patch the current layer with latest children to ensure instant updates
  const layersToRender = layers.map(layer => {
    if (layer.status === 'current' && layer.key === transitionKey) {
      return { ...layer, node: children };
    }
    return layer;
  });

  return (
    <div
      className={[
        'content-transition',
        isAnimating ? 'content-transition--animating' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {layersToRender.map((layer) => (
        <div
          key={`${layer.key}:${layer.status}`}
          className={`content-transition__layer${
            layer.status === 'exiting' ? ' content-transition__layer--exit' : ''
          }`}
          ref={layer.status === 'exiting' ? exitingLayerRef : currentLayerRef}
        >
          {layer.node}
        </div>
      ))}
    </div>
  );
}
