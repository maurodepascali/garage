import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { Search, Car, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleNavigation = (path) => {
    if (!auth.currentUser) {
      toast.error('Por favor, inicia sesión o regístrate para continuar', {
        duration: 3000,
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '🔒',
      });
      
      // Esperar un momento antes de navegar al login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <main>
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              Encuentra o comparte tu cochera
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              La forma más fácil de encontrar estacionamiento en tu zona
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => handleNavigation('/search')}
                className="w-full sm:w-auto group px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg flex items-center justify-center transition-all"
              >
                <Search size={20} className="mr-2" />
                Buscar Cochera
              </button>

              <button
                onClick={() => handleNavigation('/publish')}
                className="w-full sm:w-auto group px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-lg flex items-center justify-center transition-all"
              >
                <Car size={20} className="mr-2" />
                Publicar mi Cochera
              </button>
            </div>

            {!auth.currentUser && (
              <div className="p-6 rounded-xl">
                <p className="text-gray-700 mb-4">
                  Únete a nuestra comunidad y empieza a gestionar tus espacios de estacionamiento
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mx-auto"
                >
                  Registrate aquí
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;