import React, { useEffect, useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert, Fab, Button, Tooltip, AppBar, Toolbar, IconButton, useMediaQuery, Typography, SwipeableDrawer, Menu, MenuItem } from '@mui/material';
import MapComponent, { MapComponentHandle } from './components/MapComponent';
import SidebarComponent from './components/SidebarComponent';
import CreateEventModal from './components/CreateEventModal';
import AccountPage from './components/AccountPage';
import ChatPanel from './components/ChatPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { eventsApi, Event, CreateEventData, apiUtils, User, authApi } from './services/api';
import { socketService } from './services/socket';
import { unaloneTheme, customStyles } from './styles/theme';
import { Add as AddIcon, AccountCircle as AccountIcon, Menu as MenuIcon, MyLocation as MyLocationIcon, Close as CloseIcon, Logout as LogoutIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AuthModal from './components/AuthModal';
import EventDetailsModal from './components/EventDetailsModal';
import CookieConsent from './components/CookieConsent';
import RGPDMenu from './components/RGPDMenu';

function App() {
  // Déclaration de tous les hooks d'abord
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const currentUserId = apiUtils.generateTempUserId();
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');
  const mapRef = React.useRef<MapComponentHandle | null>(null);
  // Géolocalisation
  const { position: userPosition, permission: geoPermission, requestPermission: requestGeo, error: geoError } = useGeolocation();

  // Fonctions utilitaires ensuite
  const handleBackToMap = () => setCurrentView('map');
  const handleRequestGeo = () => {
    if (geoPermission === 'denied') {
      // Permission refusée, rien à faire (message déjà géré dans le JSX)
      return;
    }
    if (typeof requestGeo === 'function') requestGeo();
  };
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

    const onParticipantRoleUpdated = async (payload: any) => {
      // Quand un rôle de participant change, recharger l'événement pour avoir les données à jour
      console.log('🔄 Rôle participant mis à jour:', payload);
      if (payload?.eventId) {
        try {
          const eventsData = await eventsApi.getAll();
          setEvents(eventsData);
        } catch (err) {
          console.error('Erreur rechargement événements après changement rôle:', err);
        }
      }
    };

    const onParticipantKicked = async (payload: any) => {
      // Quand l'utilisateur actuel est expulsé d'un événement
      console.log('⚠️ Vous avez été exclu d\'un événement:', payload);
      if (payload?.eventId === selectedEventId) {
        // Fermer le chat si l'événement actuel correspond
        setChatOpen(false);
        showSnackbar(`Vous avez été exclu de l'événement "${payload?.eventTitle || 'cet événement'}"`, 'error');
      }
      // Recharger les événements
      try {
        const eventsData = await eventsApi.getAll();
        setEvents(eventsData);
      } catch (err) {
        console.error('Erreur rechargement événements après exclusion:', err);
      }
    };

    socketService.on('events:created', onCreated);
    socketService.on('events:updated', onUpdated);
    socketService.on('events:deleted', onDeleted);
    socketService.on('participant:roleUpdated', onParticipantRoleUpdated);
    socketService.on('participant:kicked', onParticipantKicked);

    return () => {
      socketService.off('events:created', onCreated);
      socketService.off('events:updated', onUpdated);
      socketService.off('events:deleted', onDeleted);
      socketService.off('participant:roleUpdated', onParticipantRoleUpdated);
      socketService.off('participant:kicked', onParticipantKicked);
    };
  }, [isAuthenticated, selectedEventId]);

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
          role: p?.role ?? 'member', // Inclure le rôle
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

  // Charger les événements au démarrage
  const loadEvents = useCallback(async () => {
    try {
      const eventsData = await eventsApi.getAll();
      setEvents(eventsData);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Impossible de charger les événements');
      showSnackbar('Erreur lors du chargement des événements', 'error');
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // Injecter les styles CSS personnalisés
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  // loadEvents defined above with useCallback

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
    // Si l'utilisateur n'est pas connecté, afficher une erreur et ouvrir la modale d'authentification
    if (!isAuthenticated) {
      showSnackbar('Vous devez être connecté pour rejoindre un événement', 'error');
      setAuthOpen(true);
      return;
    }
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
    if (isMobile) {
      setDrawerOpen(true);
    }
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

  // Restaurer la session à l'actualisation si un token existe
  useEffect(() => {
    const token = apiUtils.getAuthToken();
    if (!token) return; // pas de token, rien à restaurer

    (async () => {
      try {
        const me = await authApi.verifyToken();
        setCurrentUser(me);
        setIsAuthenticated(true);
      } catch (err: any) {
        // Token invalide/expiré -> nettoyage
        console.warn('Vérification de session échouée, nettoyage du token');
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    })();
  }, []);


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
          overflow: 'hidden',
          pt: isMobile ? '56px' : 0 // Ajoute un padding-top sous l'AppBar mobile (56px = hauteur MUI AppBar)
        }}
      >
        {isMobile && (
          <AppBar position="fixed" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(6px)', background: 'rgba(255,255,255,0.6)' }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="open menu">
                <MenuIcon />
              </IconButton>
              {/* Compte/connexion mobile */}
              {isAuthenticated && currentUser ? (
                <Box>
                  <IconButton
                    color="primary"
                    onClick={(e) => setUserMenuAnchor(e.currentTarget as HTMLElement)}
                    aria-label="Mon compte"
                  >
                    <AccountIcon />
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => { setUserMenuAnchor(null); setCurrentView('account'); }}>
                      <AccountIcon sx={{ mr: 1 }} />
                      Mon compte
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); handleLogout(); }}>
                      <LogoutIcon sx={{ mr: 1 }} />
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button variant="outlined" size="small" onClick={() => setAuthOpen(true)}>
                  Se connecter
                </Button>
              )}
            </Toolbar>
          </AppBar>
        )}
        {currentView === 'map' ? (
          <>
            {/* Sidebar desktop only */}
            {!isMobile && (
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
            )}

            {/* Carte */}
            <Box sx={{ flex: 1, position: 'relative', pt: 0 }}>
              <MapComponent 
                ref={mapRef}
                events={events} 
                onEventSelect={handleEventSelect} 
                userPosition={userPosition}
                selectedEventId={selectedEventId}
                onMapBackgroundClick={() => { if (isMobile) setDrawerOpen(false); }}
              />

              {/* Bouton discret pour activer la géolocalisation, afin d'éviter les blocages du navigateur */}
              {typeof geoPermission === 'string' && geoPermission !== 'granted' && (
                <Box sx={{ position: 'absolute', left: 16, bottom: 16, zIndex: 1000 }}>
                  <Tooltip title={
                    geoPermission === 'denied'
                      ? "Permission refusée. Autorisez-la via l'icône cadenas à côté de l'URL, puis réessayez."
                      : geoError || 'Cliquez pour autoriser la géolocalisation'
                  }>
                    <Button size="small" variant="contained" onClick={handleRequestGeo}>
                      Activer ma position
                    </Button>
                  </Tooltip>
                </Box>
              )}

              {/* FAB Ma position et Créer un évènement sur mobile */}
              {isMobile && (
                <>
                  <Fab 
                    className="floating-fab"
                    color="primary" 
                    aria-label="Ma position"
                    sx={{ right: 16, bottom: 16, position: 'absolute', zIndex: 1100 }}
                    onClick={() => {
                      if (typeof geoPermission === 'string' && geoPermission !== 'granted') {
                        handleRequestGeo();
                      } else {
                        mapRef.current?.recenterToUser();
                      }
                    }}
                  >
                    <MyLocationIcon />
                  </Fab>
                  <Fab
                    color="secondary"
                    aria-label="Créer un évènement"
                    sx={{ left: 16, bottom: 16, position: 'absolute', zIndex: 1100 }}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <AddIcon />
                  </Fab>
                </>
              )}
            </Box>

            {/* Mobile Drawer bottom sheet for events list */}
            {isMobile && (
              <SwipeableDrawer
                anchor="bottom"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onOpen={() => setDrawerOpen(true)}
                disableBackdropTransition={false}
                disableDiscovery
                PaperProps={{ sx: { height: '100vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } as any, className: 'drawer-paper-safe' }}
              >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Drawer header with handle and close */}
                  <Box sx={{ p: 1.5, position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ width: 44, height: 4, bgcolor: '#cbd5e1', borderRadius: 2, mx: 'auto', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ textAlign: 'center', fontWeight: 700 }}>Événements</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ position: 'absolute', right: 8, top: 6 }} aria-label="Fermer">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
                  </Box>
                </Box>
              </SwipeableDrawer>
            )}
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
          
          // Vérifier si l'utilisateur est muté
          const currentUserAttendee = event.attendees.find(a => a.id === (currentUser as any)?._id || a.id === currentUser?.id);
          const isMuted = !isCreator && currentUserAttendee?.role === 'muted';
          
          return (
            <ChatPanel
              eventId={event.id}
              eventTitle={event.title}
              currentUserId={(currentUser as any)?._id || currentUser?.id || ''}
              isEventCreator={isCreator}
              isMuted={isMuted}
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
