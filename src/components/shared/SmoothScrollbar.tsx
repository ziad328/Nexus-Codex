import { useRef, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface Props {
  children: ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

const SmoothScrollbar: FC<Props> = ({ children, className, onScroll }) => {
  const osRef = useRef<any>(null);

  useEffect(() => {
    const handleScrollToTop = () => {
      const osInstance = osRef.current?.osInstance();
      if (osInstance) {
        const { scrollOffsetElement } = osInstance.elements();
        scrollOffsetElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('nexusScrollToTop', handleScrollToTop);
    return () => window.removeEventListener('nexusScrollToTop', handleScrollToTop);
  }, []);

  return (
    <OverlayScrollbarsComponent
      ref={osRef}
      className={className}
      options={{
        scrollbars: {
          theme: 'os-theme-dark os-theme-nexus',
          autoHide: 'scroll',
          autoHideDelay: 1000,
        },
      }}
      events={{
        scroll: (instance) => {
          const { scrollOffsetElement } = instance.elements();
          const scrollTop = scrollOffsetElement.scrollTop;
          window.dispatchEvent(new CustomEvent('nexusScroll', { detail: scrollTop }));
          if (onScroll) onScroll(scrollTop);
        }
      }}
      defer
    >
      {children}
    </OverlayScrollbarsComponent>
  );
};

export default SmoothScrollbar;
