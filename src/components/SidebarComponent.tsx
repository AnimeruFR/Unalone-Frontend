import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

import { Event, User } from '../services/api';

interface SidebarProps {
  events: Event[];
  onCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
  onLeaveEvent: (eventId: string) => void;
  onZoomToEvent: (event: Event) => void;
  onManageEvent?: (eventId: string) => void;
  userPosition: [number, number] | null;
  currentUserId: string;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
  onGoToAccount?: () => void;
  selectedEventId?: string | null;
}

const eventTypes = [
  'Rencontre amicale',
  "Rencontre d'un soir (consensuelle, adultes)",
  "Rencontre associative", 
  "Rencontre sportive",
  "Rencontre professionnelle",
  "Rencontre communautaire",
  "Rencontre de jeux (JDR)",
  "Action citoyenne / militante pacifique"
];

const SidebarComponent: React.FC<SidebarProps> = ({
  events,
  onCreateEvent,
  onJoinEvent,
  onLeaveEvent,
  onZoomToEvent,
  onManageEvent,
  userPosition,
  currentUserId,
  onOpenAuth,
  isAuthenticated = false,
  currentUser = null,
  onLogout,
  onGoToAccount,
  selectedEventId
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [highlightEventId, setHighlightEventId] = useState<string | null>(null);

  // Fonction pour calculer la distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filtrer et trier les événements
  const filteredAndSortedEvents = useMemo(() => {
    const inputEvents: Event[] = Array.isArray(events) ? events : [];
    let filtered = inputEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchText.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchText.toLowerCase()) ||
                           event.placeName.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = !filterType || event.type === filterType;
      return matchesSearch && matchesType;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
        case 'distance':
          if (!userPosition) return 0;
          const distA = calculateDistance(userPosition[0], userPosition[1], a.lat, a.lng);
          const distB = calculateDistance(userPosition[0], userPosition[1], b.lat, b.lng);
          return distA - distB;
        case 'popularity':
          return (b.attendees?.length || 0) - (a.attendees?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, searchText, filterType, sortBy, userPosition]);

  const formatEventDate = (datetime: string): string => {
    const date = new Date(datetime);
    return date.toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserJoined = (event: Event): boolean => {
    const userId = (currentUser as any)?._id || (currentUser as any)?.id || currentUserId;
    return event.attendees?.some(attendee => 
      attendee.id === userId || 
      (attendee as any)._id === userId ||
      attendee.id === (userId as any)?._id
    ) || false;
  };

  const isEventOwner = (event: Event): boolean => {
    const userId = (currentUser as any)?._id || (currentUser as any)?.id || currentUserId;
    return event.createdBy === userId || event.createdBy === (userId as any)?._id;
  };

  const isEventFull = (event: Event): boolean => {
    return !!(event.maxAttendees && event.attendees?.length >= event.maxAttendees);
  };

  // Quand un événement est sélectionné depuis la carte, faire défiler et surligner
  React.useEffect(() => {
    if (!selectedEventId) return;
    const el = document.getElementById(`event-${selectedEventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightEventId(selectedEventId);
      const timer = setTimeout(() => setHighlightEventId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId]);

  return (
    <Box sx={{ 
      width: 380, 
      height: '100vh', 
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 800,
            mb: 1
          }}>
            🌟 UnAlone
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Trouvez des événements près de vous
          </Typography>
        </Box>
        {isAuthenticated && currentUser ? (
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AccountIcon />}
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
          >
            {(currentUser as any).username || currentUser.name || currentUser.email || 'Utilisateur'}
          </Button>
        ) : (
          <Button variant="outlined" size="small" onClick={onOpenAuth}>
            Se connecter
          </Button>
        )}
        
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
        >
          <MenuItemComponent onClick={() => { setUserMenuAnchor(null); onGoToAccount?.(); }}>
            <AccountIcon sx={{ mr: 1 }} />
            Mon compte
          </MenuItemComponent>
          <MenuItemComponent onClick={() => { setUserMenuAnchor(null); onLogout?.(); }}>
            <LogoutIcon sx={{ mr: 1 }} />
            Déconnexion
          </MenuItemComponent>
        </Menu>
      </Box>

      {/* Recherche et filtres */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="🔍 Rechercher un événement..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Accordion expanded={showFilters} onChange={() => setShowFilters(!showFilters)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon />
              <Typography>Filtres et tri</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type d'événement</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type d'événement"
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  {eventTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Trier par</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Trier par"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="popularity">Popularité</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedEvents.length} événement{filteredAndSortedEvents.length > 1 ? 's' : ''}
          </Typography>
          {isAuthenticated && (
            <Button 
              variant="contained" 
              size="small"
              onClick={onCreateEvent}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                px: 2
              }}
            >
              ➕ Créer
            </Button>
          )}
        </Box>
      </Box>

      {/* Liste des événements */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        <List sx={{ pb: 10 }}>
          {filteredAndSortedEvents.map((event) => {
            const attendeeCount = event.attendees?.length || 0;
            const isFull = isEventFull(event);
            const isJoined = isUserJoined(event);
            const isOwner = isEventOwner(event);
            const distance = userPosition ? 
              calculateDistance(userPosition[0], userPosition[1], event.lat, event.lng) : null;

            return (
              <ListItem key={event.id} id={`event-${event.id}`} sx={{ px: 0, pb: 2 }}>
                <Card sx={{ 
                  width: '100%',
                  background: isOwner 
                    ? 'linear-gradient(145deg, #fef7ee 0%, #fed7aa 100%)' 
                    : isJoined 
                      ? 'linear-gradient(145deg, #f0fff4 0%, #dcfce7 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                  boxShadow: isOwner 
                    ? '0 4px 16px rgba(251, 146, 60, 0.2)' 
                    : isJoined 
                      ? '0 4px 16px rgba(34, 197, 94, 0.2)'
                      : '0 4px 16px rgba(102, 126, 234, 0.1)',
                  border: highlightEventId === event.id
                    ? '2px solid rgba(79, 70, 229, 0.8)'
                    : isOwner 
                    ? '2px solid rgba(251, 146, 60, 0.3)' 
                    : isJoined 
                      ? '2px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: isOwner 
                      ? '0 12px 32px rgba(251, 146, 60, 0.25)' 
                      : isJoined 
                        ? '0 12px 32px rgba(34, 197, 94, 0.25)'
                        : '0 12px 32px rgba(102, 126, 234, 0.2)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Badge de statut en haut à droite */}
                  {isOwner && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -8, 
                      right: 8, 
                      bgcolor: '#f97316', 
                      color: 'white', 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                      zIndex: 1
                    }}>
                      👑 MES ÉVÉNEMENTS
                    </Box>
                  )}
                  
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700, 
                        flex: 1, 
                        fontSize: '1.1rem',
                        color: isOwner ? '#ea580c' : isJoined ? '#059669' : '#1e293b'
                      }}>
                        {isOwner ? '👑' : isJoined ? '✅' : '✨'} {event.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Chip 
                          label={isFull ? "🔴 COMPLET" : "🟢 OUVERT"} 
                          size="small"
                          sx={{ 
                            bgcolor: isFull ? '#fef2f2' : '#f0fff4',
                            color: isFull ? '#dc2626' : '#059669',
                            fontWeight: 600,
                            fontSize: '10px'
                          }}
                        />
                        {distance && (
                          <Chip 
                            label={`📏 ${distance.toFixed(1)} km`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '10px',
                              height: '20px'
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Type et audience avec icônes colorées */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`🎯 ${event.type}`}
                        size="small"
                        sx={{ 
                          bgcolor: '#e0f2fe', 
                          color: '#0277bd',
                          fontWeight: 500,
                          fontSize: '11px'
                        }}
                      />
                      <Chip 
                        label={`🎭 ${event.audience}`}
                        size="small"
                        sx={{ 
                          bgcolor: '#f3e8ff', 
                          color: '#7c3aed',
                          fontWeight: 500,
                          fontSize: '11px'
                        }}
                      />
                    </Box>

                    {/* Date et heure avec style amélioré */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1.5,
                      p: 1,
                      bgcolor: 'rgba(79, 70, 229, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(79, 70, 229, 0.2)'
                    }}>
                      <ScheduleIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4f46e5' }}>
                        {formatEventDate(event.datetime)}
                      </Typography>
                    </Box>

                    {/* Lieu avec style amélioré */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1.5,
                      p: 1,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <LocationIcon sx={{ fontSize: 18, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#065f46' }}>
                        {event.placeName}
                      </Typography>
                    </Box>

                    {/* Description avec style amélioré */}
                    {event.description && (
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: 'rgba(0, 0, 0, 0.02)', 
                        borderRadius: '8px',
                        mb: 1.5,
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: '#374151', 
                          lineHeight: 1.5,
                          fontStyle: 'italic'
                        }}>
                          📝 {event.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Participants avec barre de progression */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <GroupIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                            Participants
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          color: isFull ? '#dc2626' : '#059669' 
                        }}>
                          {attendeeCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
                        </Typography>
                      </Box>
                      {event.maxAttendees && (
                        <Box sx={{ 
                          bgcolor: '#e5e7eb', 
                          borderRadius: '4px', 
                          height: '6px',
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            bgcolor: isFull ? '#dc2626' : '#10b981',
                            height: '100%',
                            width: `${Math.min((attendeeCount / event.maxAttendees) * 100, 100)}%`,
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {isOwner ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            onClick={() => onManageEvent?.(event.id)}
                            sx={{
                              background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                              fontWeight: 600
                            }}
                          >
                            ⚙️ Gérer
                          </Button>
                          {/* Le créateur ne peut pas quitter son propre événement */}
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant={isJoined ? "outlined" : "contained"}
                          color={isJoined ? "error" : "primary"}
                          onClick={() => isJoined ? onLeaveEvent(event.id) : onJoinEvent(event.id)}
                          disabled={!isJoined && isFull}
                          sx={{
                            background: !isJoined ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                            fontWeight: 600,
                            fontSize: '1.02rem'
                          }}
                        >
                          {isJoined ? '❌ Quitter' : '✅ Rejoindre'}
                        </Button>
                      )}
                      
                      <IconButton
                        size="large"
                        onClick={() => onZoomToEvent(event)}
                        sx={{ 
                          bgcolor: 'primary.light', 
                          color: 'white',
                          borderRadius: 100,
                          '&:hover': { bgcolor: 'primary.main' }
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 24 }} />
                      </IconButton>

                      {event.contactLink && (
                        <Button
                          size="small"
                          href={event.contactLink}
                          target="_blank"
                          sx={{
                            background: 'linear-gradient(135deg, #48bb78, #38a169)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          💬 Contact
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Fab déplacé dans App.tsx */}
    </Box>
  );
};

export default SidebarComponent;