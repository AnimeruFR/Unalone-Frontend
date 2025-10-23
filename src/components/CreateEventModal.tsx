import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Autocomplete,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
// Using Box with CSS grid to avoid Grid v2 compatibility issues
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Description as DescriptionIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { locationApi, CreateEventData } from '../services/api';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventData) => void;
  userPosition: [number, number] | null;
}

interface PlaceOption {
  label: string;
  lat: number;
  lng: number;
  place_id: string;
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

const audienceOptions = [
  { value: "inconnues", label: "Ouvert aux inconnus" },
  { value: "club", label: "Membres du club" },
  { value: "meme-age", label: "Même tranche d'âge" },
  { value: "potes", label: "Entre amis" },
  { value: "mixte", label: "Mixte" }
];

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onClose,
  onCreateEvent,
  userPosition
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    type: '',
    audience: '',
    datetime: '',
    description: '',
    placeName: '',
    lat: 0,
    lng: 0,
    maxAttendees: undefined,
    contactLink: ''
  });

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [error, setError] = useState('');

  // Recherche de lieux avec debounce
  useEffect(() => {
    if (placeSearch.length < 3) {
      setPlaceOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const results = await locationApi.searchPlaces(placeSearch);
        const options: PlaceOption[] = results.map(place => ({
          label: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          place_id: place.place_id
        }));
        setPlaceOptions(options);
      } catch (error) {
        console.error('Erreur lors de la recherche de lieux:', error);
        setPlaceOptions([]);
      }
      setIsSearchingPlaces(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [placeSearch]);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        type: '',
        audience: '',
        datetime: '',
        description: '',
        placeName: '',
        lat: 0,
        lng: 0,
        maxAttendees: undefined,
        contactLink: ''
      });
      setPlaceSearch('');
      setSelectedPlace(null);
      setError('');
    }
  }, [open]);

  const handleInputChange = (field: keyof CreateEventData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlaceSelect = (place: PlaceOption | null) => {
    setSelectedPlace(place);
    if (place) {
      setFormData(prev => ({
        ...prev,
        placeName: place.label,
        lat: place.lat,
        lng: place.lng
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description est obligatoire');
      return false;
    }
    if (!formData.type) {
      setError('Le type d\'événement est obligatoire');
      return false;
    }
    if (!formData.audience) {
      setError('L\'audience est obligatoire');
      return false;
    }
    if (!formData.datetime) {
      setError('La date et l\'heure sont obligatoires');
      return false;
    }
    if (!selectedPlace) {
      setError('Veuillez sélectionner un lieu');
      return false;
    }
    if (formData.maxAttendees && formData.maxAttendees < 1) {
      setError('Le nombre maximum de participants doit être supérieur à 0');
      return false;
    }
    
    // Vérifier que la date est dans le futur
    const eventDate = new Date(formData.datetime);
    if (eventDate <= new Date()) {
      setError('La date de l\'événement doit être dans le futur');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    onCreateEvent(formData);
    onClose();
  };

  // Obtenir la date/heure minimale (maintenant + 1 heure)
  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Convertir une date ISO en format datetime-local pour l'affichage
  const isoToDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Ajuster pour le timezone local
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 24px 48px rgba(102, 126, 234, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon />
          <Typography variant="h6" component="span">
            ➕ Créer un événement
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

  <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3,
            marginTop: 2
          }}
        >
          {/* Titre */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              label="📝 Titre de l'événement"
              placeholder="Ex: Apéro jeux de société"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </Box>

          {/* Type et Audience */}
          <Box>
            <FormControl fullWidth required>
              <InputLabel>🎯 Type d'événement</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="🎯 Type d'événement"
              >
                {eventTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <FormControl fullWidth required>
              <InputLabel>🎭 Audience</InputLabel>
              <Select
                value={formData.audience}
                onChange={(e) => handleInputChange('audience', e.target.value)}
                label="🎭 Audience"
              >
                {audienceOptions.map(audience => (
                  <MenuItem key={audience.value} value={audience.value}>{audience.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Date et heure */}
          <Box>
            <TextField
              fullWidth
              type="datetime-local"
              label="📅 Date et heure"
              value={isoToDatetimeLocal(formData.datetime)}
              onChange={(e) => {
                // Convertir la valeur datetime-local en ISO string
                const dateValue = e.target.value;
                if (dateValue) {
                  // datetime-local donne un format comme "2025-10-09T15:30"
                  // On le convertit en ISO string complet
                  const isoString = new Date(dateValue).toISOString();
                  handleInputChange('datetime', isoString);
                } else {
                  handleInputChange('datetime', '');
                }
              }}
              required
              inputProps={{
                min: getMinDateTime()
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

          {/* Nombre maximum de participants */}
          <Box>
            <TextField
              fullWidth
              type="number"
              label="👥 Nombre max de participants"
              placeholder="Laissez vide pour illimité"
              value={formData.maxAttendees || ''}
              onChange={(e) => handleInputChange('maxAttendees', e.target.value ? parseInt(e.target.value) : undefined)}
              inputProps={{ min: 1 }}
            />
          </Box>

          {/* Recherche de lieu */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Autocomplete
              options={placeOptions}
              value={selectedPlace}
              onChange={(_, newValue) => handlePlaceSelect(newValue)}
              inputValue={placeSearch}
              onInputChange={(_, newInputValue) => setPlaceSearch(newInputValue)}
              loading={isSearchingPlaces}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="📍 Rechercher un lieu"
                  placeholder="Ex: Bar Hemingway Paris"
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {isSearchingPlaces ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{option.label}</Typography>
                  </Box>
                </li>
              )}
            />
          </Box>

          {/* Description */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="📝 Description"
              placeholder="Décrivez votre événement, ce qui sera fait, ce qu'il faut apporter..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </Box>

          {/* Lien de contact */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              type="url"
              label="💬 Lien de contact (optionnel)"
              placeholder="https://t.me/votregroupe ou WhatsApp, Discord..."
              value={formData.contactLink}
              onChange={(e) => handleInputChange('contactLink', e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            px: 3
          }}
        >
          ✨ Créer l'événement
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventModal;