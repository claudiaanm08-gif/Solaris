import { useEffect, useState } from 'react';
import { getClientes } from '../services/clienteService';
import { createContrato } from '../services/contratoService';

const ContratoUpload = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    cliente_id: '',
    volumen_contratado: '',
    fecha_inicio: '',
    fecha_fin: '',
    condiciones: '',
    archivo: null
  });

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, archivo: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.archivo) {
      setError('Selecciona un PDF para subir.');
      setSaving(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append('cliente_id', formData.cliente_id);
      payload.append('volumen_contratado', formData.volumen_contratado);
      payload.append('fecha_inicio', formData.fecha_inicio);
      payload.append('fecha_fin', formData.fecha_fin);
      if (formData.condiciones) payload.append('condiciones', formData.condiciones);
      payload.append('archivo', formData.archivo);

      await createContrato(payload);
      setSuccess('Contrato registrado correctamente.');
      setFormData({
        cliente_id: '',
        volumen_contratado: '',
        fecha_inicio: '',
        fecha_fin: '',
        condiciones: '',
        archivo: null
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo subir el contrato.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando clientes...</div>;

  return (
    <section className="contract-upload">
      <h2>Subir contrato PDF</h2>
      <p>Adjunta el PDF y completa los datos operativos del contrato.</p>

      <form onSubmit={handleSubmit} className="contract-upload__form">
        <label>
          Cliente
          <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Volumen contratado
          <input
            name="volumen_contratado"
            type="number"
            step="0.01"
            value={formData.volumen_contratado}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Fecha inicio
          <input name="fecha_inicio" type="date" value={formData.fecha_inicio} onChange={handleChange} required />
        </label>

        <label>
          Fecha fin
          <input name="fecha_fin" type="date" value={formData.fecha_fin} onChange={handleChange} required />
        </label>

        <label className="contract-upload__full">
          Condiciones
          <textarea name="condiciones" value={formData.condiciones} onChange={handleChange} rows="3" />
        </label>

        <label className="contract-upload__full">
          Archivo PDF
          <input name="archivo" type="file" accept="application/pdf" onChange={handleFileChange} required />
        </label>

        {error && <p className="contract-upload__error">{error}</p>}
        {success && <p className="contract-upload__success">{success}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Subiendo...' : 'Subir contrato'}
        </button>
      </form>
    </section>
  );
};

export default ContratoUpload;
