import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import axios from 'axios';
import { socketService } from '../services/socket';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://unalone-backend-05eo.onrender.com:5000/api';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    username: string;
    profile?: {
      avatar?: string;
      firstName?: string;
      lastName?: string;
    };
    avatar?: string;
  };
  createdAt: string;
}

interface ChatPanelProps {
  eventId: string;
  eventTitle: string;
  currentUserId: string;
  onClose: () => void;
  isEventCreator?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ eventId, eventTitle, currentUserId, onClose, isEventCreator = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();

    // Rejoindre la room Socket.IO pour cet événement
    socketService.emit('join_event', { eventId });

    // Écouter les nouveaux messages via Socket.IO
    const handleNewMessage = (data: { eventId: string; message: Message }) => {
      console.log('📨 Nouveau message reçu via Socket.IO:', data);
      if (data.eventId === eventId) {
        // Éviter les doublons en vérifiant si le message existe déjà
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === data.message._id);
          if (exists) {
            console.log('⚠️ Message déjà présent (Socket.IO), ignoré:', data.message._id);
            return prev;
          }
          console.log('✅ Message ajouté via Socket.IO:', data.message._id);
          return [...prev, data.message];
        });
      }
    };

    // Écouter les suppressions de messages
    const handleMessageDeleted = (data: { eventId: string; messageId: string }) => {
      if (data.eventId === eventId) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    socketService.on('chat:message', handleNewMessage);
    socketService.on('chat:messageDeleted', handleMessageDeleted);

    return () => {
      socketService.off('chat:message', handleNewMessage);
      socketService.off('chat:messageDeleted', handleMessageDeleted);
      // Quitter la room Socket.IO
      socketService.emit('leave_event', { eventId });
    };
  }, [eventId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      console.log('Chargement des messages pour l\'événement:', eventId);
      
      const response = await axios.get(`${API_BASE_URL}/chat/events/${eventId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Messages chargés:', response.data);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      if (axios.isAxiosError(error)) {
        console.error('Détails erreur:', error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const token = localStorage.getItem('authToken');
      console.log('Envoi du message:', { text: newMessage.trim(), eventId, token: !!token });
      
      const response = await axios.post(
        `${API_BASE_URL}/chat/events/${eventId}/messages`,
        { text: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Message envoyé avec succès:', response.data);
      
      // Ajouter le message localement immédiatement (optimistic update)
      if (response.data) {
        setMessages(prev => {
          // Vérifier si le message existe déjà
          const exists = prev.some(msg => msg._id === response.data._id);
          if (exists) {
            console.log('Message déjà présent, ignoré');
            return prev;
          }
          return [...prev, response.data];
        });
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      if (axios.isAxiosError(error)) {
        console.error('Détails erreur:', error.response?.data);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `${API_BASE_URL}/chat/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Le message sera supprimé via l'événement Socket.IO
    } catch (error) {
      console.error('Erreur suppression message:', error);
      if (axios.isAxiosError(error)) {
        console.error('Détails erreur:', error.response?.data);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: 350,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Chat de groupe
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {eventTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucun message pour le moment. Lancez la conversation !
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender._id === currentUserId;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              
              // Vérifier si c'est le même utilisateur que le message précédent
              const isSameSenderAsPrev = prevMsg && prevMsg.sender._id === msg.sender._id;
              // Vérifier si c'est le même utilisateur que le message suivant
              const isSameSenderAsNext = nextMsg && nextMsg.sender._id === msg.sender._id;
              
              // Afficher l'avatar et le nom uniquement pour le premier message d'un groupe
              const showHeader = !isSameSenderAsPrev;
              // Afficher le divider uniquement si le prochain message est d'un autre utilisateur
              const showDivider = !isSameSenderAsNext && index < messages.length - 1;

              return (
                <React.Fragment key={msg._id}>
                  <ListItem
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                      px: 0,
                      py: showHeader ? 0.75 : 0.30,
                      mb: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 0.75,
                        width: '100%',
                        maxWidth: '90%',
                        ml: isOwnMessage ? 'auto' : 0,
                        mr: isOwnMessage ? 0 : 'auto',
                      }}
                    >
                      {/* Avatar - visible uniquement pour le premier message du groupe */}
                      {showHeader ? (
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: isOwnMessage ? '#667eea' : '#764ba2',
                            fontSize: '0.875rem',
                          }}
                        >
                          {msg.sender.username.charAt(0).toUpperCase()}
                        </Avatar>
                      ) : (
                        <Box sx={{ width: 28, minWidth: 28 }} /> // Espace pour l'alignement
                      )}
                      
                      <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                        {/* En-tête avec nom et heure - visible uniquement pour le premier message du groupe */}
                        {showHeader && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                              alignItems: 'center',
                              gap: 0.75,
                              mb: 0.3,
                              px: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ 
                                fontWeight: 600, 
                                color: isOwnMessage ? '#667eea' : '#764ba2',
                                fontSize: '0.75rem',
                              }}
                            >
                              {isOwnMessage ? 'Vous' : msg.sender.username}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {formatTime(msg.createdAt)}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Contenu du message */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Paper
                            elevation={isOwnMessage ? 3 : 1}
                            sx={{
                              p: 1.25,
                              py: 1,
                              backgroundColor: isOwnMessage 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : 'white',
                              background: isOwnMessage 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : 'white',
                              color: isOwnMessage ? 'white' : 'text.primary',
                              borderRadius: isOwnMessage 
                                ? '18px 18px 4px 18px'
                                : '18px 18px 18px 4px',
                              maxWidth: '100%',
                              wordWrap: 'break-word',
                              border: isOwnMessage ? 'none' : '1px solid #e0e0e0',
                              boxShadow: isOwnMessage 
                                ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                                : '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Typography 
                              variant="body2"
                              sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                              }}
                            >
                              {msg.text}
                            </Typography>
                          </Paper>
                          
                          {/* Bouton de suppression */}
                          {(isOwnMessage || isEventCreator) && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMessage(msg._id)}
                              sx={{
                                width: 24,
                                height: 24,
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'text.secondary',
                                '&:hover': { 
                                  opacity: 1,
                                  bgcolor: 'rgba(244, 67, 54, 0.1)', 
                                  color: 'error.main',
                                },
                                '.MuiListItem-root:hover &': {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          )}
                        </Box>
                        
                        {/* Heure pour les messages groupés supprimée pour éviter tout espacement supplémentaire */}
                      </Box>
                    </Box>
                  </ListItem>
                    {showDivider && <Divider sx={{ my: 0.3, opacity: 0.3 }} />}
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Écrivez un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
