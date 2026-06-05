import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Swal from 'sweetalert2'

// Global Alert Override with SweetAlert2
window.alert = (message) => {
  Swal.fire({
    title: 'Informasi',
    text: message,
    icon: 'info',
    confirmButtonColor: '#5b4fcf',
  });
};

// Global Confirm Override with SweetAlert2 (Returns Promise, use with 'await')
window.confirm = (message) => {
  return new Promise((resolve) => {
    Swal.fire({
      title: 'Konfirmasi',
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#5b4fcf',
      cancelButtonColor: '#e74c3c',
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
