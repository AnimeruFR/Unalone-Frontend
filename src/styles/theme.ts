import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    unalone: {
      gradients: {
        primary: string;
        secondary: string;
        background: string;
      };
      shadows: {
        card: string;
        hover: string;
        fab: string;
      };
    };
  }

  interface ThemeOptions {
    unalone?: {
      gradients?: {
        primary?: string;
        secondary?: string;
        background?: string;
      };
      shadows?: {
        card?: string;
        hover?: string;
        fab?: string;
      };
    };
  }
}

export const unaloneTheme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa5f3',
      dark: '#4f5ba9',
    },
    secondary: {
      main: '#764ba2',
      light: '#9d7bc8',
      dark: '#553d75',
    },
    background: {
      default: '#f8f9ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
    },
  },
  unalone: {
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    shadows: {
      card: '0 8px 32px rgba(102, 126, 234, 0.1)',
      hover: '0 12px 40px rgba(102, 126, 234, 0.15)',
      fab: '0 8px 25px rgba(102, 126, 234, 0.4)',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 800,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 20px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a72e7 0%, #6d4296 100%)',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#667eea',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#667eea',
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a72e7 0%, #6d4296 100%)',
            boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&:before': {
            display: 'none',
          },
        },
      },
    },
  },
});

// Styles CSS personnalisés pour Leaflet et autres éléments non-MUI
export const customStyles = `
  /* Styles pour les marqueurs Leaflet personnalisés */
  .custom-marker {
    background: transparent !important;
    border: none !important;
  }

  /* Animation de fondu pour l'application */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation: fadeIn 0.8s ease-out;
  }

  /* Styles pour les popups Leaflet */
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2) !important;
  }

  .leaflet-popup-tip {
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1) !important;
  }

  /* Scrollbar personnalisée */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #5a72e7 0%, #6d4296 100%);
  }

  /* Styles pour les liens */
  a {
    color: #667eea;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: #764ba2;
    text-decoration: underline;
  }

  /* Style pour les boutons dans les popups */
  .leaflet-popup button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .leaflet-popup button:hover {
    background: linear-gradient(135deg, #5a72e7 0%, #6d4296 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  /* Media queries pour responsive - la carte reste plein écran sur mobile */
  @media (max-width: 768px) {
    .sidebar {
      width: 100% !important;
    }
    .map-container {
      height: 100% !important;
      width: 100% !important;
    }
  }

  /* Safe-area for iOS notches */
  html, body, #root {
    padding-top: env(safe-area-inset-top);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    background-color: #f8f9ff;
  }

  .floating-fab {
    position: absolute;
    bottom: calc(16px + env(safe-area-inset-bottom));
    right: calc(16px + env(safe-area-inset-right));
    z-index: 1100;
  }

  .appbar-safe {
    padding-top: env(safe-area-inset-top);
  }

  .drawer-paper-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
`;