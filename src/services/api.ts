import axios from 'axios';

// Résolution robuste de l'URL d'API
const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl;
  try {
    const { origin, hostname } = window.location;
    // Prod: si aucune variable n'est définie, essayer le même domaine avec chemin /api (nécessite un reverse proxy)
    if (hostname && hostname !== 'localhost') return origin.replace(/\/$/, '') + '/api';
  } catch {}
  // Dev fallback
  return process.env.BACKEND_URL + '/api' || 'https://unalone-backend-05eo.onrender.com:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

// Configuration axios par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT s'il existe
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  console.log('Token utilisé pour la requête:', token ? 'présent' : 'absent');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Header Authorization ajouté:', config.headers.Authorization);
  }
  return config;
});

// Intercepteur pour les réponses afin de capturer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    console.log('Réponse API reçue:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Erreur API:', error.response?.status, error.response?.data);
    
    // Si le token est expiré ou invalide (401), déconnecter automatiquement
    // SAUF si c'est une tentative de connexion/inscription (pas de token présent)
    if (error.response?.status === 401) {
      const hasToken = localStorage.getItem('authToken');
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                             error.config?.url?.includes('/auth/register');
      
      // Ne recharger que si on avait un token (session expirée) et que ce n'est pas une route d'auth
      if (hasToken && !isAuthEndpoint) {
        console.log('Token expiré ou invalide, déconnexion automatique');
        localStorage.removeItem('authToken');
        // Recharger la page pour réinitialiser l'état de l'app
        window.location.reload();
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface Event {
  id: string;
  title: string;
  type: string;
  audience: string;
  datetime: string;
  description: string;
  placeName: string;
  lat: number;
  lng: number;
  maxAttendees?: number;
  attendees: Array<{id: string; name: string; role?: string; joinedAt?: string}>;
  contactLink?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  type: string;
  audience: string;
  datetime: string;
  description: string;
  placeName: string;
  lat: number;
  lng: number;
  maxAttendees?: number;
  contactLink?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  interests?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// Services API

// Événements
// Transformateurs entre backend et frontend
const transformBackendEventToFrontend = (e: any): Event => {
  if (!e) {
    // Valeur par défaut minimale pour éviter les crashs
    return {
      id: '',
      title: '',
      type: '',
      audience: '',
      datetime: new Date().toISOString(),
      description: '',
      placeName: '',
      lat: 0,
      lng: 0,
      attendees: [],
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const coords = Array.isArray(e.location?.coordinates) ? e.location.coordinates : [0, 0];
  const lat = Number(coords[1] ?? 0);
  const lng = Number(coords[0] ?? 0);
  const attendees = Array.isArray(e.participants)
    ? e.participants.map((p: any) => ({
        id: (p?.user?._id ?? p?.user ?? '').toString(),
        name: (p?.user?.username ?? 'Invité').toString(),
        role: p?.role ?? 'member', // Inclure le rôle du participant
        joinedAt: p?.joinedAt ?? null, // Inclure la date d'inscription
      }))
    : [];

  return {
    id: (e._id ?? e.id ?? '').toString(),
    title: e.title ?? '',
    type: e.type ?? '',
    audience: e.audience ?? '',
    datetime: (e.dateTime ?? e.datetime ?? new Date().toISOString()).toString(),
    description: e.description ?? '',
    placeName: e.location?.address ?? e.placeName ?? '',
    lat,
    lng,
    maxAttendees: e.maxParticipants ?? e.maxAttendees,
    attendees,
    contactLink: e.contactInfo ?? e.contactLink,
    createdBy: (e.creator?._id ?? e.creator ?? '').toString(),
    createdAt: (e.createdAt ?? new Date().toISOString()).toString(),
    updatedAt: (e.updatedAt ?? new Date().toISOString()).toString(),
  };
};

const transformFrontendCreateToBackend = (data: CreateEventData) => {
  console.log('=== TRANSFORMATION FRONTEND → BACKEND ===');
  console.log('Données frontend:', data);
  
  const payload = {
    title: data.title,
    description: data.description,
    type: data.type,
    audience: data.audience,
    dateTime: data.datetime,
    location: {
      type: 'Point',
      coordinates: [data.lng, data.lat],
      address: data.placeName,
    },
    maxParticipants: data.maxAttendees,
    contactInfo: data.contactLink,
  };
  
  console.log('Payload backend généré:', payload);
  console.log('Coordonnées:', payload.location.coordinates, 'Type:', typeof payload.location.coordinates[0]);
  console.log('Date:', payload.dateTime, 'Type:', typeof payload.dateTime);
  
  return payload;
};

export const eventsApi = {
  // Récupérer tous les événements
  getAll: async (): Promise<Event[]> => {
    const response = await apiClient.get('/events');
    const list = response.data?.data?.events ?? response.data?.events ?? [];
    return Array.isArray(list) ? list.map(transformBackendEventToFrontend) : [];
  },

  // Récupérer un événement par ID
  getById: async (id: string): Promise<Event> => {
    const response = await apiClient.get(`/events/${id}`);
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Créer un nouvel événement
  create: async (eventData: CreateEventData): Promise<Event> => {
    console.log('Données frontend reçues:', eventData);
    const payload = transformFrontendCreateToBackend(eventData);
    console.log('Payload envoyé au backend:', payload);
    
    try {
      const response = await apiClient.post('/events', payload);
      console.log('Réponse backend:', response.data);
      const e = response.data?.data?.event ?? response.data?.event ?? response.data;
      const transformedEvent = transformBackendEventToFrontend(e);
      console.log('Événement transformé:', transformedEvent);
      return transformedEvent;
    } catch (error) {
      console.error('Erreur API lors de la création:', error);
      throw error;
    }
  },

  // Mettre à jour un événement
  update: async (id: string, eventData: Partial<CreateEventData>): Promise<Event> => {
    const payload = eventData.datetime || eventData.placeName || eventData.lat !== undefined
      ? transformFrontendCreateToBackend({
          title: eventData.title ?? '',
          type: eventData.type ?? '',
          audience: eventData.audience ?? '',
          datetime: eventData.datetime ?? new Date().toISOString(),
          description: eventData.description ?? '',
          placeName: eventData.placeName ?? '',
          lat: eventData.lat ?? 0,
          lng: eventData.lng ?? 0,
          maxAttendees: eventData.maxAttendees,
          contactLink: eventData.contactLink,
        })
      : eventData;

    const response = await apiClient.put(`/events/${id}`, payload);
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Supprimer un événement
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  // Rejoindre un événement
  join: async (eventId: string): Promise<Event> => {
    const response = await apiClient.post(`/events/${eventId}/join`);
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Quitter un événement
  leave: async (eventId: string): Promise<Event> => {
    const response = await apiClient.post(`/events/${eventId}/leave`);
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Modifier le rôle d'un participant
  updateParticipantRole: async (eventId: string, userId: string, role: 'admin' | 'member' | 'muted'): Promise<Event> => {
    const response = await apiClient.patch(`/events/${eventId}/participants/${userId}/role`, { role });
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Exclure un participant
  kickParticipant: async (eventId: string, userId: string): Promise<Event> => {
    const response = await apiClient.delete(`/events/${eventId}/participants/${userId}`);
    const e = response.data?.data?.event ?? response.data?.event ?? response.data;
    return transformBackendEventToFrontend(e);
  },

  // Rechercher des événements par géolocalisation
  searchByLocation: async (lat: number, lng: number, radius?: number): Promise<Event[]> => {
    const response = await apiClient.get('/events/search/location', {
      params: { lat, lng, radius: radius || 10 }
    });
    return response.data;
  }
};

// Authentification
export const authApi = {
  // Connexion (identifier peut être email ou username)
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    return response.data;
  },

  // Inscription
  register: async (userData: { username: string; email: string; password: string; }): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Vérification du token
  verifyToken: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.user || response.data;
  },

  // Mettre à jour le profil utilisateur (email au niveau racine, autres champs dans profile)
  updateProfile: async (data: { email?: string; firstName?: string; lastName?: string; age?: number; bio?: string; }): Promise<User> => {
    const payload: any = { };
    // Email au niveau racine si fourni
    if (data.email !== undefined && data.email !== '') payload.email = data.email;
    // Champs du profil imbriqués
    const profile: any = {};
    if (data.firstName !== undefined && data.firstName !== '') profile.firstName = data.firstName;
    if (data.lastName !== undefined && data.lastName !== '') profile.lastName = data.lastName;
    if (data.bio !== undefined && data.bio !== '') profile.bio = data.bio;
    if (data.age !== undefined && !Number.isNaN(data.age)) profile.age = data.age;
    if (Object.keys(profile).length > 0) payload.profile = profile;

    const response = await apiClient.put('/auth/profile', payload);
    return response.data.user || response.data;
  },

  // Déconnexion
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
  }
};

// Utilisateurs
export const usersApi = {
  // Récupérer le profil utilisateur
  getProfile: async (): Promise<User> => {
    // Utiliser la route privée qui retourne l'utilisateur connecté
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    // Rediriger vers l'API d'auth pour mise à jour du profil
    const { firstName, lastName, age, interests } = (userData as any).profile || {};
    const payload: any = { profile: {} };
    if (firstName !== undefined) payload.profile.firstName = firstName;
    if (lastName !== undefined) payload.profile.lastName = lastName;
    if (age !== undefined) payload.profile.age = age;
    if (interests !== undefined) payload.profile.interests = interests;
    const response = await apiClient.put('/auth/profile', payload);
    return response.data.user || response.data;
  },

  // Récupérer les utilisateurs à proximité
  getNearby: async (lat: number, lng: number, radius?: number): Promise<User[]> => {
    const response = await apiClient.get('/users/nearby', {
      params: { lat, lng, radius: radius || 5 }
    });
    return response.data;
  }
};

// Service de géolocalisation
export const locationApi = {
  // Recherche de lieux avec Nominatim (OpenStreetMap)
  searchPlaces: async (query: string): Promise<Array<{
    display_name: string;
    lat: string;
    lon: string;
    place_id: string;
  }>> => {
    try {
      const response = await apiClient.get(`/geocoding/search?q=${encodeURIComponent(query)}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);
      return [];
    }
  },

  // Géocodage inverse
  reverseGeocode: async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      return response.data.display_name || 'Lieu inconnu';
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return 'Lieu inconnu';
    }
  }
};

// Utilitaires
export const apiUtils = {
  // Sauvegarder le token d'authentification
  saveAuthToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Récupérer le token d'authentification
  getAuthToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Générer un ID utilisateur temporaire pour les tests
  generateTempUserId: (): string => {
    let tempUserId = localStorage.getItem('tempUserId');
    if (!tempUserId) {
      tempUserId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tempUserId', tempUserId);
    }
    return tempUserId;
  },

  // Calculer la distance entre deux points
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};

const api = {
  events: eventsApi,
  auth: authApi,
  users: usersApi,
  location: locationApi,
  utils: apiUtils
};

export default api;