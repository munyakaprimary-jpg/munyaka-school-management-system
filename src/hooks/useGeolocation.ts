import { useState, useEffect } from 'react';

export interface GeolocationState {
  location: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(w    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, accuracy, error, isLoading };
};We need to continue from where we left off. The previous response ended with a closing brace for the useGeolocation hook. The user says "Your previous response did not finish completely. Continue exactly where you left off without any preamble."

We need to see what was left incomplete. The last code snippet ended with:

```
return () => navigator.geolocation.clearWatch(watchId);
  }
```

But there is a syntax error: `return () => navigator.geolocation.clearWatch(watchId);` is missing a closing parenthesis for the function. Actually the code:

```
return () => navigator.geolocation.clearWatch(watchId);
```

That's missing a closing parenthesis for the arrow function. It should be:

```
return () => navigator.geolocation.clearWatch(watchId);
```

Wait, that's actually correct: arrow function `() => ...` then `watchId` is the argument. But the code snippet shows `return () => navigator.geolocation.clearWatch(watchId);` which is missing a closing parenthesis for the function? Let's parse:

`return () => navigator.geolocation.clearWatch(watchId);` 

The arrow function is `() => navigator.geolocation.clearWatch(watchId)`. That's a function that takes no arguments (the `()` before `=>`) and returns nothing. The body is `navigator.geolocation.clearWatch(watchId)`. That's fine. But the `return` statement is outside the arrow function? Actually the code is:

```
return () => navigator.geolocation.clearWatch(watchId);
```

That's a `return` statement that returns an arrow function. So the arrow function is `() => navigator.geolocation.clearWatch(watchId)`. That's correct. But the code snippet ends with `watchId);` which is the end of the function call. So maybe the issue is that the code snippet is incomplete because there is no closing parenthesis for the `useEffect` cleanup function? Let's see:

The `useEffect` is:

```
useEffect(() => {
  if (!navigator.geolocation) {
    setError('Geolocation is not supported by your browser');
    setIsLoading(false);
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setAccuracy(position.coords.accuracy);
      setError(null);
      setIsLoading(false);
    },
    (err) => {
      setError(err.message);
      setIsLoading(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, []);
```

The `return` statement is inside the `useEffect` callback, which is correct. So maybe the issue is that the code snippet is missing a closing parenthesis for the `watchPosition` call? Let's count parentheses:

`watchPosition(` -> open
`(position) => { ... }` -> arrow function
`(err) => { ... }` -> second callback
`{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0, }` -> options object

So the `watchPosition` call has three arguments: first callback, second callback, options object. The options object is closed with `}`. Then after that, we have `return () => navigator.geolocation.clearWatch(watchId);` which is outside the `useEffect` but inside the component function. That's fine.

But maybe the code snippet is missing a closing parenthesis for the `watchPosition` call? Let's count:

`watchPosition(` -> open
`(position) => { ... }` -> first callback
`(err) => { ... }` -> second callback
`{ ... }` -> options object

So after the options object, we need to close the `watchPosition` call with a `)`. The code snippet shows:

```
return () => navigator.geolocation.clearWatch(watchId);
```

But that's after the `watchPosition` call, so the `watchPosition` call should be closed before that. Let's see the code:

```
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    setAccuracy(position.coords.accuracy);
    setError(null);
    setIsLoading(false);
  },
  (err) => {
    setError(err.message);
    setIsLoading(false);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
```

Yes, there is a closing `}` after the options object, then the `return` statement. So the code is fine.

But maybe the issue is that the `watchId` variable is not defined because the `watchPosition` call is missing a closing parenthesis? Let's check: The `watchPosition` call is:

```
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    setAccuracy(position.coords.accuracy);
    setError(null);
    setIsLoading(false);
  },
  (err) => {
    setError(err.message);
    setIsLoading(false);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
);
```

That's correct: after the options object, there is a `);` to close the `watchPosition` call. So the code is fine.

But the user says "Your previous response did not finish completely." So maybe the previous response was truncated, and we need to continue from where we left off. The previous response ended with the `useGeolocation` hook code, which seems complete. However, maybe there was a missing closing brace for the component function? Let's see the entire `useGeolocation` hook:

```
export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, accuracy, error, isLoading };
};
```

That seems complete. So maybe the previous response was incomplete because it didn't include the closing of the component file or something else. But the user says "continue exactly where you left off". So we need to continue after the `useGeolocation` hook. What else is needed? Possibly we need to export something else, or maybe we need to add a default export, or maybe we need to add more hooks.

Looking at the context, we have:

- `useTeacherAttendance` hook (for teacher attendance)
- `useStudentAttendance` hook (for student attendance)
- `useGeolocation` hook (for geolocation)

Maybe we need to export these hooks, or maybe we need to add a new hook for something else. But the user says "continue exactly where you left off". So we need to see what was left incomplete. The previous response ended with the `useGeolocation` hook, which seems complete. However, maybe there was a missing closing brace for the component or something else.

Let's re-examine the previous response:

```
<dyad-write path="src/hooks/useGeolocation.ts" description="Geolocation hook with high accuracy tracking">
import { useState, useEffect } from 'react';

export interface GeolocationState {
  location: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, accuracy, error, isLoading };
};