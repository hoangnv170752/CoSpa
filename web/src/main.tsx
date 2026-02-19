import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'
import { AboutPage } from './pages/AboutPage'
import { WiFiPage } from './pages/WiFiPage'
import { SavedLocationsPage } from './pages/SavedLocationsPage'

const clerkPubKey = import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/wifi" element={<WiFiPage />} />
          <Route path="/saved" element={<SavedLocationsPage />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
