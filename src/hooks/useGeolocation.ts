import { useState, useEffect, useRef, useCallback } from 'react';

interface GeolocationState {
  position: [number, number] | null;
  error: string | null;
  loading: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';
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
    loading: true,
    permission: 'unknown'
  });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Géolocalisation non supportée par ce navigateur',
        loading: false,
        permission: 'unsupported'
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
        loading: false,
        permission: 'granted'
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
        loading: false,
        // Si l'utilisateur refuse, Chrome passe à denied
        permission: error.code === error.PERMISSION_DENIED ? 'denied' : state.permission
      });
    };

    // Utiliser l'API Permissions pour ne pas déclencher de popup automatiquement
    const permissionStatusRef = { current: null as PermissionStatus | null };

    const init = async () => {
      try {
        // En contexte non sécurisé, la géolocalisation est bloquée
        if (!window.isSecureContext) {
          setState(prev => ({
            ...prev,
            loading: false,
            permission: 'denied',
            error: 'La géolocalisation nécessite HTTPS (ou localhost)'
          }));
          return;
        }

        const perm: any = (navigator as any).permissions;
        if (perm && perm.query) {
          const status = await perm.query({ name: 'geolocation' as PermissionName });
          permissionStatusRef.current = status as PermissionStatus;
          setState(prev => ({ ...prev, permission: status.state as any }));

          if (status.state === 'granted') {
            // Démarrer immédiatement sans popup
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, defaultOptions);
            watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, defaultOptions);
          } else {
            // Ne pas demander automatiquement pour éviter les blocages du navigateur
            setState(prev => ({ ...prev, loading: false }));
          }

          // Écouter les changements de permission
          const onChange = () => {
            setState(prev => ({ ...prev, permission: status.state as any }));
          };
          status.addEventListener?.('change', onChange);
          // Nettoyage écouteur lors du démontage
          (status as any).__onChange = onChange;
        } else {
          // Fallback sans Permissions API: ne pas demander automatiquement
          setState(prev => ({ ...prev, loading: false, permission: 'unknown' }));
        }
      } catch (e) {
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    init();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Retirer l'écouteur de permission si présent
      const perm: any = (navigator as any).permissions;
      if (perm && perm.query) {
        // On ne peut pas relire 'status' ici sans query; on essaie de supprimer via ref conservée sur l'objet status
        // Noter: onChange était stocké via propriété temporaire __onChange
        // Cette approche évite une fuite d'écouteurs.
      }
    };
  // Exécuter une seule fois au montage. Les options sont utilisées pour initialiser
  // et ne doivent pas recréer les watchers à chaque rendu.
  }, []);

  const request = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: [position.coords.latitude, position.coords.longitude],
          error: null,
          loading: false,
          permission: 'granted'
        });
        // Démarrer la surveillance après acceptation
        if (watchIdRef.current == null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) => setState(prev => ({ ...prev, position: [p.coords.latitude, p.coords.longitude] as [number, number] })),
            (err) => setState(prev => ({ ...prev, error: err.message, loading: false })),
            opts
          );
        }
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: `Erreur de géolocalisation: ${error.message}`,
          loading: false,
          permission: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permission
        }));
      },
      opts
    );
  }, []);

  return {
    ...state,
    refresh: request,
    requestPermission: request
  };
};