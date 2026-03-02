import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const ConfirmDialog = ({
  open,
  title = 'Confirmar acción',
  description = '¿Deseas continuar?',
  onCancel,
  onConfirm,
  loading = false
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{description}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} variant="outlined" disabled={loading}>
        Cancelar
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
        {loading && <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />}
        {loading ? 'Eliminando...' : 'Confirmar'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
