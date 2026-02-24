import { useState, useEffect } from 'react';
import { getClientes, deleteCliente, createCliente } from '../services/clienteService';

const ClientesLista = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    direccion: '',
    email: '',
    telefono: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
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
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createCliente(formData);
      setFormData({
        nombre: '',
        rfc: '',
        direccion: '',
        email: '',
        telefono: ''
      });
      await loadClientes();
    } catch (submitError) {
      console.error(submitError);
      setError('No se pudo registrar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await deleteCliente(id);
      loadClientes();
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Registrar cliente</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
            <input
              name="rfc"
              placeholder="RFC"
              value={formData.rfc}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
          <input
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar cliente'}
          </button>
        </form>
      </section>

      <h2>Clientes</h2>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>RFC</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => (
            <tr key={cliente.id}>
              <td>{cliente.id}</td>
              <td>{cliente.nombre}</td>
              <td>{cliente.rfc}</td>
              <td>{cliente.email}</td>
              <td>
                <button onClick={() => handleDelete(cliente.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientesLista;