import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ToastProvider'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1E4D3A', contrastText: '#FFFFFF' },
    secondary: { main: '#7FA742' },
    success: { main: '#7FA742' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: { default: '#F4F6F3', paper: '#FFFFFF' },
    text: { primary: '#1B1F1D', secondary: '#5F6B63' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h1: { fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontSize: '2.2rem', fontWeight: 750, letterSpacing: '-0.02em' },
    h3: { fontWeight: 650, letterSpacing: '-0.02em' },
    body1: { fontSize: '0.98rem', lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 8px 18px -12px rgba(30, 77, 58, 0.3)',
          transition: 'all 200ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 22px -12px rgba(30, 77, 58, 0.35)'
          },
          '&:active': { transform: 'scale(0.98)' }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          transition: 'all 200ms ease',
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            '&:hover fieldset': { borderColor: '#1E4D3A' },
            '&.Mui-focused fieldset': {
              borderColor: '#1E4D3A',
              boxShadow: '0 0 0 3px rgba(30, 77, 58, 0.16)'
            }
          }
        }
      }
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
