module.exports = ({ env }) => ({
  email: {
    config: {
      // API HTTP de Resend (puerto 443), no el relay SMTP (puerto 465) —
      // Railway cuelga las conexiones salientes por SMTP durante 30+
      // segundos sin responder (confirmado con curl directo), mientras que
      // la API HTTP funciona igual que cualquier otra llamada saliente del
      // backend (Cloudinary, Anthropic), que nunca ha tenido problema.
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: 'no-reply@mail.medalladeoro.com.mx',
        defaultReplyTo: 'contacto@medalladeoro.com.mx',
      },
    },
  },
  upload: {
    config: {
      provider: '@strapi/provider-upload-cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
