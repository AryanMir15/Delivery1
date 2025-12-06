import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import SessionService from '../services/SessionService';

export const useProductTracking = (productId, categoryId) => {
  const viewStartTime = useRef(null);
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;

  useEffect(() => {
    // Track when product screen is focused
    viewStartTime.current = Date.now();
    
    if (productId && categoryId) {
      SessionService.trackProductView(productId, categoryId, userId);
    }

    // Track time spent when component unmounts
    return () => {
      if (viewStartTime.current && productId) {
        const timeSpent = Math.floor((Date.now() - viewStartTime.current) / 1000);
        SessionService.updateProductViewTime(productId, timeSpent, userId);
      }
    };
  }, [productId, categoryId, userId]);
};

export default useProductTracking;
