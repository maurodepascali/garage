// src/services/emailService.js
import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_o5u4rlg";
const PUBLIC_KEY = "8_xgh_HmywuXOC9NC";
const TEMPLATE_IDS = {
  confirmation: 'template_4y3gbja',
  cancellation: 'template_q2yb9uk'
};

// Inicializar EmailJS inmediatamente
emailjs.init(PUBLIC_KEY);

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    console.log('Preparando envío de email de confirmación:', booking);

    // Verificar que todos los campos necesarios existan
    if (!booking.userEmail || !booking.garageAddress || !booking.startTime || !booking.endTime) {
      console.error('Faltan campos requeridos:', booking);
      return false;
    }

    const templateParams = {
      to_name: booking.userEmail.split('@')[0],
      to_email: booking.userEmail,
      garage_address: booking.garageAddress,
      start_time: booking.startTime.toDate().toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      end_time: booking.endTime.toDate().toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      booking_type: booking.type === 'hourly' ? 'Por hora' :
                   booking.type === 'daily' ? 'Por día' : 'Mensual',
      price: `$${booking.price}`,
      from_name: "ParkShare",
      reply_to: "noreply@parkshare.com"
    };

    console.log('Parámetros de la plantilla:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_IDS.confirmation,
      templateParams
    );

    console.log('Respuesta del servidor de email:', response);
    return true;
  } catch (error) {
    console.error('Error detallado al enviar email de confirmación:', error);
    return false;
  }
};

export const sendCancellationEmail = async (booking) => {
  try {
    console.log('Preparando envío de email de cancelación:', booking);

    if (!booking.userEmail || !booking.garageAddress || !booking.startTime || !booking.endTime) {
      console.error('Faltan campos requeridos para cancelación:', booking);
      return false;
    }

    const templateParams = {
      to_name: booking.userEmail.split('@')[0],
      to_email: booking.userEmail,
      garage_address: booking.garageAddress,
      start_time: booking.startTime.toDate().toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      end_time: booking.endTime.toDate().toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      from_name: "ParkShare",
      reply_to: "noreply@parkshare.com"
    };

    console.log('Parámetros de la plantilla de cancelación:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_IDS.cancellation,
      templateParams
    );

    console.log('Respuesta del servidor de email (cancelación):', response);
    return true;
  } catch (error) {
    console.error('Error detallado al enviar email de cancelación:', error);
    return false;
  }
};

// Función de utilidad para verificar la configuración
export const testEmailConfiguration = async () => {
  try {
    const testParams = {
      to_name: "Test User",
      to_email: "test@example.com",
      from_name: "ParkShare",
      reply_to: "noreply@parkshare.com",
      subject: "Test Email Configuration",
      message: "This is a test email"
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_IDS.confirmation,
      testParams
    );

    console.log('Test de configuración exitoso:', response);
    return true;
  } catch (error) {
    console.error('Error en test de configuración:', error);
    return false;
  }
};