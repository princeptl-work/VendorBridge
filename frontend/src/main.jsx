import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: "'Inter', sans-serif", fontSize: '13.5px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
            success: { iconTheme: { primary: '#28a745', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc3545', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
