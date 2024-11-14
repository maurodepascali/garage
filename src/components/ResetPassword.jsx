import React, { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // Obtener el oobCode de la URL
  const location = useLocation();
  const oobCode = new URLSearchParams(location.search).get('oobCode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        toast.error('Link inválido o expirado');
        navigate('/login');
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
      } catch (error) {
        toast.error('El link ha expirado. Solicita uno nuevo.');
        navigate('/forgot-password');
      }
    };

    verifyCode();
  }, [oobCode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        toast.success('¡Contraseña actualizada correctamente!', {
          duration: 4000,
          style: {
            minWidth: '300px',
            backgroundColor: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: 'bold',
          }
        });
        setTimeout(() => {
            navigate('/login');
          }, 2000);
    } catch (error) {
        toast.error('Error al actualizar la contraseña', {
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
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8 px-4">
    <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          success: {
            style: {
              background: '#10B981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
          },
          error: {
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
          },
        }}
      />
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lock size={18} className="mr-2 text-blue-600" />
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lock size={18} className="mr-2 text-blue-600" />
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;