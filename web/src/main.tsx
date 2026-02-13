import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'

const clerkPubKey = import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
