import { useState } from 'react';
import { Button, InputAdornment, TextField } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { createContrato } from '../services/contratoService';
import ClienteSelect from './ClienteSelect';
import { useToast } from './toastContext';

const ContratoUpload = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { pushToast } = useToast();
  const [formData, setFormData] = useState({
    cliente_id: '',
    volumen_contratado: '',
    fecha_inicio: '',
    fecha_fin: '',
    condiciones: '',
    archivo: null
  });

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
      pushToast('Contrato registrado correctamente.', 'success');
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
      pushToast('No se pudo subir el contrato.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
  <section className="contract-upload space-y-6">
      <h2>Subir contrato PDF</h2>
      <p>Adjunta el PDF y completa los datos operativos del contrato.</p>

  <form onSubmit={handleSubmit} className="contract-upload__form gap-6">
        <label>
          Cliente
          <ClienteSelect
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Volumen contratado
          <TextField
            name="volumen_contratado"
            type="number"
            step="0.01"
            value={formData.volumen_contratado}
            onChange={handleChange}
            required
            aria-label="Volumen contratado"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NumbersOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>

        <label>
          Fecha inicio
          <TextField
            name="fecha_inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
            aria-label="Fecha inicio"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>

        <label>
          Fecha fin
          <TextField
            name="fecha_fin"
            type="date"
            value={formData.fecha_fin}
            onChange={handleChange}
            required
            aria-label="Fecha fin"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>

        <label className="contract-upload__full">
          Condiciones
          <TextField
            name="condiciones"
            value={formData.condiciones}
            onChange={handleChange}
            rows={3}
            multiline
            aria-label="Condiciones"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>

        <label className="contract-upload__full">
          Archivo PDF
          <TextField
            name="archivo"
            type="file"
            inputProps={{ accept: 'application/pdf' }}
            onChange={handleFileChange}
            required
            aria-label="Archivo PDF"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <UploadFileOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>

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

        <Button type="submit" variant="contained" disabled={saving} aria-label="Subir contrato">
          {saving ? 'Subiendo...' : 'Subir contrato'}
        </Button>
      </form>
    </section>
  );
};

export default ContratoUpload;
