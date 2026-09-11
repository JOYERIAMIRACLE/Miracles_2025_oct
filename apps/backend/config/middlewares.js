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
  // strapi::rateLimit no existe en Strapi 5 — fue removido en v5.
  // El rate limit de login está cubierto por loginRateLimitMiddleware en src/index.js.
  // Para rate limit global en Strapi 5 se necesitaría koa-ratelimit directo.
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
