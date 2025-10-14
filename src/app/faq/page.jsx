'use client';
import { useState } from 'react';

const faqs = [
  {
    pregunta: '¿Qué es el Congreso de Tecnología?',
    respuesta: 'Es un evento anual organizado por la facultad para promover la carrera de ingeniería en sistemas entre estudiantes de nivel medio y ofrecer a los alumnos de la facultad una plataforma para participar en talleres, competencias y actividades académicas y recreativas.'
  },
  {
    pregunta: '¿Quiénes pueden participar?',
    respuesta: 'Pueden participar estudiantes externos (de nivel medio) y alumnos internos de la facultad. Los alumnos internos deben registrarse con su correo institucional (@miumg.edu.gt).'
  },
  {
    pregunta: '¿Cómo me inscribo al congreso?',
    respuesta: 'Debes registrarte en la página web completando el formulario de inscripción con tus datos personales. Recibirás un correo de confirmación con tu código QR para el registro de asistencia.'
  },
  {
    pregunta: '¿Cómo me inscribo a talleres y competencias?',
    respuesta: 'Después de registrarte como participante, puedes acceder a la sección de Talleres y Competencias para seleccionar las actividades en las que deseas participar. Cada actividad tiene un cupo limitado.'
  },
  {
    pregunta: '¿Qué es el código QR y para qué sirve?',
    respuesta: 'El código QR es un identificador único que recibes al inscribirte. Lo usarás para registrar tu asistencia al congreso y a las actividades específicas (talleres y competencias). Puedes guardarlo en tu teléfono o imprimirlo.'
  },
  {
    pregunta: '¿Cómo registro mi asistencia?',
    respuesta: 'Al llegar al evento, escanea tu código QR en los puntos de registro. También se registrará tu asistencia a cada taller o competencia en la que participes.'
  },
  {
    pregunta: '¿Recibiré un diploma?',
    respuesta: 'Sí, al finalizar el congreso se generarán diplomas automáticos para los participantes que hayan asistido. También recibirás diplomas específicos por cada taller o competencia en la que hayas participado. Los diplomas se enviarán por correo electrónico y estarán disponibles para descarga en tu perfil.'
  },
  {
    pregunta: '¿Cómo puedo ver los resultados de las competencias?',
    respuesta: 'Los resultados se publican en la sección de Resultados de la página web, donde podrás ver los nombres de los ganadores, fotografías y descripciones de sus proyectos. También hay un histórico de ganadores de años anteriores.'
  },
  {
    pregunta: '¿Hay algún costo por participar?',
    respuesta: 'La participación en el congreso es gratuita. Algunos talleres o competencias específicas podrían tener un costo adicional, lo cual se indicará claramente al momento de la inscripción.'
  },
  {
    pregunta: '¿Qué pasa si no puedo asistir después de inscribirme?',
    respuesta: 'Si no puedes asistir, te recomendamos cancelar tu inscripción para liberar el cupo. Puedes contactar al comité organizador a través del correo de contacto.'
  },
  {
    pregunta: '¿Dónde puedo obtener más información?',
    respuesta: 'Puedes consultar la página principal del congreso donde encontrarás la agenda completa, información sobre ponentes invitados, y detalles sobre la carrera de ingeniería en sistemas. También puedes contactarnos por correo electrónico.'
  }
];

export default function FAQPage() {
  const [abierto, setAbierto] = useState(null);

  const toggle = (idx) => {
    setAbierto(abierto === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Preguntas Frecuentes</h1>
        <p className="text-gray-600">Encuentra respuestas a las dudas más comunes sobre el Congreso de Tecnología</p>
      </header>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow">
            <button
              onClick={() => toggle(idx)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <span className="font-semibold text-lg">{faq.pregunta}</span>
              <span className="text-2xl text-gray-500">{abierto === idx ? '−' : '+'}</span>
            </button>
            {abierto === idx && (
              <div className="px-4 pb-4 text-gray-700">
                {faq.respuesta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">¿Tienes más preguntas?</h2>
        <p className="text-gray-700 mb-4">
                Si no encontraste la respuesta que buscabas, contáctanos por correo electrónico.
              </p>
              <a
                href="mailto:proyectocongresoumg@gmail.com"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contactar
              </a>
      </div>
    </div>
  );
}
