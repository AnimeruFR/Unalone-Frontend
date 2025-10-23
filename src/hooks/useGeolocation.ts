import { useState, useEffect } from 'react';

interface GeolocationState {
  position: [number, number] | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    let watchId: number | null = null;

    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Géolocalisation non supportée par ce navigateur',
        loading: false
      });
      return;
    }

    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        position: [position.coords.latitude, position.coords.longitude],
        error: null,
        loading: false
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage: string;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Géolocalisation refusée par l\'utilisateur';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Position indisponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Délai d\'attente dépassé pour la géolocalisation';
          break;
        default:
          errorMessage = 'Erreur de géolocalisation inconnue';
          break;
      }

      setState({
        position: null,
        error: errorMessage,
        loading: false
      });
    };

    // Obtenir la position initiale
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    // Surveiller les changements de position
    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [options]);

  const getCurrentPosition = () => {
    setState(prev => ({ ...prev, loading: true }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: [position.coords.latitude, position.coords.longitude],
          error: null,
          loading: false
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: `Erreur de géolocalisation: ${error.message}`,
          loading: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return {
    ...state,
    refresh: getCurrentPosition
  };
};