import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Group as GroupIcon, 
  LocationOn as LocationIcon, 
  Schedule as ScheduleIcon, 
  Share as ShareIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Event } from '../services/api';

interface EventDetailsModalProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  currentUserId?: string | null;
  onManageEvent?: (eventId: string) => void;
  onOpenChat?: (eventId: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  open, 
  event, 
  onClose, 
  onJoin, 
  onLeave, 
  currentUserId, 
  onManageEvent,
  onOpenChat 
}) => {
  if (!event) return null;

  const attendeeCount = event.attendees?.length || 0;
  const isFull = !!(event.maxAttendees && attendeeCount >= event.maxAttendees);
  // Vérifier si l'utilisateur participe déjà (comparer avec tous les IDs possibles)
  const isJoined = !!event.attendees?.some(a => 
    a.id === currentUserId || 
    (a as any)._id === currentUserId ||
    a.id === (currentUserId as any)?._id
  );
  const isOwner = event.createdBy === currentUserId || event.createdBy === (currentUserId as any)?._id;

  const formatDate = (datetime: string) => {
    const d = new Date(datetime);
    return d.toLocaleString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ fontWeight: 700, fontSize: '1.25rem' }}>✨ {event.title}</Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`🎯 ${event.type}`} size="small" color="primary" variant="outlined" />
          <Chip label={`🎭 ${event.audience}`} size="small" color="secondary" variant="outlined" />
          {event.maxAttendees && (
            <Chip label={`👥 ${attendeeCount}/${event.maxAttendees}`} size="small" variant="outlined" />
          )}
        </Box>

        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatDate(event.datetime)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon fontSize="small" />
            <Typography variant="body1">{event.placeName}</Typography>
          </Box>

          {event.description && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{event.description}</Typography>
            </Box>
          )}

          {event.attendees?.length ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GroupIcon fontSize="small" /> Participants ({attendeeCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''})
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {event.attendees.slice(0, 12).map((a, i) => (
                  <Chip key={a.id || i} label={a.name || 'Utilisateur'} size="small" />
                ))}
                {event.attendees.length > 12 && (
                  <Chip label={`+${event.attendees.length - 12}`} size="small" />
                )}
              </Box>
            </Box>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box>
          {event.contactLink && (
            <Button
              startIcon={<ShareIcon />}
              href={event.contactLink}
              target="_blank"
              rel="noreferrer"
            >
              Lien de contact
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isJoined && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<ChatIcon />}
              onClick={() => {
                onOpenChat?.(event.id);
                onClose();
              }}
            >
              Ouvrir le chat
            </Button>
          )}
          {isOwner ? (
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<SettingsIcon />}
              onClick={() => onManageEvent?.(event.id)}
            >
              Gérer l'événement
            </Button>
          ) : isJoined ? (
            <Button variant="outlined" color="error" onClick={() => onLeave(event.id)}>
              Quitter
            </Button>
          ) : (
            <Button variant="contained" onClick={() => onJoin(event.id)} disabled={isFull}>
              Rejoindre
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsModal;
