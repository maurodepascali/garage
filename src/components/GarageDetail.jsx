import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
import toast from 'react-hot-toast';
import { format, addMonths, isWithinInterval, addHours } from 'date-fns';
import { sendBookingConfirmationEmail } from '../services/emailService';
import { MapPin, Clock, Shield, Home, Sun, Moon, Car, Calendar, CheckCircle } from 'lucide-react';

registerLocale('es', es);

const GarageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reservationType, setReservationType] = useState('hourly');
  const [bookings, setBookings] = useState([]);
  const [availableSpots, setAvailableSpots] = useState(0);
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);

  const timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const calculatePrice = (start, end) => {
      if (!start || !end || !garage) return 0;
      
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);
      
      let hours = endHour - startHour;
      if (hours <= 0) hours += 24;
      
      return hours * garage.pricePerHour;
    };

    const checkHourlyAvailability = (time) => {
      if (!garage || !startDate) return 0;
      
      const selectedDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${time}`);
      
      // Filtrar las reservas activas para esta hora
      const activeBookings = bookings.filter(booking => {
        if (booking.status === 'cancelled') return false;
    
        const bookingStart = booking.startTime.toDate();
        const bookingEnd = booking.endTime.toDate();
        
        // Comprobar si el horario seleccionado está dentro del rango de alguna reserva
        return selectedDateTime >= bookingStart && selectedDateTime < bookingEnd;
      });
    
      // Restar del total de lugares disponibles
      return garage.totalSpots - activeBookings.length;
    };
    
    const checkPeriodAvailability = (start, end) => {
      if (!start || !end || !garage) return 0;
      
      // Convertir las fechas a horas específicas para comparar
      const timeSlots = []; // Array de todas las horas en el rango
      let currentHour = start;
      
      while (currentHour < end) {
        timeSlots.push(format(currentHour, 'HH:00'));
        currentHour = addHours(currentHour, 1);
      }
      
      // Verificar la disponibilidad para cada hora en el rango
      const availabilities = timeSlots.map(time => checkHourlyAvailability(time));
      
      // Retornar la menor disponibilidad encontrada
      return Math.min(...availabilities);
    };

useEffect(() => {
  const fetchGarageAndBookings = async () => {
    try {
      const garageDoc = await getDoc(doc(db, 'garages', id));
      if (garageDoc.exists()) {
        const garageData = garageDoc.data();
        setGarage({ id: garageDoc.id, ...garageData });
        setAvailableSpots(garageData.totalSpots || 0);
      } else {
        toast.error('Cochera no encontrada');
        return;
      }

      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('garageId', '==', id)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsList = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsList);
      } catch (bookingError) {
        console.log("No hay reservas aún:", bookingError);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      toast.error('Error al cargar los datos de la cochera');
    } finally {
      setLoading(false);
    }
  };

  fetchGarageAndBookings();
}, [id]);

  const handleReservation = async () => {
    if (!auth.currentUser) {
      toast.error('Debes iniciar sesión para realizar una reserva');
      navigate('/login');
      return;
    }

    const availability = reservationType === 'hourly'
    ? checkHourlyAvailability(startTime)
    : checkPeriodAvailability(startDate, endDate);

  if (availability <= 0) {
    toast.error('Ya no hay disponibilidad para el horario seleccionado');
    return;
  }

    try {
      let bookingData = {
        garageId: id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type: reservationType,
        status: 'pending',
        garageAddress: garage.address, // Agregamos la dirección para mostrarla en MyBookings
      };

      if (reservationType === 'hourly') {
        if (!startTime || !endTime) {
          toast.error('Debes seleccionar el horario completo');
          return;
        }
        const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`);
      const endDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${endTime}`);


      if (checkHourlyAvailability(startTime) <= 0) {
        toast.error('No hay lugares disponibles para este horario');
        return;
      }

        const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
      const totalPrice = totalHours * garage.pricePerHour;

        bookingData = {
          ...bookingData,
          startTime: Timestamp.fromDate(startDateTime),
          endTime: Timestamp.fromDate(endDateTime),
          price: totalPrice
        };
      } else {
        if (!startDate || !endDate) {
          toast.error('Debes seleccionar las fechas');
          return;
        }

        if (checkPeriodAvailability(startDate, endDate) <= 0) {
          toast.error('No hay lugares disponibles para este período');
          return;
        }

        const price = reservationType === 'daily' 
          ? garage.pricePerDay 
          : garage.priceMensual;

        bookingData = {
          ...bookingData,
          startTime: Timestamp.fromDate(startDate),
          endTime: Timestamp.fromDate(endDate),
          price
        };
      }

      await addDoc(collection(db, 'bookings'), bookingData);
    await sendBookingConfirmationEmail(bookingData);
    toast.success('Reserva realizada con éxito');
    navigate('/bookings');
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error('Error al crear la reserva');
    }
  };

  const getAvailabilityText = (available) => {
    if (available === 0) return "Sin disponibilidad";
    if (available === 1) return "1 lugar disponible";
    return `${available} lugares disponibles`;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!garage) {
    return <div className="text-center py-8">Cochera no encontrada</div>;
  }
  
  const renderTimeSlots = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
      {timeSlots.map(time => {
        const available = checkHourlyAvailability(time);
        return (
          <button
            key={time}
            className={`p-3 rounded-lg text-center transition-all ${
              startTime === time
                ? 'bg-blue-600 text-white shadow-lg'
                : available > 0
                ? 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                : 'bg-red-50 border border-red-200 cursor-not-allowed'
            }`}
            onClick={() => {
              if (available > 0) {
                setStartTime(time);
                const nextHour = timeSlots[timeSlots.indexOf(time) + 1];
                if (nextHour) setEndTime(nextHour);
              }
            }}
            disabled={available <= 0}
          >
            <span className="block font-medium">{time}</span>
            <span className="block text-xs mt-1">
              {available} {available === 1 ? 'lugar' : 'lugares'}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderRangeCalendar = () => (
    <div className="space-y-4">
      <DatePicker
        selected={startDate}
        onChange={(dates) => {
          const [start, end] = dates;
          setStartDate(start);
          setEndDate(end);
        }}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        inline
        monthsShown={2}
        minDate={new Date()}
        maxDate={
          reservationType === 'monthly' 
            ? addMonths(new Date(), 12) 
            : addMonths(new Date(), 3)
        }
        locale="es"
        dateFormat="dd/MM/yyyy"
        className="w-full"
      />

      {startDate && endDate && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-lg mb-3">Resumen de la reserva</h4>
          <div className="space-y-2">
            <p><span className="font-medium">Desde:</span> {format(startDate, 'dd/MM/yyyy')}</p>
            <p><span className="font-medium">Hasta:</span> {format(endDate, 'dd/MM/yyyy')}</p>
            <p className="mt-3">
              <span className="font-medium">Lugares disponibles:</span>{' '}
              {checkPeriodAvailability(startDate, endDate)}
            </p>
            <p className="text-lg font-medium mt-3">
              Precio total: ${
                reservationType === 'daily'
                  ? garage.pricePerDay * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                  : garage.priceMensual
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <MapPin size={24} className="text-blue-600 mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{garage?.address}</h1>
            <p className="text-gray-500 mt-1">{garage?.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Columna izquierda */}
          <div className="space-y-6">
            {/* Precios */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Car className="text-blue-600" />
                Precios
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <Clock size={20} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Por hora</p>
                  <p className="text-xl font-bold text-gray-900">${garage?.pricePerHour}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <Sun size={20} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Estadía</p>
                  <p className="text-xl font-bold text-gray-900">${garage?.pricePerDay}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <Calendar size={20} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Mensual</p>
                  <p className="text-xl font-bold text-gray-900">${garage?.priceMensual}</p>
                </div>
              </div>
            </div>

            {/* Características */}
            {garage?.features && garage.features.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="text-blue-600" />
                  Características
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {garage.features.map(feature => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 bg-white p-3 rounded-lg"
                    >
                      {feature === 'Descubierto' && <Home className="text-blue-600" />}
                      {feature === 'Seguridad 24hs' && <Shield className="text-blue-600" />}
                      {feature === 'Fija' && <Clock className="text-blue-600" />}
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Fotos */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Fotos</h3>
            <div className="grid grid-cols-2 gap-4">
              {garage?.imagenes?.map((imagen, index) => (
                <img
                  key={index}
                  src={imagen}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                />
              ))}
              {(!garage?.imagenes || garage.imagenes.length === 0) && (
                <div className="col-span-2 bg-white rounded-lg p-8 text-center">
                  <Car size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No hay fotos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de reserva */}
        <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Calendar className="text-blue-600" />
            Realizar una reserva
          </h2>

          {/* Tipo de reserva */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-gray-100 rounded-lg">
              {[
                { id: 'hourly', label: 'Por hora', icon: Clock },
                { id: 'daily', label: 'Estadía', icon: Sun },
                { id: 'monthly', label: 'Mensual', icon: Calendar }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setReservationType(type.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg transition-all
                    ${reservationType === type.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <type.icon size={18} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex flex-col items-center">
                {reservationType === 'hourly' ? (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="text-blue-600" size={20} />
                      <h3 className="text-lg font-medium">
                        {reservationType === 'hourly' ? 'Selecciona una fecha' : 'Selecciona el rango'}
                      </h3>
                    </div>
                    <div className="flex justify-center pb-20">
                    <div style={{ transform: "scale(1.2)", transformOrigin: "top" }}>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                locale="es"
                minDate={new Date()}
                inline
                className="border rounded-lg bg-white"
              />
            </div>
                  </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-4">Selecciona el rango de fechas</h3>
                    <div className="flex justify-center">
                    <DatePicker
                      selected={startDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      inline
                      monthsShown={2}
                      minDate={new Date()}
                      maxDate={
                        reservationType === 'monthly' 
                          ? addMonths(new Date(), 12) 
                          : addMonths(new Date(), 3)
                      }
                      locale="es"
                      className="w-full border rounded-lg bg-white"
                    />
                    </div>
                  </>
                )}
              </div>

              {/* Columna derecha: Grid de horarios (solo para reservas por hora) */}
              {reservationType === 'hourly' && (
                <div className="border-t p-6">
                  <div className="flex items-center gap-2 mb-6">
                  <Clock className="text-blue-600" size={20} />
                  <h3 className="text-lg font-medium">Horarios disponibles</h3>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {timeSlots.map(time => {
                      const available = checkHourlyAvailability(time);
                      const isSelected = time === startTime;
                      const isInRange = startTime && endTime && 
                        time >= startTime && time <= endTime;

                      return (
                        <button
                          key={time}
                          onClick={() => {
                            if (available > 0) {
                              if (!startTime) {
                                setStartTime(time);
                                const nextHour = timeSlots[timeSlots.indexOf(time) + 1];
                                if (nextHour) setEndTime(nextHour);
                              } else if (!endTime && time > startTime) {
                                setEndTime(time);
                              } else {
                                setStartTime(time);
                                setEndTime('');
                              }
                            }
                          }}
                          disabled={available === 0}
                          className={`p-4 rounded-xl text-center transition-all relative ${
                            isInRange
                              ? 'bg-blue-100 border-2 border-blue-400 shadow-md'
                              : isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : available > 0
                              ? 'bg-white hover:bg-blue-50 border border-gray-200'
                              : 'bg-red-50 border border-red-200 text-red-500'
                          }`}
                        >
                          <span className="text-sm font-medium">{time}</span>
                          <span className={`
                            block text-xs mt-1
                            ${available > 0 ? 'text-green-600' : 'text-red-500'}
                          `}>
                            {getAvailabilityText(available)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {((reservationType === 'hourly' && startTime && endTime) ||
    (reservationType !== 'hourly' && startDate && endDate)) && (
    <div className="mt-8 bg-blue-50 rounded-xl p-6">
      <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <CheckCircle className="text-blue-600" />
        Resumen de la reserva
      </h4>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <span className="text-sm text-gray-600">Fecha inicio</span>
          <p className="font-medium">{format(startDate, 'dd/MM/yyyy')}</p>
          {startTime && <p className="text-sm text-blue-600">{startTime}hs</p>}
        </div>

        <div className="bg-white rounded-lg p-4">
          <span className="text-sm text-gray-600">Fecha fin</span>
          <p className="font-medium">{format(endDate || startDate, 'dd/MM/yyyy')}</p>
          {endTime && <p className="text-sm text-blue-600">{endTime}hs</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/20 pt-6 mt-6">
        <p className="text-lg font-medium">Total a pagar</p>
        <p className="text-2xl font-bold text-blue-600">
          ${reservationType === 'hourly' 
            ? calculatePrice(startTime, endTime)
            : reservationType === 'daily'
              ? garage.pricePerDay * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
              : garage.priceMensual
          }
        </p>
      </div>
      
      <div className="flex justify-center mt-6">
        <button
          onClick={handleReservation}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          Confirmar reserva
        </button>
      </div>
    </div>
  )}
          </div>
        </div>




      </div>
    </div>
  );
};

export default GarageDetail;