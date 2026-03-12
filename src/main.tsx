import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { RefreshProvider } from './contexts/RefreshContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <RefreshProvider>
            <App />
          </RefreshProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
