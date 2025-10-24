import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Grid,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Menu,
  MenuItem,
  ListItemAvatar,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Share as ShareIcon,
  Cancel as CancelIcon,
  VolumeOff as MuteIcon,
  PersonRemove as KickIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Event, User, eventsApi, authApi } from '../services/api';
import CreateEventModal from './CreateEventModal';

interface AccountPageProps {
  currentUser: User | null;
  onBack: () => void;
  onEventSelect?: (event: Event) => void;
  onUserUpdate?: (user: User) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AccountPage: React.FC<AccountPageProps> = ({ currentUser, onBack, onEventSelect, onUserUpdate }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    age: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventAdminOpen, setEventAdminOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [participantMenuAnchor, setParticipantMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  useEffect(() => {
    if (currentUser) {
      // Initialiser les données du profil
      const user = currentUser as any;
      setProfileData({
        email: user.email || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        bio: user.profile?.bio || '',
        age: user.profile?.age?.toString() || ''
      });
      
      // Charger les événements de l'utilisateur
      loadUserEvents();
    }
  }, [currentUser]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      // Pour l'instant, on récupère tous les événements et on filtre côté client
      // Dans une vraie app, il faudrait des endpoints spécifiques
      const allEvents = await eventsApi.getAll();
      console.log('Tous les événements:', allEvents);
      console.log('ID utilisateur actuel:', currentUser?.id);
      console.log('Utilisateur actuel complet:', currentUser);
      
      const userEvents = allEvents.filter(event => {
        console.log(`Événement "${event.title}" créé par:`, event.createdBy, 'vs user:', currentUser?.id);
        return event.createdBy === currentUser?.id || event.createdBy === (currentUser as any)?._id;
      });
      
      const userJoinedEvents = allEvents.filter(event => 
        event.attendees.some(attendee => attendee.id === currentUser?.id || attendee.id === (currentUser as any)?._id)
      );
      
      console.log('Événements créés par l\'utilisateur:', userEvents);
      console.log('Événements rejoints par l\'utilisateur:', userJoinedEvents);
      
      setCreatedEvents(userEvents);
      setJoinedEvents(userJoinedEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        console.log('Tentative de suppression de l\'événement:', eventId);
        console.log('Utilisateur actuel:', currentUser);
        await eventsApi.delete(eventId);
        setCreatedEvents(prev => prev.filter(e => e.id !== eventId));
        setSnackbar({ open: true, message: 'Événement supprimé avec succès', severity: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        console.error('Détails de l\'erreur:', error.response?.data);
        const errorMsg = error.response?.data?.message || 'Impossible de supprimer l\'événement';
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const ageNum = profileData.age ? parseInt(profileData.age, 10) : undefined;
      const updatedUser = await authApi.updateProfile({
        email: profileData.email?.trim() || undefined,
        firstName: profileData.firstName?.trim() || undefined,
        lastName: profileData.lastName?.trim() || undefined,
        bio: profileData.bio?.trim() || undefined,
        age: ageNum,
      });

      // Mettre à jour l'état local
      const userAny: any = updatedUser as any;
      setProfileData({
        email: userAny.email || '',
        firstName: userAny.profile?.firstName || '',
        lastName: userAny.profile?.lastName || '',
        bio: userAny.profile?.bio || '',
        age: (userAny.profile?.age !== undefined && userAny.profile?.age !== null) ? String(userAny.profile?.age) : ''
      });

      // Informer l'application parente si nécessaire
      onUserUpdate?.(updatedUser);

      setEditMode(false);
      setSnackbar({ open: true, message: 'Profil mis à jour ✅', severity: 'success' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setSnackbar({ open: true, message: 'Impossible de mettre à jour le profil. Vérifiez les champs et réessayez.', severity: 'error' });
    }
  };

  const handleEventAdmin = (event: Event) => {
    setSelectedEvent(event);
    setEventAdminOpen(true);
  };

  const handleCloseEventAdmin = () => {
    setSelectedEvent(null);
    setEventAdminOpen(false);
    setParticipantMenuAnchor(null);
    setSelectedParticipant(null);
  };

  const handleOpenEditEvent = () => {
    setEditEventOpen(true);
    setEventAdminOpen(false);
  };

  const handleCloseEditEvent = () => {
    setEditEventOpen(false);
    // Recharger l'événement pour avoir les dernières données
    loadUserEvents();
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!selectedEvent) return;
    
    try {
      await eventsApi.update(selectedEvent.id, eventData);
      setSnackbar({ open: true, message: 'Événement modifié avec succès', severity: 'success' });
      setEditEventOpen(false);
      loadUserEvents();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      const errorMsg = error.response?.data?.message || 'Impossible de modifier l\'événement';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleParticipantMenuOpen = (event: React.MouseEvent<HTMLElement>, participant: any) => {
    setParticipantMenuAnchor(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleParticipantMenuClose = () => {
    setParticipantMenuAnchor(null);
    setSelectedParticipant(null);
  };

  const handleKickParticipant = async () => {
    if (!selectedEvent || !selectedParticipant) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir exclure ${selectedParticipant.name || 'cet utilisateur'} de l'événement ?`)) {
      // Fermer le menu immédiatement
      handleParticipantMenuClose();
      
      try {
        await eventsApi.kickParticipant(selectedEvent.id, selectedParticipant.id);
        setSnackbar({ open: true, message: 'Participant exclu de l\'événement', severity: 'success' });
        
        // Recharger les événements et mettre à jour l'événement sélectionné
        const allEvents = await eventsApi.getAll();
        const userEvents = allEvents.filter(event => {
          return event.createdBy === currentUser?.id || event.createdBy === (currentUser as any)?._id;
        });
        const userJoinedEvents = allEvents.filter(event => 
          event.attendees.some(attendee => attendee.id === currentUser?.id || attendee.id === (currentUser as any)?._id)
        );
        
        setCreatedEvents(userEvents);
        setJoinedEvents(userJoinedEvents);
        
        // Mettre à jour l'événement sélectionné dans la modal
        const updatedEvent = allEvents.find(e => e.id === selectedEvent.id);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'exclusion:', error);
        const errorMsg = error.response?.data?.message || 'Impossible d\'exclure le participant';
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  const handleMuteParticipant = async () => {
    if (!selectedEvent || !selectedParticipant) return;
    
    const isMuted = selectedParticipant.role === 'muted';
    const newRole = isMuted ? 'member' : 'muted';
    
    // Fermer le menu immédiatement
    handleParticipantMenuClose();
    
    try {
      await eventsApi.updateParticipantRole(selectedEvent.id, selectedParticipant.id, newRole);
      setSnackbar({ 
        open: true, 
        message: isMuted 
          ? `${selectedParticipant.name || 'L\'utilisateur'} a été réactivé dans le chat`
          : `${selectedParticipant.name || 'L\'utilisateur'} a été désactivé du chat`, 
        severity: 'success' 
      });
      
      // Recharger les événements et mettre à jour l'événement sélectionné
      const allEvents = await eventsApi.getAll();
      const userEvents = allEvents.filter(event => {
        return event.createdBy === currentUser?.id || event.createdBy === (currentUser as any)?._id;
      });
      const userJoinedEvents = allEvents.filter(event => 
        event.attendees.some(attendee => attendee.id === currentUser?.id || attendee.id === (currentUser as any)?._id)
      );
      
      setCreatedEvents(userEvents);
      setJoinedEvents(userJoinedEvents);
      
      // Mettre à jour l'événement sélectionné dans la modal
      const updatedEvent = allEvents.find(e => e.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    } catch (error: any) {
      console.error('Erreur lors du mute/unmute:', error);
      const errorMsg = error.response?.data?.message || 'Impossible de modifier le statut du chat';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handlePromoteParticipant = async () => {
    if (!selectedEvent || !selectedParticipant) return;
    
    // Toggle entre admin et member
    const isAdmin = selectedParticipant.role === 'admin';
    const newRole = isAdmin ? 'member' : 'admin';
    
    // Fermer le menu immédiatement
    handleParticipantMenuClose();
    
    try {
      await eventsApi.updateParticipantRole(selectedEvent.id, selectedParticipant.id, newRole);
      setSnackbar({ 
        open: true, 
        message: isAdmin
          ? `${selectedParticipant.name || 'L\'utilisateur'} n'est plus administrateur`
          : `${selectedParticipant.name || 'L\'utilisateur'} est maintenant administrateur`, 
        severity: 'success' 
      });
      
      // Recharger les événements et mettre à jour l'événement sélectionné
      const allEvents = await eventsApi.getAll();
      const userEvents = allEvents.filter(event => {
        return event.createdBy === currentUser?.id || event.createdBy === (currentUser as any)?._id;
      });
      const userJoinedEvents = allEvents.filter(event => 
        event.attendees.some(attendee => attendee.id === currentUser?.id || attendee.id === (currentUser as any)?._id)
      );
      
      setCreatedEvents(userEvents);
      setJoinedEvents(userJoinedEvents);
      
      // Mettre à jour l'événement sélectionné dans la modal
      const updatedEvent = allEvents.find(e => e.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    } catch (error: any) {
      console.error('Erreur lors de la promotion/rétrogradation:', error);
      const errorMsg = error.response?.data?.message || 'Impossible de modifier le statut administrateur';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et l\'événement sera définitivement supprimé.')) {
      try {
        await eventsApi.delete(eventId);
        setSnackbar({ 
          open: true, 
          message: 'Événement supprimé avec succès', 
          severity: 'success' 
        });
        handleCloseEventAdmin();
        await loadUserEvents(); // Recharger les événements
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        const errorMsg = error.response?.data?.message || 'Impossible de supprimer l\'événement';
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Veuillez vous connecter pour accéder à votre compte</Typography>
        <Button onClick={onBack} sx={{ mt: 2 }}>Retour</Button>
      </Box>
    );
  }

  const user = currentUser as any;

  return (
    <Box sx={{ 
      height: '100vh', 
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PersonIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {user.username || 'Utilisateur'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={`${createdEvents.length} événements créés`} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip 
                label={`${joinedEvents.length} participations`} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="account tabs">
          <Tab icon={<PersonIcon />} label="Profil" />
          <Tab icon={<EventIcon />} label="Mes événements" />
          <Tab icon={<SettingsIcon />} label="Paramètres" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TabPanel value={currentTab} index={0}>
          {/* Profil */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography variant="h6">Informations personnelles</Typography>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(!editMode)}
                  variant={editMode ? 'contained' : 'outlined'}
                >
                  {editMode ? 'Annuler' : 'Modifier'}
                </Button>
              </Box>
              
              {editMode ? (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <TextField
                    label="Prénom"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  />
                  <TextField
                    label="Nom"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  />
                  <TextField
                    label="Âge"
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  />
                  <TextField
                    label="Bio"
                    multiline
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  />
                  <Button variant="contained" onClick={handleProfileUpdate}>
                    Sauvegarder
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography><strong>Email:</strong> {user.email || (user as any).email || 'Non renseigné'}</Typography>
                  <Typography><strong>Nom d'utilisateur:</strong> {user.username}</Typography>
                  <Typography><strong>Prénom:</strong> {profileData.firstName || 'Non renseigné'}</Typography>
                  <Typography><strong>Nom:</strong> {profileData.lastName || 'Non renseigné'}</Typography>
                  <Typography><strong>Âge:</strong> {profileData.age || 'Non renseigné'}</Typography>
                  <Typography><strong>Bio:</strong> {profileData.bio || 'Aucune description'}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {/* Mes événements */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Événements créés ({createdEvents.length})</Typography>
            {createdEvents.length === 0 ? (
              <Alert severity="info">Vous n'avez créé aucun événement pour le moment.</Alert>
            ) : (
              <List>
                {createdEvents.map((event) => (
                  <ListItem key={event.id} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            📅 {formatEventDate(event.datetime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📍 {event.placeName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            👥 {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        onClick={() => onEventSelect?.(event)}
                        sx={{ mr: 1 }}
                        title="Voir sur la carte"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleEventAdmin(event)}
                        sx={{ mr: 1 }}
                        color="primary"
                        title="Administrer"
                      >
                        <GroupIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteEvent(event.id)}
                        color="error"
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Événements rejoints ({joinedEvents.length})</Typography>
            {joinedEvents.length === 0 ? (
              <Alert severity="info">Vous ne participez à aucun événement pour le moment.</Alert>
            ) : (
              <List>
                {joinedEvents.map((event) => (
                  <ListItem key={event.id} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            📅 {formatEventDate(event.datetime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📍 {event.placeName}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => onEventSelect?.(event)}>
                        <VisibilityIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {/* Paramètres */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Paramètres du compte</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Les paramètres avancés seront disponibles dans une prochaine version.
              </Alert>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Button variant="outlined" color="warning">
                  Changer le mot de passe
                </Button>
                <Button variant="outlined" color="error">
                  Supprimer le compte
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>

      {/* Modal d'administration d'événement */}
      <Dialog 
        open={eventAdminOpen} 
        onClose={handleCloseEventAdmin}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupIcon />
            Administration de l'événement
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedEvent.title}
              </Typography>
              
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    📊 Statistiques
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'white' }}>
                      <Typography variant="h4">{selectedEvent.attendees.length}</Typography>
                      <Typography variant="body2">Participants</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'white' }}>
                      <Typography variant="h4">{selectedEvent.maxAttendees || '∞'}</Typography>
                      <Typography variant="body2">Limite</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    👥 Liste des participants ({selectedEvent.attendees.length})
                  </Typography>
                  {selectedEvent.attendees.length === 0 ? (
                    <Alert severity="info">Aucun participant pour le moment</Alert>
                  ) : (
                    <List dense>
                      {selectedEvent.attendees.map((attendee, index) => (
                        <ListItem 
                          key={attendee.id || index}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={(e) => handleParticipantMenuOpen(e, attendee)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: attendee.role === 'admin' ? 'primary.main' : 
                                       attendee.role === 'muted' ? 'warning.main' : 'default' 
                            }}>
                              {attendee.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {attendee.name || 'Utilisateur'}
                                {attendee.role === 'admin' && (
                                  <Chip label="Admin" size="small" color="primary" />
                                )}
                                {attendee.role === 'muted' && (
                                  <Chip label="Muet" size="small" color="warning" />
                                )}
                              </Box>
                            }
                            secondary={`Inscrit le ${formatEventDate(selectedEvent.createdAt)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    ⚙️ Actions d'administration
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleOpenEditEvent}
                    >
                      Modifier l'événement
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}?event=${selectedEvent.id}`);
                        alert('Lien copié dans le presse-papiers !');
                      }}
                    >
                      Partager
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<CancelIcon />}
                      onClick={() => handleCancelEvent(selectedEvent.id)}
                    >
                      Supprimer l'événement
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventAdmin}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Menu contextuel pour les participants */}
      <Menu
        anchorEl={participantMenuAnchor}
        open={Boolean(participantMenuAnchor)}
        onClose={handleParticipantMenuClose}
      >
        <MenuItem onClick={handleMuteParticipant}>
          <MuteIcon sx={{ mr: 1 }} fontSize="small" />
          {selectedParticipant?.role === 'muted' ? 'Réactiver le chat' : 'Désactiver le chat'}
        </MenuItem>
        <MenuItem onClick={handlePromoteParticipant}>
          <AdminIcon sx={{ mr: 1 }} fontSize="small" />
          {selectedParticipant?.role === 'admin' ? 'Retirer admin' : 'Promouvoir administrateur'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleKickParticipant} sx={{ color: 'error.main' }}>
          <KickIcon sx={{ mr: 1 }} fontSize="small" />
          Exclure de l'événement
        </MenuItem>
      </Menu>

      {/* Modal d'édition d'événement */}
      {selectedEvent && (
        <CreateEventModal
          open={editEventOpen}
          onClose={handleCloseEditEvent}
          onCreateEvent={handleUpdateEvent}
          userPosition={null}
          initialEvent={selectedEvent}
        />
      )}

      {/* Snackbar de retour utilisateur */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountPage;