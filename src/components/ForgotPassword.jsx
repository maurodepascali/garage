import React, { useState } from 'react';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, actionCodeSettings  } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'El correo electrónico es requerido';
    }
    if (!emailRegex.test(email)) {
      return 'Ingresa un correo electrónico válido';
    }
    return '';
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este correo electrónico';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Por favor, intenta más tarde';
      default:
        return 'Error al enviar el correo. Intenta nuevamente';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      await sendPasswordResetEmail(auth, email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña', {
        duration: 4000,
        style: {
          minWidth: '300px',
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
      
      // Redirigir al login después de 4 segundos
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (error) {
    
      if (error.code === 'auth/user-not-found') {
        toast.error('No existe una cuenta con este correo electrónico');
      } else {
        toast.error(getErrorMessage(error.code));
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Recuperar Contraseña
            </h2>
            <p className="mt-3 text-gray-600">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail size={18} className="mr-2 text-blue-600" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors
                  ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="ejemplo@correo.com"
              />
              {error && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
                text-white flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <PulseLoader color="#ffffff" size={8} />
                  <span>Enviando email...</span>
                </>
              ) : (
                <>
                  <span>Recuperar Contraseña</span>
                </>
              )}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;