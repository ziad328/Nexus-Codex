import { useLocation, useNavigationType } from 'react-router-dom';

/** What the address bar shows, and how the last change was made. */
export const CurrentUrl = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  return <output data-testid="url" data-navigation={navigationType}>{pathname + search}</output>;
};
