import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { authApi } from '../services/api';
import { apiUtils } from '../services/api';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setError(''); // Réinitialiser l'erreur lors du changement d'onglet
  };

  const reset = () => {
    setIdentifier('');
    setPassword('');
    setUsername('');
    setEmail('');
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  const handleLogin = async () => {
    setError('');
    
    // Validation côté client
    if (!identifier) {
      setError('Veuillez renseigner votre email ou nom d\'utilisateur');
      return;
    }
    if (!password) {
      setError('Veuillez renseigner votre mot de passe');
      return;
    }
    
    try {
      setLoading(true);
      const res = await authApi.login(identifier, password);
      const token = res.token;
      if (token) apiUtils.saveAuthToken(token);
      onAuthenticated?.(res.user);
      handleClose();
    } catch (e: any) {
      console.error('Erreur de connexion:', e);
      const response = e?.response?.data;
      
      // Gérer les différents types d'erreurs
      if (response?.errors && Array.isArray(response.errors)) {
        // Erreurs de validation détaillées
        const errorMessages = response.errors.map((err: any) => err.msg || err.message).join('. ');
        setError(errorMessages);
      } else if (response?.message) {
        // Message d'erreur du serveur
        setError(response.message);
      } else if (e?.response?.status === 401) {
        // Erreur d'authentification (401)
        setError('Email/nom d\'utilisateur ou mot de passe incorrect');
      } else if (e?.response?.status === 403) {
        // Compte banni (403)
        setError('Votre compte a été banni. Contactez le support.');
      } else if (e?.response?.status >= 500) {
        // Erreur serveur
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (e?.code === 'ERR_NETWORK') {
        // Erreur réseau
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        setError('Échec de la connexion. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!username || !email || !password) {
      setError('Veuillez renseigner nom d\'utilisateur, email et mot de passe');
      return;
    }
    
    // Validation côté client pour un meilleur retour immédiat
    if (username.length < 3 || username.length > 30) {
      setError('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format d\'email invalide');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');
      return;
    }
    
    try {
      setLoading(true);
      const res = await authApi.register({ username, email, password });
      const token = res.token;
      if (token) apiUtils.saveAuthToken(token);
      onAuthenticated?.(res.user);
      handleClose();
    } catch (e: any) {
      const response = e?.response?.data;
      if (response?.errors && Array.isArray(response.errors)) {
        // Afficher les erreurs de validation détaillées
        const errorMessages = response.errors.map((err: any) => err.msg || err.message).join('. ');
        setError(errorMessages);
      } else if (response?.message) {
        setError(response.message);
      } else {
        setError('Échec de l\'inscription. Vérifiez les informations saisies.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>Bienvenue sur UnAlone</DialogTitle>
      <DialogContent>
        <Tabs 
          value={tab} 
          onChange={(_, v) => handleTabChange(v)} 
          centered
          sx={{ mb: 2 }}
        >
          <Tab value="login" label="Se connecter" />
          <Tab value="register" label="Créer un compte" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {tab === 'login' ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email ou nom d'utilisateur"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoFocus
            />
            <TextField
              type="password"
              label="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Nom d'utilisateur"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              type="password"
              label="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              helperText="Au moins 6 caractères, avec majuscules/minuscules et un chiffre"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Annuler</Button>
        {tab === 'login' ? (
          <Button onClick={handleLogin} variant="contained" disabled={loading}>Se connecter</Button>
        ) : (
          <Button onClick={handleRegister} variant="contained" disabled={loading}>Créer le compte</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AuthModal;
