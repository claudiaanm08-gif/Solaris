import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ToastProvider'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#064E3B', contrastText: '#FFFFFF' },
    secondary: { main: '#065F46' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' }
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 10px 25px -12px rgba(6,78,59,0.35)',
          transition: 'all 200ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 14px 30px -12px rgba(6,78,59,0.45)'
          },
          '&:active': { transform: 'scale(0.98)' }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          transition: 'all 200ms ease',
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            '&:hover fieldset': { borderColor: '#064E3B' },
            '&.Mui-focused fieldset': {
              borderColor: '#064E3B',
              boxShadow: '0 0 0 3px rgba(6,78,59,0.12)'
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
