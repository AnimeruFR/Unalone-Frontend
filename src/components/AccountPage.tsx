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
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
  useTheme,
  useMediaQuery
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
  MoreVert as MoreVertIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { Event, User, eventsApi, authApi, rgpdApi, apiUtils } from '../services/api';
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
  // RGPD state
  const [consentPrefs, setConsentPrefs] = useState<{necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean}>(
    { necessary: true, functional: false, analytics: false, marketing: false }
  );
  const [consentDate, setConsentDate] = useState<string | null>(null);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // UI responsive helpers and mobile actions menu anchor
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);

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

      // Charger les préférences de consentement
      loadConsent();
    }
  }, [currentUser]);

  const loadConsent = async () => {
    setLoadingConsent(true);
    try {
      // Local
      const raw = localStorage.getItem('cookieConsent');
      const rawDate = localStorage.getItem('cookieConsentDate');
      if (raw) {
        const prefs = JSON.parse(raw);
        setConsentPrefs({
          necessary: true,
          functional: !!prefs.functional,
          analytics: !!prefs.analytics,
          marketing: !!prefs.marketing
        });
      }
      if (rawDate) setConsentDate(rawDate);

      // Serveur (si connecté)
      if (apiUtils.isAuthenticated()) {
        const res = await rgpdApi.getConsentHistory();
        if (res?.currentConsent) {
          const p = res.currentConsent;
          setConsentPrefs({
            necessary: true,
            functional: !!p.functional,
            analytics: !!p.analytics,
            marketing: !!p.marketing
          });
          if (p.consentDate) setConsentDate(p.consentDate);
        }
      }
    } catch (e) {
      console.warn('Impossible de charger les préférences de consentement', e);
    } finally {
      setLoadingConsent(false);
    }
  };

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

  // RGPD handlers
  const handleConsentToggle = (key: 'functional' | 'analytics' | 'marketing') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConsentPrefs(prev => ({ ...prev, [key]: event.target.checked }));
  };

  const saveConsentLocallyAndServer = async (prefs: {necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean}) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    const now = new Date().toISOString();
    localStorage.setItem('cookieConsentDate', now);
    setConsentDate(now);
    try {
      await rgpdApi.saveConsent(prefs);
    } catch { /* non bloquant */ }
  };

  const handleSaveConsent = async () => {
    try {
      await saveConsentLocallyAndServer(consentPrefs);
      setSnackbar({ open: true, message: 'Préférences de cookies enregistrées ✅', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de l’enregistrement des préférences', severity: 'error' });
    }
  };

  const handleRevokeConsent = async () => {
    const revoked = { necessary: true, functional: false, analytics: false, marketing: false };
    setConsentPrefs(revoked);
    await saveConsentLocallyAndServer(revoked);
    setSnackbar({ open: true, message: 'Consentement révoqué. Seuls les cookies nécessaires restent actifs.', severity: 'info' });
  };

  const handleDownloadData = async () => {
    if (!apiUtils.isAuthenticated()) {
      setSnackbar({ open: true, message: 'Connectez-vous pour exporter vos données', severity: 'warning' });
      return;
    }
    setIsExporting(true);
    try {
      const response = await rgpdApi.exportData();
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unalone-mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Vos données ont été exportées', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Erreur lors de l’export des données', severity: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Veuillez entrer votre mot de passe');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await rgpdApi.deleteAccount(deletePassword);
      localStorage.removeItem('authToken');
      setSnackbar({ open: true, message: 'Compte supprimé définitivement', severity: 'success' });
      setShowDeleteDialog(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message || 'Suppression impossible');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeletePassword('');
    setDeleteError('');
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
                    <Box sx={{ width: '100%', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, wordBreak: 'break-word' }}>{event.title}</Typography>
                        {/* Meta informations: stack lines on desktop for readability; keep inline/wrapping on mobile */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'column',
                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                            alignItems: isMobile ? 'center' : 'flex-start',
                            gap: isMobile ? 2 : 0.5,
                            mb: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <EventIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
                            <Typography variant="body2">{formatEventDate(event.datetime)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <LocationOnIcon sx={{ fontSize: 18, mr: 0.5, color: 'secondary.main' }} />
                            <Typography variant="body2">{event.placeName}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <GroupIcon sx={{ fontSize: 18, mr: 0.5, color: 'grey.600' }} />
                            <Typography variant="body2">{event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      {isMobile ? (
                        <Box sx={{ mt: 1, ml: 0 }}>
                          <IconButton onClick={(e) => setActionMenuAnchor(e.currentTarget)} size="small">
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            anchorEl={actionMenuAnchor}
                            open={Boolean(actionMenuAnchor)}
                            onClose={() => setActionMenuAnchor(null)}
                          >
                            <MenuItem onClick={() => { setActionMenuAnchor(null); onEventSelect?.(event); }}>
                              <VisibilityIcon sx={{ mr: 1 }} /> Voir sur la carte
                            </MenuItem>
                            <MenuItem onClick={() => { setActionMenuAnchor(null); handleEventAdmin(event); }}>
                              <GroupIcon sx={{ mr: 1 }} /> Administrer
                            </MenuItem>
                            <MenuItem onClick={() => { setActionMenuAnchor(null); handleDeleteEvent(event.id); }} sx={{ color: 'error.main' }}>
                              <DeleteIcon sx={{ mr: 1 }} /> Supprimer
                            </MenuItem>
                          </Menu>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2, gap: 1 }}>
                          <Tooltip title="Voir sur la carte"><span><IconButton onClick={() => onEventSelect?.(event)} size="small"><VisibilityIcon sx={{ color: 'grey.600' }} /></IconButton></span></Tooltip>
                          <Tooltip title="Administrer"><span><IconButton onClick={() => handleEventAdmin(event)} size="small"><GroupIcon sx={{ color: 'primary.main' }} /></IconButton></span></Tooltip>
                          <Tooltip title="Supprimer"><span><IconButton onClick={() => handleDeleteEvent(event.id)} size="small"><DeleteIcon sx={{ color: 'error.main' }} /></IconButton></span></Tooltip>
                        </Box>
                      )}
                    </Box>
  {/* Pour le menu d'actions sur mobile */}
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
                    {/* Avoid nested <p> tags: we manage our own Typography and disable ListItemText wrappers */}
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, wordBreak: 'break-word' }}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'column',
                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                            alignItems: isMobile ? 'center' : 'flex-start',
                            gap: isMobile ? 2 : 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <EventIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
                            <Typography variant="body2">{formatEventDate(event.datetime)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <LocationOnIcon sx={{ fontSize: 18, mr: 0.5, color: 'secondary.main' }} />
                            <Typography variant="body2" sx={{ maxWidth: { xs: '100%', md: 600 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {event.placeName}
                            </Typography>
                          </Box>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Vie privée & RGPD</Typography>

                  {loadingConsent ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Chargement des préférences…</Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Gérez vos préférences de cookies. Les cookies nécessaires sont toujours actifs.
                        {consentDate && (
                          <>
                            <br />Dernier consentement: {new Date(consentDate).toLocaleString('fr-FR')}
                          </>
                        )}
                      </Typography>

                      <FormControlLabel
                        control={<Switch checked disabled />}
                        label="Cookies nécessaires (obligatoires)"
                        sx={{ display: 'block', mb: 1 }}
                      />
                      <FormControlLabel
                        control={<Switch checked={consentPrefs.functional} onChange={handleConsentToggle('functional')} />}
                        label="Cookies fonctionnels"
                        sx={{ display: 'block', mb: 1 }}
                      />
                      <FormControlLabel
                        control={<Switch checked={consentPrefs.analytics} onChange={handleConsentToggle('analytics')} />}
                        label="Cookies analytiques"
                        sx={{ display: 'block', mb: 1 }}
                      />
                      <FormControlLabel
                        control={<Switch checked={consentPrefs.marketing} onChange={handleConsentToggle('marketing')} />}
                        label="Cookies marketing"
                        sx={{ display: 'block' }}
                      />

                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        <Button variant="contained" onClick={handleSaveConsent}>
                          Enregistrer mes préférences
                        </Button>
                        <Button variant="outlined" color="warning" onClick={handleRevokeConsent}>
                          Révoquer mon consentement
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={handleDownloadData}
                          startIcon={isExporting ? <CircularProgress size={16} /> : undefined}
                          disabled={isExporting}
                        >
                          Télécharger mes données
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Paramètres du compte</Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Button variant="outlined" color="warning">
                      Changer le mot de passe
                    </Button>
                    <Button variant="outlined" color="error" onClick={openDeleteDialog}>
                      Supprimer le compte
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
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
                            secondary={attendee.joinedAt ? `Inscrit le ${formatEventDate(attendee.joinedAt)}` : 'Date inconnue'}
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

      {/* Dialog suppression de compte */}
      <Dialog open={showDeleteDialog} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          Supprimer définitivement mon compte
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Cette action est irréversible. Toutes vos données (événements, participations, messages) seront supprimées.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Pour confirmer, entrez votre mot de passe :
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Mot de passe"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            error={!!deleteError}
            helperText={deleteError}
            disabled={isDeleting}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>Annuler</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmDelete}
            disabled={isDeleting || !deletePassword.trim()}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isDeleting ? 'Suppression…' : 'Confirmer la suppression'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountPage;