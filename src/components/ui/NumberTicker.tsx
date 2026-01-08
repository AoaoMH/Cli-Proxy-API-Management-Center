import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface NumberTickerProps {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export const NumberTicker = ({ value, duration = 1, suffix = '', decimals = 0 }: NumberTickerProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const previousValue = useRef(0);

  useEffect(() => {
    if (!ref.current) return;

    if (previousValue.current !== value) {
      // Create a proxy object to animate
      const proxy = { val: previousValue.current };
      
      gsap.to(proxy, {
        val: value,
        duration: duration,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = proxy.val.toFixed(decimals) + suffix;
          }
        }
      });
      
      previousValue.current = value;
    }
  }, [value, duration, decimals, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};
