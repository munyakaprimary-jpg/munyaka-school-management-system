import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const SETTINGS_ROW_ID = 'default';

/**
 * Fetches the Google Maps API key stored in the system_settings table.
 * Returns { apiKey, isLoading, error } and exposes a `refetch` function
 * so callers can re-fetch after the key is saved.
 */
export function useGoogleMapsApiKey() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('system_settings')
        .select('google_maps_api_key')
        .eq('id', SETTINGS_ROW_ID)
        .single();

      if (dbError) {
        // Fall back to localStorage for dev / pre-Supabase setups
        const savedMaster = localStorage.getItem('munyaka_system_settings_v3');
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          setApiKey(parsed.googleMapsApiKey || '');
        } else {
          setApiKey('');
        }
      } else {
        setApiKey(data?.google_maps_api_key || '');
      }
    } catch (err) {
      setError('Failed to load Google Maps API key from System Configuration.');
      setApiKey('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  return { apiKey, isLoading, error, refetch: fetchKey };
}
