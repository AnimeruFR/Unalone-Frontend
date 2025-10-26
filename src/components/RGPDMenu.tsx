import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Cookie as CookieIcon,
  PrivacyTip as PrivacyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { rgpdApi, apiUtils } from '../services/api';

interface RGPDMenuProps {
  onOpenCookieSettings: () => void;
  onAccountDeleted?: () => void;
}

const RGPDMenu: React.FC<RGPDMenuProps> = ({ onOpenCookieSettings, onAccountDeleted }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenPrivacyPolicy = () => {
    setShowPrivacyModal(true);
    handleClose();
  };

  const handleCookieSettings = () => {
    onOpenCookieSettings();
    handleClose();
  };

  const handleDownloadData = () => {
    // TODO: Implémenter l'export des données utilisateur
    console.log('Télécharger mes données');
    handleClose();
  };

  const handleDeleteData = () => {
    // TODO: Implémenter la suppression du compte
    console.log('Supprimer mon compte');
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        title="Paramètres RGPD"
      >
        <PrivacyIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: 250,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Mes données & vie privée
          </Typography>
        </Box>
        
        <Divider />

        <MenuItem onClick={handleOpenPrivacyPolicy}>
          <ListItemIcon>
            <PrivacyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Politique de confidentialité"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>

        <MenuItem onClick={handleCookieSettings}>
          <ListItemIcon>
            <CookieIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Gérer les cookies"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleDownloadData}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Télécharger mes données"
            secondary="Droit d'accès RGPD"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>

        <MenuItem onClick={handleDeleteData} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Supprimer mon compte"
            secondary="Droit à l'effacement"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
      </Menu>

      <PrivacyPolicyModal 
        open={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
    </>
  );
};

export default RGPDMenu;
