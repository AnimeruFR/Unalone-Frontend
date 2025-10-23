import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert } from '@mui/material';
import MapComponent from './components/MapComponent';
import SidebarComponent from './components/SidebarComponent';
import CreateEventModal from './components/CreateEventModal';
import { useGeolocation } from './hooks/useGeolocation';
import { eventsApi, Event, CreateEventData, apiUtils } from './services/api';
import { unaloneTheme, customStyles } from './styles/theme';

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

  // Géolocalisation
  const { position: userPosition, error: geoError } = useGeolocation();

  // ID utilisateur temporaire
  const currentUserId = apiUtils.generateTempUserId();

  // Charger les événements au démarrage
  useEffect(() => {
    loadEvents();
  }, []);

  // Injecter les styles CSS personnalisés
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Pour l'instant, utilisons des données de test si l'API échoue
      try {
        const eventsData = await eventsApi.getAll();
        setEvents(eventsData);
      } catch (apiError) {
        console.log('API non disponible, utilisation de données de test');
        // Données de test basées sur votre application originale
        const testEvents: Event[] = [
          {
            id: 'test-1',
            title: 'Apéro jeux de société',
            type: 'Rencontre amicale',
            audience: 'Ouvert à tous',
            datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Venez découvrir de nouveaux jeux et rencontrer des gens sympas !',
            placeName: 'Bar Hemingway, Paris 1er',
            lat: 48.8566,
            lng: 2.3522,
            maxAttendees: 12,
            attendees: [
              { id: 'user1', name: 'Alice' },
              { id: 'user2', name: 'Bob' }
            ],
            contactLink: 'https://t.me/apero_jeux',
            createdBy: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'test-2',
            title: 'Course à pied matinale',
            type: 'Rencontre sportive',
            audience: 'Adultes uniquement',
            datetime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Course de 5km dans le parc, niveau débutant bienvenu !',
            placeName: 'Parc des Buttes-Chaumont, Paris',
            lat: 48.8799,
            lng: 2.3828,
            maxAttendees: 8,
            attendees: [
              { id: 'user3', name: 'Charlie' }
            ],
            createdBy: 'user3',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setEvents(testEvents);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setError('Impossible de charger les événements');
      showSnackbar('Erreur lors du chargement des événements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventData) => {
    try {
      // Essayer l'API d'abord
      try {
        const newEvent = await eventsApi.create(eventData);
        setEvents(prev => [newEvent, ...prev]);
      } catch (apiError) {
        // Fallback: créer un événement local pour les tests
        const newEvent: Event = {
          id: 'local-' + Date.now(),
          ...eventData,
          attendees: [],
          createdBy: currentUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setEvents(prev => [newEvent, ...prev]);
      }
      showSnackbar('Événement créé avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      showSnackbar('Erreur lors de la création de l\'événement', 'error');
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      try {
        const updatedEvent = await eventsApi.join(eventId);
        setEvents(prev => prev.map(event => 
          event.id === eventId ? updatedEvent : event
        ));
      } catch (apiError) {
        // Fallback local
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            const isAlreadyJoined = event.attendees.some(a => a.id === currentUserId);
            if (!isAlreadyJoined) {
              return {
                ...event,
                attendees: [...event.attendees, { id: currentUserId, name: 'Vous' }]
              };
            }
          }
          return event;
        }));
      }
      showSnackbar('Vous avez rejoint l\'événement !', 'success');
    } catch (error) {
      console.error('Erreur lors de la participation à l\'événement:', error);
      showSnackbar('Erreur lors de la participation', 'error');
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      try {
        const updatedEvent = await eventsApi.leave(eventId);
        setEvents(prev => prev.map(event => 
          event.id === eventId ? updatedEvent : event
        ));
      } catch (apiError) {
        // Fallback local
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              attendees: event.attendees.filter(a => a.id !== currentUserId)
            };
          }
          return event;
        }));
      }
      showSnackbar('Vous avez quitté l\'événement', 'success');
    } catch (error) {
      console.error('Erreur lors de la sortie de l\'événement:', error);
      showSnackbar('Erreur lors de la sortie', 'error');
    }
  };

  const handleZoomToEvent = (event: Event) => {
    console.log('Zoom vers l\'événement:', event.title);
    // Cette fonction sera implémentée pour centrer la carte sur l'événement
  };

  const handleEventSelect = (event: Event) => {
    console.log('Événement sélectionné:', event.title);
    // Cette fonction sera appelée quand un événement est sélectionné depuis la carte
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={unaloneTheme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        background: unaloneTheme.unalone.gradients.background,
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <SidebarComponent
          events={events}
          onCreateEvent={() => setCreateModalOpen(true)}
          onJoinEvent={handleJoinEvent}
          onLeaveEvent={handleLeaveEvent}
          onZoomToEvent={handleZoomToEvent}
          userPosition={userPosition}
          currentUserId={currentUserId}
        />

        {/* Carte */}
        <Box sx={{ flex: 1 }}>
          <MapComponent
            events={events}
            onEventSelect={handleEventSelect}
            userPosition={userPosition}
          />
        </Box>

        {/* Modal de création d'événement */}
        <CreateEventModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreateEvent={handleCreateEvent}
          userPosition={userPosition}
        />

        {/* Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;