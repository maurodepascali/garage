import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast, { Toaster } from 'react-hot-toast';

const ImageUpload = ({ images, onImagesChange }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onImagesChange([...images, { file, previewUrl }]); // Asegúrate de que estás guardando el archivo correctamente
    }
  };

  return (
    <div>
      {images.map((image, index) => (
        <img key={index} src={image.previewUrl} alt={`Image ${index}`} className="w-20 h-20 object-cover" />
      ))}
      <input
        type="file"
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
      />
    </div>
  );
};

const PublishGarage = () => {
  const navigate = useNavigate();
  const [garageData, setGarageData] = useState({
    address: '',
    pricePerHour: '',
    pricePerDay: '',
    priceMensual: '',
    description: '',
    features: [],
    imagenes: [],
    totalSpots: '',
    availability: {
      monday: { active: false, start: '09:00', end: '18:00' },
      tuesday: { active: false, start: '09:00', end: '18:00' },
      wednesday: { active: false, start: '09:00', end: '18:00' },
      thursday: { active: false, start: '09:00', end: '18:00' },
      friday: { active: false, start: '09:00', end: '18:00' }
    }
  });

  const handlePhotoChange = (imagenes) => {
    setGarageData((prev) => ({ ...prev, imagenes })); // Actualiza el estado con las imágenes
  };

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    let validationErrors = {};
    if (!garageData.address) {
      validationErrors.address = 'La dirección es obligatoria.';
    }
    if (!garageData.pricePerHour || garageData.pricePerHour <= 0) {
      validationErrors.pricePerHour = 'El precio por hora debe ser un número positivo.';
    }
    if (!garageData.pricePerDay || garageData.pricePerDay <= 0) {
      validationErrors.pricePerDay = 'El precio por estadía debe ser un número positivo.';
    }
    if (!garageData.priceMensual || garageData.priceMensual <= 0) {
      validationErrors.priceMensual = 'El precio mensual debe ser un número positivo.';
    }
    if (!garageData.totalSpots || garageData.totalSpots <= 0) {
      validationErrors.totalSpots = 'Debe especificar la cantidad de lugares disponibles.';
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0; // Devuelve true si no hay errores
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para publicar una cochera');
      navigate('/login');
      return;
    }

    if (!validateFields()) { // Valida los campos antes de enviar
      return;
    }

    try {
      const storage = getStorage();
      const promises = garageData.imagenes.map(async (imageObj) => {
        // Asegúrate de que estás usando el nombre del archivo
        const storageRef = ref(storage, `garages/${auth.currentUser.uid}/${imageObj.file.name}`);
        await uploadBytes(storageRef, imageObj.file);
        return await getDownloadURL(storageRef); // Obtén la URL de descarga
      });
      const imageUrls = await Promise.all(promises); // Espera que se resuelvan todas las promesas

      // Añade el documento a la colección 'garages'
      const docRef = await addDoc(collection(db, 'garages'), {
        ...garageData,
        ownerId: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email,
        createdAt: new Date().toISOString(),
        status: 'active',
        pricePerHour: Number(garageData.pricePerHour),
        pricePerDay: Number(garageData.pricePerDay),
        priceMensual: Number(garageData.priceMensual),
        totalSpots: Number(garageData.totalSpots),
        imagenes: imageUrls // Guarda las URLs de las imágenes
      });
      
      toast.success('¡Cochera publicada con éxito!')
      navigate('/search'); // Redirige a la búsqueda después de publicar
    } catch (error) {
      toast.error('Error al publicar la cochera: ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Publicar mi cochera</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block mb-1">Dirección</label>
          <input
            type="text"
            value={garageData.address}
            onChange={(e) => setGarageData({ ...garageData, address: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
        </div>

        <div>
          <label className="block mb-1">Precio por hora (ARS)</label>
          <input
            type="number"
            value={garageData.pricePerHour}
            onChange={(e) => setGarageData({ ...garageData, pricePerHour: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          {errors.pricePerHour && <span className="text-red-500 text-sm">{errors.pricePerHour}</span>}
        </div>

        <div>
          <label className="block mb-1">Precio por estadía (ARS)</label>
          <input
            type="number"
            value={garageData.pricePerDay}
            onChange={(e) => setGarageData({ ...garageData, pricePerDay: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          {errors.pricePerDay && <span className="text-red-500 text-sm">{errors.pricePerDay}</span>}
        </div>

        <div>
          <label className="block mb-1">Precio Mensual (ARS)</label>
          <input
            type="number"
            value={garageData.priceMensual}
            onChange={(e) => setGarageData({ ...garageData, priceMensual: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          {errors.priceMensual && <span className="text-red-500 text-sm">{errors.priceMensual}</span>}
        </div>

        <div>
          <label className="block mb-1">Características</label>
          <div className="space-x-2">
            {['Techada', 'Descubierto', 'Seguridad 24hs', 'Fija'].map(feature => (
              <label key={feature} className="inline-flex items-center">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const features = [...garageData.features];
                    if (e.target.checked) {
                      features.push(feature);
                    } else {
                      const index = features.indexOf(feature);
                      features.splice(index, 1);
                    }
                    setGarageData({ ...garageData, features });
                  }}
                  className="mr-1"
                />
                {feature}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1">Cantidad de lugares disponibles</label>
          <input
            type="number"
            value={garageData.totalSpots}
            onChange={(e) => setGarageData({ ...garageData, totalSpots: e.target.value })}
            className="w-full p-2 border rounded"
            min="1"
            required
          />
          {errors.totalSpots && <span className="text-red-500 text-sm">{errors.totalSpots}</span>}
        </div>
        <div>
          <label className="block mb-1">Imágenes</label>
          <ImageUpload images={garageData.imagenes} onImagesChange={handlePhotoChange} />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Publicar Cochera
        </button>
      </form>
    </div>
  );
};

export default PublishGarage;
