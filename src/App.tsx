import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert, Fab, Button } from '@mui/material';
import MapComponent from './components/MapComponent';
import SidebarComponent from './components/SidebarComponent';
import CreateEventModal from './components/CreateEventModal';
import AccountPage from './components/AccountPage';
import ChatPanel from './components/ChatPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { eventsApi, Event, CreateEventData, apiUtils, User, authApi } from './services/api';
import { socketService } from './services/socket';
import { unaloneTheme, customStyles } from './styles/theme';
import { Add as AddIcon, AccountCircle as AccountIcon } from '@mui/icons-material';
import AuthModal from './components/AuthModal';
import EventDetailsModal from './components/EventDetailsModal';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'map' | 'account'>('map');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Géolocalisation
  const { position: userPosition } = useGeolocation();

  // ID utilisateur temporaire
  const currentUserId = apiUtils.generateTempUserId();

  // Vérifier l'état de connexion au démarrage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiUtils.getAuthToken();
      if (token) {
        try {
          // Récupérer les informations utilisateur via l'API
          const userInfo = await authApi.verifyToken();
          setCurrentUser(userInfo);
          setIsAuthenticated(true);
          console.log('Utilisateur reconnecté automatiquement:', userInfo);
        } catch (error) {
          console.error('Token invalide ou expiré:', error);
          // Token invalide, nettoyer le stockage
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
    };

    initializeAuth();
  }, []);

  // Connexion Socket.io et abonnements temps réel
  useEffect(() => {
    const token = apiUtils.getAuthToken();
    if (!token) {
      // Si pas authentifié, on se déconnecte des sockets (service côté serveur exige un token)
      socketService.disconnect();
      return;
    }

    // Connecter le socket avec le token
    socketService.connect(token);

    const onCreated = (payload: any) => {
      const e = normalizeSocketEvent(payload?.event);
      setEvents(prev => {
        // Éviter les doublons
        if (prev.some(ev => ev.id === e.id)) return prev;
        return [e, ...prev];
      });
    };

    const onUpdated = (payload: any) => {
      const e = normalizeSocketEvent(payload?.event);
      setEvents(prev => {
        const idx = prev.findIndex(ev => ev.id === e.id);
        if (idx === -1) return [e, ...prev];
        const clone = prev.slice();
        clone[idx] = e;
        return clone;
      });
    };

    const onDeleted = (payload: any) => {
      const id = (payload?.id || '').toString();
      if (!id) return;
      setEvents(prev => prev.filter(ev => ev.id !== id));
    };

    socketService.on('events:created', onCreated);
    socketService.on('events:updated', onUpdated);
    socketService.on('events:deleted', onDeleted);

    return () => {
      socketService.off('events:created', onCreated);
      socketService.off('events:updated', onUpdated);
      socketService.off('events:deleted', onDeleted);
    };
  }, [isAuthenticated]);

  // Transformateur minimal pour événements reçus via sockets
  const normalizeSocketEvent = (e: any): Event => {
    if (!e) {
      return {
        id: '', title: '', type: '', audience: '', datetime: new Date().toISOString(), description: '',
        placeName: '', lat: 0, lng: 0, attendees: [], createdBy: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
    }
    const coords = Array.isArray(e.location?.coordinates) ? e.location.coordinates : [0, 0];
    const lat = Number(coords[1] ?? 0);
    const lng = Number(coords[0] ?? 0);
    const attendees = Array.isArray(e.participants)
      ? e.participants.map((p: any) => ({
          id: (p?.user?._id ?? p?.user ?? '').toString(),
          name: (p?.user?.username ?? 'Invité').toString(),
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

  // Charger les événements au démarrage
  useEffect(() => {
    void loadEvents();
  }, []);

  // Injecter les styles CSS personnalisés
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await eventsApi.getAll();
      setEvents(eventsData);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Impossible de charger les événements');
      showSnackbar('Erreur lors du chargement des événements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventData) => {
    try {
      console.log('Création événement avec données:', eventData);
      const newEvent = await eventsApi.create(eventData);
      console.log('Événement créé:', newEvent);
      
      // Ajouter le nouvel événement à la liste
      setEvents(prev => [newEvent, ...prev]);
      // Ne pas recharger immédiatement pour éviter une disparition si les filtres serveur excluent temporairement l'événement.
      // Un rafraîchissement global pourra être fait plus tard (changement d'onglet, navigation, etc.).
      
      showSnackbar("Événement créé avec succès !", 'success');
      setCreateModalOpen(false);
    } catch (err) {
      console.error("Erreur lors de la création de l'événement:", err);
      const errorMessage = (err as any)?.response?.data?.message || "Erreur lors de la création de l'événement";
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const updatedEvent = await eventsApi.join(eventId);
      setEvents(prev => prev.map(event => (event.id === eventId ? updatedEvent : event)));
      // Fermer le modal et ouvrir le chat
      setSelectedEventForModal(null);
      setChatOpen(true);
      showSnackbar("Vous avez rejoint l'événement !", 'success');
    } catch (err) {
      console.error("Erreur lors de la participation à l'événement:", err);
      const errorMsg = (err as any)?.response?.data?.message || 'Erreur lors de la participation';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      const updatedEvent = await eventsApi.leave(eventId);
      setEvents(prev => prev.map(event => (event.id === eventId ? updatedEvent : event)));
      // Fermer le modal et le chat
      setSelectedEventForModal(null);
      setChatOpen(false);
      showSnackbar('Vous avez quitté l\'événement', 'success');
    } catch (err) {
      console.error("Erreur lors de la sortie de l'événement:", err);
      const errorMsg = (err as any)?.response?.data?.message || 'Erreur lors de la sortie';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleZoomToEvent = (event: Event) => {
    // Afficher la carte, ouvrir le popup et la fiche détaillée
    setCurrentView('map');
    setSelectedEventId(event.id);
    setSelectedEventForModal(event);
  };

  const handleEventSelect = (event: Event) => {
    // Toujours ouvrir la fiche détaillée depuis les sélections (car le chat est maintenant accessible depuis la modale)
    setSelectedEventId(event.id);
    setCurrentView('map');
    setSelectedEventForModal(event);
    setChatOpen(false);
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showSnackbar(`Bienvenue ${(user as any).username || user.name || 'sur UnAlone'} !`, 'success');
  };

  const handleLogout = async () => {
    try {
      // Appeler l'API de déconnexion si l'utilisateur est connecté
      if (isAuthenticated) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion API:', error);
    } finally {
      // Nettoyer l'état local dans tous les cas
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentView('map'); // Retourner à la vue carte
      showSnackbar('Déconnecté avec succès', 'success');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleGoToAccount = () => {
    setCurrentView('account');
  };

  const handleBackToMap = () => {
    setCurrentView('map');
  };

  const handleManageEvent = (eventId: string) => {
    // Rediriger vers la page de gestion de l'événement dans le compte
    setCurrentView('account');
    // L'AccountPage pourra utiliser eventId pour naviguer vers l'onglet Events
  };

  return (
    <ThemeProvider theme={unaloneTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          background: unaloneTheme.unalone.gradients.background,
          overflow: 'hidden'
        }}
      >
        {currentView === 'map' ? (
          <>
            {/* Sidebar */}
            <SidebarComponent
              events={events}
              onCreateEvent={() => setCreateModalOpen(true)}
              onJoinEvent={handleJoinEvent}
              onLeaveEvent={handleLeaveEvent}
              onZoomToEvent={handleZoomToEvent}
              onManageEvent={handleManageEvent}
              userPosition={userPosition}
              currentUserId={currentUserId}
              onOpenAuth={() => setAuthOpen(true)}
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onLogout={handleLogout}
              onGoToAccount={handleGoToAccount}
              selectedEventId={selectedEventId}
            />

            {/* Carte */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              <MapComponent 
                events={events} 
                onEventSelect={handleEventSelect} 
                userPosition={userPosition}
                selectedEventId={selectedEventId}
              />
            </Box>
          </>
        ) : (
          /* Page Compte */
          <AccountPage 
            currentUser={currentUser}
            onBack={handleBackToMap}
            onEventSelect={handleEventSelect}
            onUserUpdate={(u) => setCurrentUser(u)}
          />
        )}

        {/* Modal de création d'événement */}
        <CreateEventModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreateEvent={handleCreateEvent}
          userPosition={userPosition}
        />

        {/* Modal Auth */}
        <AuthModal 
          open={authOpen} 
          onClose={() => setAuthOpen(false)} 
          onAuthenticated={handleAuthenticated}
        />

        {/* Fiche détaillée d'un événement */}
        <EventDetailsModal
          open={!!selectedEventForModal}
          event={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          onJoin={handleJoinEvent}
          onLeave={handleLeaveEvent}
          currentUserId={(currentUser as any)?._id || currentUser?.id || null}
          onManageEvent={handleManageEvent}
          onOpenChat={(eventId) => {
            setSelectedEventId(eventId);
            setChatOpen(true);
          }}
        />

        {/* Chat Panel */}
        {chatOpen && selectedEventId && isAuthenticated && (() => {
          const event = events.find(e => e.id === selectedEventId);
          if (!event) return null;
          const userJoined = event.attendees.some(a => a.id === (currentUser as any)?._id || a.id === currentUser?.id);
          if (!userJoined) return null;
          const isCreator = event.createdBy === (currentUser as any)?._id || event.createdBy === currentUser?.id;
          return (
            <ChatPanel
              eventId={event.id}
              eventTitle={event.title}
              currentUserId={(currentUser as any)?._id || currentUser?.id || ''}
              isEventCreator={isCreator}
              onClose={() => setChatOpen(false)}
            />
          );
        })()}

        {/* Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
