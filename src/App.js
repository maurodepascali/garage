import React, { useState, useEffect  } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate  } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { auth } from './firebase-config';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PublishGarage from './components/PublishGarage';
import SearchGarage from './components/SearchGarage';
import MyBookings from './components/MyBookings';
import NavBar from './components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import GarageDetail from './components/GarageDetail';
import { testEmailConfiguration } from './services/emailService';

// Componente principal
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    testEmailConfiguration()
      .then(success => {
        if (success) {
          console.log('✅ Configuración de email correcta');
        } else {
          console.error('❌ Problema con la configuración de email');
        }
      })
      .catch(error => {
        console.error('❌ Error al probar la configuración de email:', error);
      });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-white to-gray-50">
      <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            success: {
              duration: 2000,
              style: {
                background: '#10B981',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
                fontWeight: 'bold',
              },
            },
            error: {
              duration: 3000,
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
            },
          }}
        />
        <NavBar user={user} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/publish" 
              element={user ? <PublishGarage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/bookings" 
              element={user ? <MyBookings /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/search" 
              element={user ? <SearchGarage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/forgot-password" 
              element={user ? <Navigate to="/" /> : <ForgotPassword />} 
            />
            <Route 
              path="/reset-password" 
              element={user ? <Navigate to="/" /> : <ResetPassword />} 
            />
            <Route 
              path="/garage/:id" 
              element={user ? <GarageDetail /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

class Garage {
  constructor(data) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.address = data.address;
    this.location = data.location;
    this.pricePerHour = data.pricePerHour;
    this.availability = data.availability;
    this.photos = data.photos;
    this.features = data.features;
  }

  // Métodos para verificar disponibilidad
  isAvailable(date, startTime, endTime) {
    // Lógica para verificar disponibilidad
  }

  // Calcular precio total
  calculatePrice(hours) {
    return this.pricePerHour * hours;
  }
}

// Modelo de Booking
class Booking {
  constructor(data) {
    this.id = data.id;
    this.garageId = data.garageId;
    this.userId = data.userId;
    this.start = data.start;
    this.end = data.end;
    this.status = data.status;
    this.price = data.price;
  }

  // Confirmar reserva
  async confirm() {
    // Lógica para confirmar reserva
  }

  // Cancelar reserva
  async cancel() {
    // Lógica para cancelar reserva
  }
}
export default App;