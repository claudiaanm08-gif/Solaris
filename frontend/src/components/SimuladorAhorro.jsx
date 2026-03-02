import { useMemo, useState } from 'react';
import { Button, Fade, InputAdornment, TextField } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { downloadPropuesta, simulateAhorro } from '../services/simuladorService';
import ClienteSelect from './ClienteSelect';
import { useToast } from './toastContext';

const fuenteLabel = {
  consumo: 'Consumos históricos',
  entregas: 'Entregas registradas',
  estimado: 'Volumen estimado',
  sin_datos: 'Sin datos'
};

const SimuladorAhorro = () => {
  const [clienteId, setClienteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [precioSolensa, setPrecioSolensa] = useState('');
  const [precioAlternativo, setPrecioAlternativo] = useState('');
  const [volumenEstimado, setVolumenEstimado] = useState('');
  const [prospectoNombre, setProspectoNombre] = useState('');
  const [prospectoEmpresa, setProspectoEmpresa] = useState('');
  const [prospectoEmail, setProspectoEmail] = useState('');
  const [prospectoTelefono, setProspectoTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { pushToast } = useToast();

  const payload = useMemo(() => {
    if (!clienteId) return null;
    return {
      cliente_id: Number(clienteId),
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      precio_solensa: Number(precioSolensa),
      precio_alternativo: Number(precioAlternativo),
      volumen_estimado: volumenEstimado ? Number(volumenEstimado) : undefined
    };
  }, [clienteId, fechaInicio, fechaFin, precioAlternativo, precioSolensa, volumenEstimado]);

  const validateBase = () => {
    if (!clienteId) return 'Selecciona un cliente.';
    if (!precioSolensa || Number(precioSolensa) <= 0) return 'Ingresa el precio Solensa.';
    if (!precioAlternativo || Number(precioAlternativo) <= 0) return 'Ingresa el precio alternativo.';
    return '';
  };

  const handleSimulate = async () => {
    const validation = validateBase();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await simulateAhorro(payload);
      setResult(data);
      setSuccess('Simulación generada correctamente.');
      pushToast('Simulación generada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      setError('No se pudo ejecutar la simulación.');
      pushToast('No se pudo ejecutar la simulación.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const validation = validateBase();
    if (validation) {
      setError(validation);
      return;
    }
    if (!prospectoNombre) {
      setError('Ingresa el nombre del prospecto.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const blob = await downloadPropuesta({
        ...payload,
        prospecto_nombre: prospectoNombre,
        prospecto_empresa: prospectoEmpresa || undefined,
        prospecto_email: prospectoEmail || undefined,
        prospecto_telefono: prospectoTelefono || undefined,
        notas: notas || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'propuesta_ahorro.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Propuesta descargada correctamente.');
      pushToast('Propuesta descargada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      setError('No se pudo descargar la propuesta.');
      pushToast('No se pudo descargar la propuesta.', 'error');
    }
  };

  return (
  <section className="simulador space-y-6">
  <header className="simulador__header flex flex-wrap gap-6">
        <div>
          <h2>Simulador de ahorro energético</h2>
          <p>Compara el costo Solensa frente a alternativas y genera propuestas.</p>
        </div>
        <div className="simulador__actions">
          <Button type="button" variant="contained" onClick={handleSimulate} disabled={loading} aria-label="Simular ahorro">
            {loading ? 'Calculando...' : 'Simular ahorro'}
          </Button>
          <Button type="button" variant="outlined" onClick={handleDownload} aria-label="Descargar propuesta">
            Descargar propuesta
          </Button>
        </div>
      </header>

  <div className="simulador__grid gap-6">
        <div className="simulador__panel">
          <h3>Datos históricos</h3>
          <div className="simulador__form">
            <label>
              Cliente
              <ClienteSelect value={clienteId} onChange={(event) => setClienteId(event.target.value)} />
            </label>
            <label>
              Fecha inicio
              <TextField
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                aria-label="Fecha inicio"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Fecha fin
              <TextField
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                aria-label="Fecha fin"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Precio Solensa
              <TextField
                type="number"
                min="0"
                step="0.01"
                value={precioSolensa}
                onChange={(event) => setPrecioSolensa(event.target.value)}
                aria-label="Precio Solensa"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalOfferOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Precio alternativo
              <TextField
                type="number"
                min="0"
                step="0.01"
                value={precioAlternativo}
                onChange={(event) => setPrecioAlternativo(event.target.value)}
                aria-label="Precio alternativo"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalOfferOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Volumen estimado (opcional)
              <TextField
                type="number"
                min="0"
                step="0.01"
                value={volumenEstimado}
                onChange={(event) => setVolumenEstimado(event.target.value)}
                aria-label="Volumen estimado"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
          </div>
        </div>

        <div className="simulador__panel">
          <h3>Datos del prospecto</h3>
          <div className="simulador__form">
            <label>
              Nombre del prospecto
              <TextField
                value={prospectoNombre}
                onChange={(event) => setProspectoNombre(event.target.value)}
                aria-label="Nombre del prospecto"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Empresa
              <TextField
                value={prospectoEmpresa}
                onChange={(event) => setProspectoEmpresa(event.target.value)}
                aria-label="Empresa"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Email
              <TextField
                type="email"
                value={prospectoEmail}
                onChange={(event) => setProspectoEmail(event.target.value)}
                aria-label="Email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label>
              Teléfono
              <TextField
                value={prospectoTelefono}
                onChange={(event) => setProspectoTelefono(event.target.value)}
                aria-label="Teléfono"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
            <label className="simulador__full">
              Notas
              <TextField
                rows={3}
                multiline
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                aria-label="Notas"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotesOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <p className="simulador__hint">
        El simulador usa consumos históricos del periodo. Si no existen, toma entregas o el volumen estimado.
      </p>

      {error && (
        <span className="form__helper form__helper--error" role="alert">
          {error}
        </span>
      )}
      {success && (
        <span className="form__helper" role="status">
          {success}
        </span>
      )}

      {result && (
        <Fade in timeout={250}>
          <div className="simulador__results">
            <article className="simulador__card transition-all duration-200">
              <h3>Resultado de simulación</h3>
              <ul>
                <li>Periodo: {result.periodo_inicio} → {result.periodo_fin}</li>
                <li>Fuente del volumen: {fuenteLabel[result.fuente_volumen] || result.fuente_volumen}</li>
                <li>Volumen base: {result.volumen_base.toFixed(2)}</li>
                <li>Costo Solensa: {result.costo_solensa.toFixed(2)}</li>
                <li>Costo alternativo: {result.costo_alternativo.toFixed(2)}</li>
                <li>
                  Ahorro estimado: <strong>{result.ahorro_estimado.toFixed(2)}</strong>
                </li>
                <li>Porcentaje de ahorro: {result.porcentaje_ahorro.toFixed(1)}%</li>
              </ul>
            </article>
          </div>
        </Fade>
      )}
    </section>
  );
};

export default SimuladorAhorro;
