import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import StockView from './pages/StockView'
import DataEntry from './pages/DataEntry'

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          <Route path="/" element={<StockView />} />
          <Route path="/stock/:symbol" element={<StockView />} />
          <Route path="/data-entry" element={<DataEntry />} />
          <Route path="/data-entry/:symbol" element={<DataEntry />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

