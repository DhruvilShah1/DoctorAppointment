import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from './AuthProvider.jsx'
import App from './App.jsx'
const VITE_BACKEND_URL = import.meta.VITE_BACKEND_URL;


createRoot(document.getElementById('root')).render(
  
    <BrowserRouter>
    <ToastContainer/>
    <AuthProvider>
    <App/>
    </AuthProvider>
</BrowserRouter>

)
