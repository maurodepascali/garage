// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configura el transportador de email (usa tus credenciales)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com',
    pass: 'tu-contraseña-de-app'
  }
});

// Función para enviar email de confirmación
exports.sendBookingConfirmation = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const userEmail = booking.userEmail;

    const mailOptions = {
      from: 'tu-email@gmail.com',
      to: userEmail,
      subject: 'Confirmación de Reserva - ParkShare',
      html: `
        <h2>¡Tu reserva ha sido confirmada!</h2>
        <p>Detalles de la reserva:</p>
        <ul>
          <li>Dirección: ${booking.garageAddress}</li>
          <li>Fecha inicio: ${booking.startTime.toDate().toLocaleString()}</li>
          <li>Fecha fin: ${booking.endTime.toDate().toLocaleString()}</li>
          <li>Tipo: ${booking.type === 'hourly' ? 'Por hora' : booking.type === 'daily' ? 'Por día' : 'Mensual'}</li>
          <li>Precio: $${booking.price}</li>
        </ul>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });

// Función para enviar email de cancelación
exports.sendCancellationEmail = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (oldData.status !== 'cancelled' && newData.status === 'cancelled') {
      const mailOptions = {
        from: 'tu-email@gmail.com',
        to: newData.userEmail,
        subject: 'Reserva Cancelada - ParkShare',
        html: `
          <h2>Tu reserva ha sido cancelada</h2>
          <p>Detalles de la reserva cancelada:</p>
          <ul>
            <li>Dirección: ${newData.garageAddress}</li>
            <li>Fecha inicio: ${newData.startTime.toDate().toLocaleString()}</li>
            <li>Fecha fin: ${newData.endTime.toDate().toLocaleString()}</li>
          </ul>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error('Error sending cancellation email:', error);
      }
    }
  });