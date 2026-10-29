import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

let sessionCounter = 0;

export function useAnimationSession() {
  const [session, setSession] = useState(() => {
    sessionCounter += 1;
    return sessionCounter;
  });
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      sessionCounter += 1;
      setSession(sessionCounter);
    }, [])
  );

  return session;
}
