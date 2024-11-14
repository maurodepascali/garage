import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import DatePicker from "react-datepicker";
import { sendCancellationEmail } from '../services/emailService';
import { Pencil, Trash2, X, Check } from 'lucide-react'; // Importamos los iconos
import "react-datepicker/dist/react-datepicker.css";
import ConfirmationModal from './ConfirmationModal';

const datePickerCustomStyles = `
  .react-datepicker {
    font-family: system-ui, -apple-system, sans-serif;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .react-datepicker__header {
    background-color: #f3f4f6;
    border-bottom: none;
    padding: 1rem;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }
  .react-datepicker__current-month {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .react-datepicker__day {
    margin: 0.2rem;
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    border-radius: 9999px;
  }
  .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
  }
  .react-datepicker__time-container {
    border-left: 1px solid #e5e7eb;
  }
  .react-datepicker__time-list-item--selected {
    background-color: #3b82f6 !important;
  }
`;

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [newStartDate, setNewStartDate] = useState(null);
  const [newEndDate, setNewEndDate] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = datePickerCustomStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const bookingsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBookings(bookingsList);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error('Error al cargar las reservas');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      await handleCancel(selectedBooking);
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error al cancelar la reserva');
    }
  };
  
  const handleConfirmEdit = async () => {
    if (!selectedBooking) return;
    try {
      setEditingBooking(selectedBooking.id); // Activar el modo de edición
      setNewStartDate(selectedBooking.startTime.toDate());
      setNewEndDate(selectedBooking.endTime.toDate());
      setShowEditModal(false);
    } catch (error) {
      console.error('Error preparing edit:', error);
      toast.error('Error al preparar la edición');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      // Convertir el timestamp de Firestore a Date
      const date = timestamp.toDate();
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Error en fecha';
    }
  };

  const handleCancel = async (booking) => {
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.fromDate(new Date())
      });

      const emailSent = await sendCancellationEmail(booking);

      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === booking.id
            ? { ...b, status: 'cancelled' }
            : b
        )
      );

      if (emailSent) {
        toast.success('Reserva cancelada con éxito');
      } else {
        toast.success('Reserva cancelada pero hubo un problema al enviar la notificación');
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error('Error al cancelar la reserva');
    }
  };

  const handleModify = async (booking) => {
    if (editingBooking === booking.id) {
      if (!newStartDate || !newEndDate) {
        toast.error('Debes seleccionar ambas fechas');
        return;
      }

      if (newStartDate >= newEndDate) {
        toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      try {
        const bookingRef = doc(db, 'bookings', booking.id);
        
        // Crear los timestamps
        const startTimestamp = Timestamp.fromDate(newStartDate);
        const endTimestamp = Timestamp.fromDate(newEndDate);

        await updateDoc(bookingRef, {
          startTime: startTimestamp,
          endTime: endTimestamp,
          modifiedAt: Timestamp.fromDate(new Date())
        });

        setBookings(prevBookings =>
          prevBookings.map(b =>
            b.id === booking.id
              ? {
                  ...b,
                  startTime: startTimestamp,
                  endTime: endTimestamp
                }
              : b
          )
        );

        setEditingBooking(null);
        setNewStartDate(null);
        setNewEndDate(null);
        toast.success('Reserva modificada con éxito');
      } catch (error) {
        console.error("Error modifying booking:", error);
        toast.error('Error al modificar la reserva');
      }
    } else {
      setEditingBooking(booking.id);
      // Convertir los timestamps a Date
      setNewStartDate(booking.startTime.toDate());
      setNewEndDate(booking.endTime.toDate());
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando reservas...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Mis Reservas</h2>
      
      {bookings.length === 0 ? (
        <p className="text-center text-gray-600">No tienes reservas activas</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{booking.garageAddress}</h3>
                  <div className="mt-2 space-y-1 text-gray-600">
                    <p>Tipo: {booking.type === 'hourly' ? 'Por hora' : 
                             booking.type === 'daily' ? 'Por día' : 'Mensual'}</p>
                    <p>Desde: {format(booking.startTime.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                    <p>Hasta: {format(booking.endTime.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                    <p>Estado: {booking.status === 'pending' ? 'Pendiente' :
                               booking.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}</p>
                    <p className="font-semibold text-gray-800">Precio: ${booking.price}</p>
                  </div>
                </div>
                
                {booking.status === 'pending' && (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleEditClick(booking)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Modificar reserva"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleCancelClick(booking)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Cancelar reserva"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              {editingBooking === booking.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha y hora de inicio
                      </label>
                      <DatePicker
                        selected={newStartDate}
                        onChange={setNewStartDate}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={60}
                        dateFormat="dd/MM/yyyy HH:mm"
                        locale={es}
                        minDate={new Date()} // No permitir fechas pasadas
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        calendarClassName="shadow-lg"
                        placeholderText="Selecciona fecha y hora"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha y hora de fin
                      </label>
                      <DatePicker
                        selected={newEndDate}
                        onChange={setNewEndDate}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={60}
                        dateFormat="dd/MM/yyyy HH:mm"
                        locale={es}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => handleModify(booking)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Check size={16} className="mr-2" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingBooking(null);
                        setNewStartDate(null);
                        setNewEndDate(null);
                      }}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X size={16} className="mr-2" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}


            </div>
          ))}
        </div>
      )}

    <ConfirmationModal
      isOpen={showCancelModal}
      title="Cancelar Reserva"
      message="¿Estás seguro que deseas cancelar esta reserva?"
      onConfirm={handleConfirmCancel}
      onCancel={() => setShowCancelModal(false)}
    />

    <ConfirmationModal
  isOpen={showEditModal}
  title="Modificar Reserva"
  message="¿Estás seguro que deseas modificar esta reserva?"
  onConfirm={handleConfirmEdit}
  onCancel={() => {
    setShowEditModal(false);
    setSelectedBooking(null);
  }}
/>
    </div>
  );
};

export default MyBookings;