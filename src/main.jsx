import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CityApp from './CityApp.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CityApp />
  </StrictMode>,
)
