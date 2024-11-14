import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase-config';
import { useNavigate, useLocation  } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft  } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PulseLoader } from 'react-spinners';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromRegister = location.state?.fromRegister;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Limpiar todos los toasts al montar y desmontar el componente
    toast.dismiss();
    return () => {
      toast.dismiss();
      toast.remove(); // Remover todos los toasts pendientes
    };
  }, []);

  // Validación de email en tiempo real
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

  // Validación de contraseña en tiempo real
  const validatePassword = (password) => {
    if (!password) {
      return 'La contraseña es requerida';
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  };

  // Manejador de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real
    if (name === 'email') {
      setErrors(prev => ({
        ...prev,
        email: validateEmail(value)
      }));
    }
    if (name === 'password') {
      setErrors(prev => ({
        ...prev,
        password: validatePassword(value)
      }));
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Las credenciales ingresadas son incorrectas';
      case 'auth/user-not-found':
        return 'No existe una cuenta con este correo electrónico';
      case 'auth/wrong-password':
        return 'La contraseña ingresada es incorrecta';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por favor, espera unos minutos';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet';
      case 'auth/operation-not-allowed':
        return 'El inicio de sesión está temporalmente deshabilitado';
      default:
        return 'Ocurrió un error inesperado. Por favor, intenta de nuevo';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validación inicial
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
  
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }
  
    setLoading(true);
    toast.dismiss();
  
    try {
      // Iniciar sesión
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
  
      // Obtener el tipo de usuario de Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userType = userDoc.data().userType;
      
      // Guardar en localStorage
      localStorage.setItem('userType', userType);
  
      // Mostrar mensaje de éxito
      toast.success('¡Bienvenido! Sesión iniciada correctamente 👋', {
        duration: 2000,
        style: {
          minWidth: '300px',
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontWeight: 'bold',
        }
      });
  
      // Navegar después de un momento
      setTimeout(() => {
        setLoading(false);
        navigate('/', { replace: true });
      }, 1500);
  
    } catch (error) {
      toast.error(getErrorMessage(error.code), {
        duration: 3000,
        style: {
          minWidth: '300px',
          backgroundColor: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6" noValidate>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail size={18} className="mr-2 text-blue-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="ejemplo@correo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lock size={18} className="mr-2 text-blue-600" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 transition-colors
                    ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Recordarme</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
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
                  <span className="ml-2">Iniciando sesión...</span>
                </>
              ) : 'Iniciar Sesión'}
            </button>

            <div className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Registrate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;