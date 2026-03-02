import './App.css'
import { Box, Container, Paper, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import ClientesLista from './components/ClientesLista'
import OperacionDashboard from './components/OperacionDashboard'
import ContratoUpload from './components/ContratoUpload'
import OperacionRegistro from './components/OperacionRegistro'
import ProyeccionReabastecimiento from './components/ProyeccionReabastecimiento'
import SimuladorAhorro from './components/SimuladorAhorro'
import RagConsulta from './components/RagConsulta'

function App() {
  const modules = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard', description: 'KPIs y alertas clave.', element: <OperacionDashboard /> },
      { key: 'clientes', label: 'Clientes', description: 'Gestión y cartera de clientes.', element: <ClientesLista /> },
      { key: 'contratos', label: 'Contratos', description: 'Carga de contratos y condiciones.', element: <ContratoUpload /> },
      { key: 'operacion', label: 'Operación', description: 'Entregas y consumos registrados.', element: <OperacionRegistro /> },
      { key: 'simulador', label: 'Simulador', description: 'Escenarios de ahorro y propuesta.', element: <SimuladorAhorro /> },
      { key: 'rag', label: 'RAG', description: 'Consulta inteligente de contratos.', element: <RagConsulta /> },
      { key: 'proyeccion', label: 'Proyecciones', description: 'Reabastecimiento y tendencias.', element: <ProyeccionReabastecimiento /> }
    ],
    []
  )
  const [activeKey, setActiveKey] = useState(modules[0].key)
  const activeModule = modules.find((module) => module.key === activeKey) || modules[0]

  return (
    <Container maxWidth={false} className="app theme-light">
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar__brand sidebar-header">
            <h1 className="sidebar__logo">Solensa</h1>
          </div>
          <nav className="sidebar__nav">
            {modules.map((module) => (
              <button
                key={module.key}
                type="button"
                className={`sidebar__link ${activeKey === module.key ? 'is-active' : ''}`}
                onClick={() => setActiveKey(module.key)}
              >
                {module.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="content">
          <header className="page-header">
            <Typography variant="h2" component="h1" className="hero-title">
              {activeModule.label}
            </Typography>
            <Typography variant="body1" className="hero-subtitle">
              {activeModule.description}
            </Typography>
          </header>

          <Paper elevation={0} className="app__content">
            {activeModule.element}
          </Paper>
        </main>
      </div>
    </Container>
  )
}

export default App
