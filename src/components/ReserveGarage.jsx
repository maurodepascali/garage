import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReserveGarage = () => {
  const { garageId } = useParams();
  const [selectedDates, setSelectedDates] = useState([]);

  // Aquí puedes obtener la información de la cochera seleccionada a partir del garageId
  const garage = {
    address: '123 Main St',
    pricePerHour: 10,
    pricePerDay: 80,
    pricePerMonth: 2000,
    features: ['Techada', 'Seguridad 24hs'],
    availability: {
      '2023-04-15': { activa: true, inicio: '09:00', fin: '18:00' },
      '2023-04-16': { activa: true, inicio: '09:00', fin: '18:00' },
      '2023-04-17': { activa: true, inicio: '09:00', fin: '18:00' }
    },
    ownerPhone: '555-1234'
  };

  const handleDateChange = (dates) => {
    setSelectedDates(dates);
  };

  const handleReserve = () => {
    // Aquí irá la lógica para confirmar la reserva
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Reservar cochera</h2>
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-2">{garage.address}</h3>
        <p className="text-gray-600">Precio por hora: ${garage.pricePerHour}</p>
        <p className="text-gray-600">Precio por día: ${garage.pricePerDay}</p>
        <p className="text-gray-600">Precio mensual: ${garage.pricePerMonth}</p>
        {garage.features && garage.features.length > 0 && (
          <div className="mt-2">
            <p className="font-medium">Características:</p>
            <ul className="list-disc list-inside">
              {garage.features.map(feature => (
                <li key={feature} className="text-sm text-gray-600">{feature}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2">
          <p className="font-medium">Disponibilidad:</p>
          {Object.keys(garage.availability).map(date => (
            <p key={date} className="text-sm text-gray-600">{date}</p>
          ))}
        </div>
        <div className="mt-4">
          <label className="block mb-1">Selecciona las fechas</label>
          <DatePicker
            selected={selectedDates}
            onChange={handleDateChange}
            selectsRange
            startDate={selectedDates[0]}
            endDate={selectedDates[1]}
            withPortal
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          onClick={handleReserve}
        >
          Reservar
        </button>
      </div>
    </div>
  );
};

export default ReserveGarage;