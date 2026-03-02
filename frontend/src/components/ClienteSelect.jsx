import { useEffect, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { getClientes } from '../services/clienteService';

const ClienteSelect = ({
  value,
  onChange,
  required = false,
  includeAll = false,
  allLabel = 'Todos',
  placeholder = 'Selecciona un cliente',
  name,
  disabled = false,
  className
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="form__field">
      <TextField
        select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled || loading || Boolean(error)}
        className={className}
        label="Cliente"
        aria-label="Seleccionar cliente"
      >
        <MenuItem value="">{includeAll ? allLabel : placeholder}</MenuItem>
        {clientes.map((cliente) => (
          <MenuItem key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </MenuItem>
        ))}
      </TextField>
      {error && <span className="form__helper form__helper--error">{error}</span>}
    </div>
  );
};

export default ClienteSelect;
