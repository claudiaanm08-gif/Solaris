import { useEffect, useState } from 'react';
import { getClientes } from '../services/clienteService';
import { getContratosByCliente } from '../services/contratoService';
import { createEntrega } from '../services/entregaService';
import { createConsumo } from '../services/consumoService';

const OperacionRegistro = () => {
  const [clientes, setClientes] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [savingConsumo, setSavingConsumo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await getClientes();
        setClientes(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los clientes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

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
      setEntregaData({
        fecha_entrega: '',
        volumen_entregado: '',
        costo_logistico: '',
        observaciones: ''
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar la entrega.');
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
      setConsumoData({
        fecha_consumo: '',
        volumen_consumido: ''
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar el consumo.');
    } finally {
      setSavingConsumo(false);
    }
  };

  if (loading) return <div>Cargando clientes...</div>;

  return (
    <section className="operacion-registro">
      <h2>Registro operativo</h2>
      <p>Captura entregas y consumos para el cliente seleccionado.</p>

      <div className="operacion-registro__selectors">
        <label>
          Cliente
          <select value={clienteId} onChange={(event) => setClienteId(event.target.value)}>
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
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

      {message && <p className="operacion-registro__success">{message}</p>}
      {error && <p className="operacion-registro__error">{error}</p>}

      <div className="operacion-registro__forms">
        <form onSubmit={handleEntregaSubmit} className="operacion-registro__form">
          <h3>Registrar entrega</h3>
          <label>
            Fecha de entrega
            <input
              type="date"
              name="fecha_entrega"
              value={entregaData.fecha_entrega}
              onChange={handleEntregaChange}
              required
              disabled={!contratoId}
            />
          </label>
          <label>
            Volumen entregado
            <input
              type="number"
              step="0.01"
              name="volumen_entregado"
              value={entregaData.volumen_entregado}
              onChange={handleEntregaChange}
              required
              disabled={!contratoId}
            />
          </label>
          <label>
            Costo logístico
            <input
              type="number"
              step="0.01"
              name="costo_logistico"
              value={entregaData.costo_logistico}
              onChange={handleEntregaChange}
              disabled={!contratoId}
            />
          </label>
          <label>
            Observaciones
            <textarea
              name="observaciones"
              value={entregaData.observaciones}
              onChange={handleEntregaChange}
              rows="2"
              disabled={!contratoId}
            />
          </label>
          <button type="submit" disabled={savingEntrega || !contratoId}>
            {savingEntrega ? 'Guardando...' : 'Registrar entrega'}
          </button>
        </form>

        <form onSubmit={handleConsumoSubmit} className="operacion-registro__form">
          <h3>Registrar consumo</h3>
          <label>
            Fecha de consumo
            <input
              type="date"
              name="fecha_consumo"
              value={consumoData.fecha_consumo}
              onChange={handleConsumoChange}
              required
              disabled={!contratoId}
            />
          </label>
          <label>
            Volumen consumido
            <input
              type="number"
              step="0.01"
              name="volumen_consumido"
              value={consumoData.volumen_consumido}
              onChange={handleConsumoChange}
              required
              disabled={!contratoId}
            />
          </label>
          <button type="submit" disabled={savingConsumo || !contratoId}>
            {savingConsumo ? 'Guardando...' : 'Registrar consumo'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default OperacionRegistro;
