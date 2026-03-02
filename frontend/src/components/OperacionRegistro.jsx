import { useEffect, useState } from 'react';
import { Button, InputAdornment, TextField } from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import { getContratosByCliente } from '../services/contratoService';
import { createEntrega } from '../services/entregaService';
import { createConsumo } from '../services/consumoService';
import ClienteSelect from './ClienteSelect';
import AlertBanner from './AlertBanner';
import { useToast } from './toastContext';

const OperacionRegistro = () => {
  const [contratos, setContratos] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [entregaData, setEntregaData] = useState({
    fecha_entrega: '',
    volumen_entregado: '',
    costo_logistico: '',
    observaciones: ''
  });
  const [consumoData, setConsumoData] = useState({
    fecha_consumo: '',
    volumen_consumido: ''
  });
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [savingConsumo, setSavingConsumo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { pushToast } = useToast();

  useEffect(() => {
    const fetchContratos = async () => {
      if (!clienteId) {
        setContratos([]);
        setContratoId('');
        return;
      }
      try {
        const data = await getContratosByCliente(clienteId);
        setContratos(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los contratos.');
      }
    };

    fetchContratos();
  }, [clienteId]);

  const handleEntregaChange = (event) => {
    const { name, value } = event.target;
    setEntregaData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsumoChange = (event) => {
    const { name, value } = event.target;
    setConsumoData((prev) => ({ ...prev, [name]: value }));
  };

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const handleEntregaSubmit = async (event) => {
    event.preventDefault();
    resetMessages();
    setSavingEntrega(true);

    try {
      await createEntrega({
        contrato_id: Number(contratoId),
        fecha_entrega: entregaData.fecha_entrega,
        volumen_entregado: Number(entregaData.volumen_entregado),
        costo_logistico: entregaData.costo_logistico ? Number(entregaData.costo_logistico) : null,
        observaciones: entregaData.observaciones || null
      });
      setMessage('Entrega registrada correctamente.');
  pushToast('Entrega registrada correctamente.', 'success');
      setEntregaData({
        fecha_entrega: '',
        volumen_entregado: '',
        costo_logistico: '',
        observaciones: ''
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar la entrega.');
      pushToast('No se pudo registrar la entrega.', 'error');
    } finally {
      setSavingEntrega(false);
    }
  };

  const handleConsumoSubmit = async (event) => {
    event.preventDefault();
    resetMessages();
    setSavingConsumo(true);

    try {
      await createConsumo({
        contrato_id: Number(contratoId),
        fecha_consumo: consumoData.fecha_consumo,
        volumen_consumido: Number(consumoData.volumen_consumido)
      });
      setMessage('Consumo registrado correctamente.');
  pushToast('Consumo registrado correctamente.', 'success');
      setConsumoData({
        fecha_consumo: '',
        volumen_consumido: ''
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar el consumo.');
      pushToast('No se pudo registrar el consumo.', 'error');
    } finally {
      setSavingConsumo(false);
    }
  };

  return (
  <section className="operacion-registro space-y-6">
      <h2>Registro operativo</h2>
      <p>Captura entregas y consumos para el cliente seleccionado.</p>

  <div className="operacion-registro__selectors gap-6">
        <label>
          Cliente
          <ClienteSelect value={clienteId} onChange={(event) => setClienteId(event.target.value)} />
        </label>

        <label>
          Contrato
          <select value={contratoId} onChange={(event) => setContratoId(event.target.value)} disabled={!clienteId}>
            <option value="">Selecciona un contrato</option>
            {contratos.map((contrato) => (
              <option key={contrato.id} value={contrato.id}>
                #{contrato.id} · {contrato.fecha_inicio} a {contrato.fecha_fin}
              </option>
            ))}
          </select>
        </label>
      </div>

  <AlertBanner severity="success">{message}</AlertBanner>
  <AlertBanner severity="error">{error}</AlertBanner>

  <div className="operacion-registro__forms gap-6">
        <form onSubmit={handleEntregaSubmit} className="operacion-registro__form">
          <h3>Registrar entrega</h3>
          <label>
            Fecha de entrega
            <TextField
              type="date"
              name="fecha_entrega"
              value={entregaData.fecha_entrega}
              onChange={handleEntregaChange}
              required
              disabled={!contratoId}
              aria-label="Fecha de entrega"
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
            Volumen entregado
            <TextField
              type="number"
              step="0.01"
              name="volumen_entregado"
              value={entregaData.volumen_entregado}
              onChange={handleEntregaChange}
              required
              disabled={!contratoId}
              aria-label="Volumen entregado"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShippingOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </label>
          <label>
            Costo logístico
            <TextField
              type="number"
              step="0.01"
              name="costo_logistico"
              value={entregaData.costo_logistico}
              onChange={handleEntregaChange}
              disabled={!contratoId}
              aria-label="Costo logístico"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </label>
          <label>
            Observaciones
            <TextField
              name="observaciones"
              value={entregaData.observaciones}
              onChange={handleEntregaChange}
              rows={2}
              multiline
              disabled={!contratoId}
              aria-label="Observaciones"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </label>
          <Button type="submit" variant="contained" disabled={savingEntrega || !contratoId} aria-label="Registrar entrega">
            {savingEntrega ? 'Guardando...' : 'Registrar entrega'}
          </Button>
        </form>

        <form onSubmit={handleConsumoSubmit} className="operacion-registro__form">
          <h3>Registrar consumo</h3>
          <label>
            Fecha de consumo
            <TextField
              type="date"
              name="fecha_consumo"
              value={consumoData.fecha_consumo}
              onChange={handleConsumoChange}
              required
              disabled={!contratoId}
              aria-label="Fecha de consumo"
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
            Volumen consumido
            <TextField
              type="number"
              step="0.01"
              name="volumen_consumido"
              value={consumoData.volumen_consumido}
              onChange={handleConsumoChange}
              required
              disabled={!contratoId}
              aria-label="Volumen consumido"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WaterDropOutlinedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </label>
          <Button type="submit" variant="contained" disabled={savingConsumo || !contratoId} aria-label="Registrar consumo">
            {savingConsumo ? 'Guardando...' : 'Registrar consumo'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default OperacionRegistro;
