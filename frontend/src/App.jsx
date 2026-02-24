import './App.css'
import ClientesLista from './components/ClientesLista'
import OperacionDashboard from './components/OperacionDashboard'
import ContratoUpload from './components/ContratoUpload'
import OperacionRegistro from './components/OperacionRegistro'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Solensa · Gestión Operativa</h1>
        <p>Clientes, contratos y operación.</p>
      </header>
      <main className="app__content">
        <ClientesLista />
        <ContratoUpload />
        <OperacionRegistro />
        <OperacionDashboard />
      </main>
    </div>
  )
}

export default App
