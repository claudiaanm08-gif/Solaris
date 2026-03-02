import { Box, CircularProgress, Skeleton } from '@mui/material';

const LoadingState = ({ variant = 'spinner', rows = 4 }) => {
  if (variant === 'skeleton') {
    return (
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={24} />
        ))}
      </Box>
    );
  }

  if (variant === 'kpi-cards') {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.2,
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
          }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`summary-${index}`} variant="rounded" height={58} />
          ))}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`card-${index}`} variant="rounded" height={160} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <CircularProgress size={24} />
      <span>Cargando...</span>
    </Box>
  );
};

export default LoadingState;
