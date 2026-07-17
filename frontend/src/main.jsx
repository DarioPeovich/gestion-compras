import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import SESToastProvider from './components/ui/feedback/SESToastProvider.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SESToastProvider>
        <App />
      </SESToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
