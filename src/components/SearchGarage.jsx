import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Shield, Home, Loader } from 'lucide-react';

const SearchGarage = () => {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGarages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'garages'));
        const garagesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGarages(garagesList);
      } catch (error) {
        console.error("Error fetching garages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarages();
  }, []);

  const handleGarageSelect = (garageId) => {
    navigate(`/garage/${garageId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Buscando cocheras disponibles...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {garages.map(garage => (
          <div 
            key={garage.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-start gap-2 mb-4">
              <MapPin size={20} className="text-blue-600 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {garage.address}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Hora</span>
                  <span className="font-semibold text-gray-900">${garage.pricePerHour}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Estadía</span>
                  <span className="font-semibold text-gray-900">${garage.pricePerDay}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Mensual</span>
                  <span className="font-semibold text-gray-900">${garage.priceMensual}</span>
                </div>
              </div>

              {garage.features && garage.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Características:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {garage.features.map(feature => (
                      <div 
                        key={feature} 
                        className="flex items-center text-sm text-gray-600"
                      >
                        {feature === 'Descubierto' && <Home size={16} className="mr-2" />}
                        {feature === 'Seguridad 24hs' && <Shield size={16} className="mr-2" />}
                        {feature === 'Fija' && <Clock size={16} className="mr-2" />}
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/garage/${garage.id}`)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                Ver Disponibilidad
              </button>
            </div>
          </div>
        ))}
      </div>

      {garages.length === 0 && (
        <div className="text-center py-12">
          <Home size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cocheras disponibles
          </h3>
          <p className="text-gray-600">
            No se encontraron cocheras disponibles en este momento.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchGarage;