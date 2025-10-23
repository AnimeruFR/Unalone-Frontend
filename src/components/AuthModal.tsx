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
    if (!identifier || !password) {
      setError('Veuillez renseigner vos identifiants et mot de passe');
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
      setError(e?.response?.data?.message || 'Échec de la connexion');
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
    try {
      setLoading(true);
      const res = await authApi.register({ username, email, password });
      const token = res.token;
      if (token) apiUtils.saveAuthToken(token);
      onAuthenticated?.(res.user);
      handleClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Échec de l\'inscription');
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
          onChange={(_, v) => setTab(v)} 
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
