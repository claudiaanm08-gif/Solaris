import { Alert } from '@mui/material';

const AlertBanner = ({ severity = 'info', children }) => {
  if (!children) return null;
  return (
    <Alert severity={severity} sx={{ mt: 1, mb: 1 }}>
      {children}
    </Alert>
  );
};

export default AlertBanner;
