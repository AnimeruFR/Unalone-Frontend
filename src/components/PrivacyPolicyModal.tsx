import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { PrivacyTip as PrivacyIcon } from '@mui/icons-material';

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <PrivacyIcon />
        Politique de Confidentialité & RGPD
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </Typography>

        {/* Introduction */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            1. Introduction
          </Typography>
          <Typography variant="body2" paragraph>
            Bienvenue sur <strong>Unalone</strong>. Nous nous engageons à protéger votre vie privée et vos données personnelles 
            conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables.
          </Typography>
          <Typography variant="body2" paragraph>
            Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Responsable du traitement */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            2. Responsable du traitement des données
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Nom de l'organisation :</strong> Unalone<br />
            <strong>Email de contact :</strong> privacy@unalone.app<br />
            <strong>Adresse :</strong> [À compléter]
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Données collectées */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            3. Données personnelles collectées
          </Typography>
          <Typography variant="body2" paragraph>
            Nous collectons les données suivantes :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Données d'identification"
                secondary="Nom d'utilisateur, adresse email, mot de passe (crypté)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Données de localisation"
                secondary="Position géographique (avec votre consentement explicite) pour afficher les événements à proximité"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Données d'utilisation"
                secondary="Événements créés, participations, messages de chat, interactions sur la plateforme"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Données techniques"
                secondary="Adresse IP, type de navigateur, système d'exploitation, cookies"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Finalités */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            4. Finalités du traitement
          </Typography>
          <Typography variant="body2" paragraph>
            Vos données sont utilisées pour :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Créer et gérer votre compte utilisateur" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Permettre la création et la participation aux événements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Afficher les événements à proximité de votre localisation" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Assurer la sécurité et la modération de la plateforme" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Améliorer nos services et l'expérience utilisateur" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Envoyer des notifications liées aux événements (avec votre consentement)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Respecter nos obligations légales" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Base légale */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            5. Base légale du traitement
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Consentement"
                secondary="Localisation géographique, cookies non nécessaires, notifications"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Exécution d'un contrat"
                secondary="Fourniture des services de la plateforme"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Intérêt légitime"
                secondary="Sécurité, prévention de la fraude, amélioration des services"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Obligation légale"
                secondary="Conservation de certaines données pour raisons légales"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Partage des données */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            6. Partage et transfert des données
          </Typography>
          <Typography variant="body2" paragraph>
            Nous ne vendons jamais vos données personnelles. Vos données peuvent être partagées uniquement dans les cas suivants :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Avec votre consentement explicite" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Avec les autres utilisateurs (nom d'utilisateur, événements publics)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Avec nos prestataires de services (hébergement, analyse)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Si requis par la loi ou une autorité compétente" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Durée de conservation */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            7. Durée de conservation
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Compte actif"
                secondary="Données conservées tant que votre compte est actif"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Compte supprimé"
                secondary="Données supprimées dans un délai de 30 jours (sauf obligations légales)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Cookies"
                secondary="Durée maximale de 13 mois"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Logs de sécurité"
                secondary="Conservés pendant 12 mois maximum"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Droits des utilisateurs */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            8. Vos droits (RGPD)
          </Typography>
          <Typography variant="body2" paragraph>
            Conformément au RGPD, vous disposez des droits suivants :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Droit d'accès"
                secondary="Obtenir une copie de vos données personnelles"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit de rectification"
                secondary="Corriger vos données inexactes ou incomplètes"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit à l'effacement"
                secondary="Supprimer vos données dans certaines conditions"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit à la limitation"
                secondary="Limiter le traitement de vos données"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit à la portabilité"
                secondary="Recevoir vos données dans un format structuré"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit d'opposition"
                secondary="S'opposer au traitement de vos données"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit de retirer le consentement"
                secondary="Retirer votre consentement à tout moment"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Droit de réclamation"
                secondary="Déposer une plainte auprès de la CNIL"
              />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
            Pour exercer vos droits, contactez-nous à : <strong>privacy@unalone.app</strong>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Sécurité */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            9. Sécurité des données
          </Typography>
          <Typography variant="body2" paragraph>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Cryptage des mots de passe (bcrypt)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Connexions HTTPS sécurisées" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Authentification JWT avec expiration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Surveillance et logs de sécurité" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Accès restreint aux données" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Sauvegardes régulières" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Cookies */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            10. Gestion des cookies
          </Typography>
          <Typography variant="body2" paragraph>
            Notre site utilise différents types de cookies. Vous pouvez gérer vos préférences via le bandeau de cookies 
            ou dans les paramètres de votre navigateur.
          </Typography>
          <Typography variant="body2" paragraph>
            Pour plus d'informations, consultez notre politique de cookies en cliquant sur "Personnaliser" dans le bandeau.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Mineurs */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            11. Protection des mineurs
          </Typography>
          <Typography variant="body2" paragraph>
            Notre service est réservé aux personnes âgées de 13 ans et plus. Si vous avez moins de 18 ans, 
            l'accord d'un parent ou tuteur légal peut être requis.
          </Typography>
          <Typography variant="body2" paragraph>
            Si nous découvrons qu'un enfant de moins de 13 ans nous a fourni des données personnelles, 
            nous les supprimerons immédiatement.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Modifications */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            12. Modifications de la politique
          </Typography>
          <Typography variant="body2" paragraph>
            Nous nous réservons le droit de modifier cette politique à tout moment. Les modifications importantes 
            vous seront notifiées par email ou via une notification sur la plateforme.
          </Typography>
          <Typography variant="body2" paragraph>
            La date de dernière mise à jour est indiquée en haut de ce document.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Contact */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            13. Contact
          </Typography>
          <Typography variant="body2" paragraph>
            Pour toute question concernant cette politique ou vos données personnelles :
          </Typography>
          <Typography variant="body2">
            📧 Email : <strong>privacy@unalone.app</strong><br />
            🏛️ CNIL : <strong>www.cnil.fr</strong> (pour réclamation)
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600
          }}
        >
          J'ai compris
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
