import './App.css'
import { Box, Container, Paper, Typography } from '@mui/material'
import ClientesLista from './components/ClientesLista'
import OperacionDashboard from './components/OperacionDashboard'
import ContratoUpload from './components/ContratoUpload'
import OperacionRegistro from './components/OperacionRegistro'
import ProyeccionReabastecimiento from './components/ProyeccionReabastecimiento'
import SimuladorAhorro from './components/SimuladorAhorro'
import RagConsulta from './components/RagConsulta'

function App() {
  return (
    <Container maxWidth="lg" className="app theme-light py-8 px-4 md:px-8">
      <Box className="app__header flex flex-col gap-2">
        <Typography variant="h3" component="h1">
          Solensa · Gestión Operativa
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Clientes, contratos y operación.
        </Typography>
      </Box>
  <Paper elevation={0} className="app__content flex flex-col gap-8">
        <ClientesLista />
        <ContratoUpload />
        <OperacionRegistro />
        <SimuladorAhorro />
        <RagConsulta />
        <ProyeccionReabastecimiento />
        <OperacionDashboard />
      </Paper>
    </Container>
  )
}

export default App
