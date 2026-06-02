import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import SectorPage from './pages/SectorPage'
import TranscriptPage from './pages/TranscriptPage'

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0F0D' }}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/company/:companyId/:quarterId" element={<TranscriptPage />} />
            <Route path="/sector/:sectorId" element={<SectorPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
