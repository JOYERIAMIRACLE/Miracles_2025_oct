module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://richard-avrod.pages.dev',
        'https://miracles-frontend.pages.dev',
        'https://joyeriamiraclesweb.com',
        'https://medalladeoro.com',
        // Dev local
        'http://localhost:3000',
        'http://localhost:1337',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  // Límite global: 300 requests/minuto por IP en toda la API.
  // Protege contra scraping masivo y ataques de fuerza bruta simples.
  {
    name: 'strapi::rateLimit',
    config: {
      enabled:  true,
      interval: 60000,  // ventana de 1 minuto
      max:      300,    // máx requests por IP en esa ventana
      // Respuesta que recibe quien supera el límite
      message: 'Demasiadas solicitudes — espera un momento antes de volver a intentarlo.',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
