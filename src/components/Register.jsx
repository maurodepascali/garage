import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PulseLoader } from 'react-spinners';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
    //userType: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    //userType: ''
  });

  const validateUserType = (userType) => {
  if (!userType) return 'Por favor selecciona un tipo de usuario';
  return ''; // Debe retornar string vacío, no null
};

  useEffect(() => {
    // Limpiar todos los toasts al montar y desmontar el componente
    toast.dismiss();
    return () => {
      toast.dismiss();
      toast.remove(); // Remover todos los toasts pendientes
    };
  }, []);
  
  // Validaciones
  const validateName = (name) => {
    if (!name) return 'El nombre es requerido';
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) return 'El nombre solo debe contener letras';
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'El correo electrónico es requerido';
    if (!emailRegex.test(email)) return 'Ingresa un correo electrónico válido';
    return '';
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) return 'El teléfono es requerido';
    if (!phoneRegex.test(phone)) return 'Ingresa un número de teléfono válido (10 dígitos)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (!/\d/.test(password)) return 'La contraseña debe contener al menos un número';
    if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula';
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  
    // Validación en tiempo real
    switch (name) {
      case 'name':
        setErrors(prev => ({ ...prev, name: validateName(value) }));
        break;
      case 'email':
        setErrors(prev => ({ ...prev, email: validateEmail(value) }));
        break;
      case 'phone':
        setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
        break;
      case 'password':
        setErrors(prev => ({ ...prev, password: validatePassword(value) }));
        break;
      //case 'userType':
        //setErrors(prev => ({ ...prev, userType: validateUserType(value) }));
        //break;
      default:
        break;
    }
  };
  

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido';
      case 'auth/operation-not-allowed':
        return 'El registro está temporalmente deshabilitado';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      default:
        return 'Ocurrió un error en el registro. Por favor, intenta de nuevo';
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    console.log('Botón de registro presionado');

    const validationErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password)
     // userType: validateUserType(formData.userType)
    };

    const hasErrors = Object.values(validationErrors).some(error => error && error !== '');
  
  if (hasErrors) {
    setErrors(validationErrors);
    toast.error('Por favor, completa todos los campos correctamente');
    return;
  }

    setLoading(true);
    toast.dismiss();
  
    try {
      // Registrar usuario y guardar datos
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
  
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        //userType: formData.userType,
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('userType', formData.userType);
      
      // Cerrar sesión
      await signOut(auth);
  
      // Mostrar toast
      toast.success('¡Registro exitoso! Redirigiendo al login...', {
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
  
      // Esperar un momento y luego navegar
      setTimeout(() => {
        setLoading(false);
        navigate('/login', { replace: true });
      }, 2000);
  
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User size={18} className="mr-2 text-blue-600" />
                Nombre completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors
                  ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Juan Pérez"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

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
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone size={18} className="mr-2 text-blue-600" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors
                  ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="+54 11 1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
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
                  <span>Registrando...</span>
                </>
              ) : 'Crear Cuenta'}
            </button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;