import { useCallback, useMemo, useState } from 'react';
import { Alert, Snackbar, Stack } from '@mui/material';
import { ToastContext } from './toastContext';

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, severity = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, severity }]);
  }, []);

  const handleClose = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Stack spacing={1} sx={{ position: 'fixed', top: 24, right: 24, zIndex: 1400 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={4000}
            onClose={() => handleClose(toast.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              severity={toast.severity}
              onClose={() => handleClose(toast.id)}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
};

export default ToastProvider;