import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  Link
} from '@mui/material';
import { Cookie as CookieIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { rgpdApi } from '../services/api';

interface CookieConsentProps {
  onAccept?: () => void;
}

interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Toujours activé
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Attendre 1 seconde avant d'afficher le bandeau pour ne pas être trop intrusif
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Charger les préférences sauvegardées
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch (e) {
        console.error('Erreur lecture préférences cookies:', e);
      }
    }
  }, []);

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    // Essayer d'enregistrer côté backend (si connecté)
    rgpdApi.saveConsent(prefs).catch(() => {/* optionnel: ignorer les erreurs si non connecté */});
    setShowBanner(false);
    setShowSettings(false);
    onAccept?.();
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: ConsentPreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setPreferences(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handlePreferenceChange = (key: keyof ConsentPreferences) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (key === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés
    setPreferences(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Bandeau de consentement */}
      {showBanner && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            p: { xs: 2, md: 3 },
            zIndex: 9999,
            borderTop: '3px solid',
            borderColor: 'primary.main'
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <CookieIcon sx={{ fontSize: 40, color: 'primary.main', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  🍪 Respect de votre vie privée
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  Certains cookies sont nécessaires au bon fonctionnement du site, d'autres nécessitent votre consentement.
                </Typography>
                <Link
                  href="/privacy"
                  sx={{ fontSize: '0.875rem', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Vous pouvez implémenter une navigation vers une page de politique de confidentialité
                    console.log('Ouvrir politique de confidentialité');
                  }}
                >
                  Consulter notre politique de confidentialité
                </Link>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setShowBanner(false);
                  setShowSettings(true);
                }}
                startIcon={<SettingsIcon />}
              >
                Personnaliser
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleAcceptNecessary}
              >
                Nécessaires uniquement
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleAcceptAll}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 600
                }}
              >
                Tout accepter
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Modal de paramètres détaillés */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          Paramètres des cookies
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gérez vos préférences de cookies. Les cookies nécessaires sont toujours actifs car ils sont essentiels 
            au bon fonctionnement du site.
          </Typography>

          {/* Cookies nécessaires */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.necessary}
                  disabled
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Cookies nécessaires (obligatoires)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Ces cookies sont essentiels au fonctionnement du site. Ils permettent l'authentification, 
                    la sécurité et les fonctionnalités de base.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Cookies fonctionnels */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.functional}
                  onChange={handlePreferenceChange('functional')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Cookies fonctionnels
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Permettent de mémoriser vos préférences (langue, thème, etc.) et d'améliorer votre expérience.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Cookies analytiques */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.analytics}
                  onChange={handlePreferenceChange('analytics')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Cookies analytiques
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Nous aident à comprendre comment vous utilisez le site pour l'améliorer. 
                    Données anonymisées.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Cookies marketing */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.marketing}
                  onChange={handlePreferenceChange('marketing')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Cookies marketing
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Utilisés pour afficher des publicités pertinentes et mesurer l'efficacité des campagnes.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowSettings(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePreferences}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600
            }}
          >
            Enregistrer mes préférences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CookieConsent;
