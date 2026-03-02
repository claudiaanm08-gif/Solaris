import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { getClientes, deleteCliente, createCliente } from '../services/clienteService';
import { queryRagSnippets } from '../services/ragService';
import LoadingState from './LoadingState';
import ConfirmDialog from './ConfirmDialog';
import ClienteSelect from './ClienteSelect';
import { useToast } from './toastContext';

const ClientesLista = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    direccion: '',
    email: '',
    telefono: ''
  });
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    rfc: '',
    email: ''
  });
  const [ragClienteId, setRagClienteId] = useState('');
  const [ragContratoId, setRagContratoId] = useState('');
  const [ragClauseType, setRagClauseType] = useState('');
  const [ragQuery, setRagQuery] = useState('');
  const [ragSnippets, setRagSnippets] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState('');
  const [postProcess, setPostProcess] = useState(false);
  const { pushToast } = useToast();

  const loadClientes = useCallback(async () => {
    try {
      const data = await getClientes();
      setClientes(data);
      setError('');
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const emailValue = formData.email;
      const rfcValue = formData.rfc;
      const nombreValue = formData.nombre;
      const emailValid = emailValue === '' || /.+@.+\..+/.test(emailValue);
      const rfcValid = rfcValue === '' || /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfcValue.trim());
      const nombreValid = nombreValue.trim().length >= 3;

      setFormErrors((prev) => ({
        ...prev,
        email: emailValid ? '' : 'Email inválido.',
        rfc: rfcValid ? '' : 'RFC inválido.',
        nombre: nombreValid ? '' : 'Ingresa al menos 3 caracteres.'
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.email, formData.rfc, formData.nombre]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    if (formErrors.nombre || formErrors.rfc || formErrors.email) {
      setError('Revisa los campos marcados antes de guardar.');
      setSaving(false);
      return;
    }
    try {
      await createCliente(formData);
      setFormData({
        nombre: '',
        rfc: '',
        direccion: '',
        email: '',
        telefono: ''
      });
      setFormErrors({ nombre: '', rfc: '', email: '' });
      pushToast('Cliente registrado correctamente.', 'success');
      await loadClientes();
    } catch (submitError) {
      console.error(submitError);
      setError('No se pudo registrar el cliente.');
      pushToast('No se pudo registrar el cliente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteCliente(confirmId);
      pushToast('Cliente eliminado correctamente.', 'success');
      await loadClientes();
    } catch (deleteError) {
      console.error(deleteError);
      setError('No se pudo eliminar el cliente.');
      pushToast('No se pudo eliminar el cliente.', 'error');
    } finally {
      setConfirmId(null);
      setDeleting(false);
    }
  };

  const handleRagSearch = async () => {
    if (!ragQuery.trim()) {
      setRagError('Ingresa una consulta para buscar fragmentos.');
      return;
    }
    setRagLoading(true);
    setRagError('');
    try {
      const data = await queryRagSnippets({
        query: ragQuery,
        clienteId: ragClienteId || undefined,
        contratoId: ragContratoId || undefined,
        clauseType: ragClauseType || undefined,
        limit: 3
      });
      setRagSnippets(data.fragments || []);
      pushToast('Fragmentos cargados.', 'success');
    } catch (ragErr) {
      console.error(ragErr);
      setRagError('No se pudieron obtener fragmentos.');
      pushToast('No se pudieron obtener fragmentos.', 'error');
    } finally {
      setRagLoading(false);
    }
  };

  const filteredClientes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) =>
      [cliente.nombre, cliente.rfc].some((value) => value?.toLowerCase().includes(term))
    );
  }, [clientes, search]);

  const paginatedClientes = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredClientes.slice(start, start + rowsPerPage);
  }, [filteredClientes, page, rowsPerPage]);

  if (loading) return <LoadingState variant="skeleton" rows={6} />;

  return (
    <div className="clientes space-y-8">
  <section className="clientes__form-section space-y-6">
        <Typography variant="h5" component="h2" gutterBottom>
          Registrar cliente
        </Typography>
  <Box component="form" onSubmit={handleSubmit} className="clientes__form space-y-6">
          <div className="clientes__grid gap-6">
            <TextField
              name="nombre"
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              error={Boolean(formErrors.nombre)}
              helperText={formErrors.nombre}
              aria-label="Nombre del cliente"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              name="rfc"
              label="RFC"
              value={formData.rfc}
              onChange={handleChange}
              required
              error={Boolean(formErrors.rfc)}
              helperText={formErrors.rfc}
              aria-label="RFC"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(formErrors.email)}
              helperText={formErrors.email}
              aria-label="Email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              name="telefono"
              label="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
              aria-label="Teléfono"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </div>
          <TextField
            name="direccion"
            label="Dirección"
            value={formData.direccion}
            onChange={handleChange}
            aria-label="Dirección"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HomeOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {saving ? 'Guardando...' : 'Registrar cliente'}
          </Button>
        </Box>
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </section>

      <div className="clientes__header">
        <Typography variant="h5" component="h2">
          Clientes
        </Typography>
        <TextField
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Buscar por nombre o RFC"
          size="small"
          aria-label="Buscar clientes"
        />
      </div>
  <div className="clientes__table-wrapper mt-4">
        <TableContainer>
          <Table stickyHeader className="clientes__table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>RFC</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClientes.map((cliente) => (
                <TableRow key={cliente.id} hover className="transition-all duration-200">
                  <TableCell>{cliente.id}</TableCell>
                  <TableCell>{cliente.nombre}</TableCell>
                  <TableCell>{cliente.rfc}</TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => setConfirmId(cliente.id)}
                      aria-label="Eliminar cliente"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredClientes.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </div>
      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Eliminar cliente"
        description="Esta acción no se puede deshacer. ¿Deseas continuar?"
        onCancel={() => setConfirmId(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <section className="clientes__rag">
        <Typography variant="h5" component="h2">
          Cliente 360° · Fragmentos destacados
        </Typography>
        <div className="rag__filters">
          <label>
            Cliente
            <ClienteSelect
              value={ragClienteId}
              onChange={(event) => setRagClienteId(event.target.value)}
              includeAll
              allLabel="Todos"
            />
          </label>
          <label>
            Contrato (opcional)
            <TextField
              value={ragContratoId}
              onChange={(event) => setRagContratoId(event.target.value)}
              placeholder="Ej. 12"
              aria-label="Contrato"
            />
          </label>
          <label>
            Tipo de cláusula (opcional)
            <TextField
              value={ragClauseType}
              onChange={(event) => setRagClauseType(event.target.value)}
              placeholder="Ej. penalización"
              aria-label="Tipo de cláusula"
            />
          </label>
          <label className="rag__full">
            Consulta
            <TextField
              rows={2}
              multiline
              value={ragQuery}
              onChange={(event) => setRagQuery(event.target.value)}
              placeholder="Ej. vigencia del contrato, monto total, penalización"
              aria-label="Consulta"
            />
          </label>
        </div>
        <div className="rag__actions">
          <Button type="button" variant="contained" onClick={handleRagSearch} disabled={ragLoading}>
            {ragLoading ? 'Buscando...' : 'Buscar fragmentos'}
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={postProcess}
                onChange={(event) => setPostProcess(event.target.checked)}
                color="primary"
              />
            }
            label="Post-procesamiento inteligente (beta)"
          />
        </div>
        {ragError && (
          <Typography variant="caption" color="error">
            {ragError}
          </Typography>
        )}
        {ragSnippets.length > 0 && (
          <div className="rag__snippets">
            <div className="rag__snippet-grid">
              {ragSnippets.map((snippet, index) => (
                <article className="rag__snippet-card" key={`${snippet.document_id || index}`}> 
                  <header>
                    <strong>{snippet.title || 'Documento'}</strong>
                    {snippet.score !== null && snippet.score !== undefined && (
                      <span className="rag__snippet-score">score {snippet.score.toFixed(2)}</span>
                    )}
                  </header>
                  <p>{snippet.text}</p>
                  <div className="rag__snippet-meta">
                    {snippet.montos?.length > 0 && (
                      <div>
                        <span>Montos</span>
                        <div className="rag__chips">
                          {snippet.montos.map((monto) => (
                            <span key={monto} className="rag__chip">{monto}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {snippet.fechas?.length > 0 && (
                      <div>
                        <span>Fechas</span>
                        <div className="rag__chips">
                          {snippet.fechas.map((fecha) => (
                            <span key={fecha} className="rag__chip">{fecha}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {snippet.porcentajes?.length > 0 && (
                      <div>
                        <span>Porcentajes</span>
                        <div className="rag__chips">
                          {snippet.porcentajes.map((porcentaje) => (
                            <span key={porcentaje} className="rag__chip">{porcentaje}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {snippet.clausulas?.length > 0 && (
                      <div>
                        <span>Cláusulas</span>
                        <div className="rag__chips">
                          {snippet.clausulas.map((clausula) => (
                            <span key={clausula} className="rag__chip">{clausula}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {postProcess && (
                    <Typography variant="caption" color="text.secondary">
                      Post-procesamiento inteligente activo.
                    </Typography>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientesLista;