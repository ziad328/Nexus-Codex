import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useAppDispatch from './useAppDispatch';
import useAppSelector from './useAppSelector';
import { setSearchQuery } from '../store/uiSlice';

export default function useSearchContext() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // Use the base pathname as the context key (e.g., '/' or '/favorites')
  const path = location.pathname;
  
  const query = useAppSelector((s) => s.ui.searchQueries?.[path] || '');
  
  const setQuery = useCallback((text: string) => {
    dispatch(setSearchQuery({ path, text }));
  }, [dispatch, path]);

  return [query, setQuery] as const;
}
