import type { ReactNode, FC } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface Props {
  children: ReactNode;
  className?: string;
}

const SmoothScrollbar: FC<Props> = ({ children, className }) => {
  return (
    <OverlayScrollbarsComponent
      className={className}
      options={{
        scrollbars: {
          theme: 'os-theme-dark os-theme-nexus', // extend built-in dark theme
          autoHide: 'scroll', // hide when not scrolling
          autoHideDelay: 1000,
        },
      }}
      defer
    >
      {children}
    </OverlayScrollbarsComponent>
  );
};

export default SmoothScrollbar;
