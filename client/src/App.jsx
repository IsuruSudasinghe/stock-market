import { Routes, Route, Navigate } from 'react-router-dom'
import { AppStateProvider } from './contexts/AppStateContext'
import Header from './components/Header'
import StockView from './pages/StockView'
import DataEntry from './pages/DataEntry'
import ComparePage from './pages/ComparePage'

function App() {
  return (
    <AppStateProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            <Route path="/" element={<StockView />} />
            <Route path="/stock/:symbol" element={<StockView />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/data-entry/:symbol" element={<DataEntry />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AppStateProvider>
  )
}

export default App
