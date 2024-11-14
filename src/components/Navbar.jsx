import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import toast from 'react-hot-toast';
import { X, Menu, LogIn, UserPlus } from 'lucide-react';

const NavBar = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    setUserType(storedUserType);
  }, []);

  const handleLogout = async () => {
    try {
      toast.dismiss(); // Limpiar toasts existentes
      await auth.signOut();
      localStorage.removeItem('userType');
      setUserType(null);

      toast.success('Sesión finalizada', {
        duration: 2000,
        style: {
          minWidth: '300px',
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
      
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Error al cerrar sesión', {
        duration: 3000,
        style: {
          minWidth: '300px',
          backgroundColor: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              ParkShare
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex items-center space-x-4">
            {auth.currentUser ? (
              <>
                <Link 
                  to="/search" 
                  className="relative group text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span>Buscar</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link 
                  to="/publish" 
                  className="relative group text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span>Publicar</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link 
                  to="/bookings" 
                  className="relative group text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span>Mis Reservas</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 space-x-2"
                >
                  <LogIn size={20} />
                  <span>Iniciar Sesión</span>
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors space-x-2"
                >
                  <UserPlus size={20} />
                  <span>Registrarse</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div 
          className={`${
            isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          } md:hidden overflow-hidden transition-all duration-300 ease-in-out`}
        >
          <div className="py-4 space-y-4">
            {auth.currentUser ? (
              <>
                <Link 
                  to="/search"
                  className="block text-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 py-2 transition-colors"
                >
                  Buscar
                </Link>
                <Link 
                  to="/publish"
                  className="block text-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 py-2 transition-colors"
                >
                  Publicar
                </Link>
                <Link 
                  to="/bookings"
                  className="block text-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 py-2 transition-colors"
                >
                  Mis Reservas
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center text-blue-600 hover:text-blue-700 py-2 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="space-y-2 px-4">
                <Link 
                  to="/login"
                  className="flex items-center justify-center space-x-2 text-blue-600 border border-blue-600 rounded-lg py-2 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <LogIn size={20} />
                  <span>Iniciar Sesión</span>
                </Link>
                <Link 
                  to="/register"
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={20} />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;