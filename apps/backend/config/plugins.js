module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        // Resend vía su relay SMTP (usuario siempre literal "resend", la
        // identidad viene de la API key como password) — mismo proveedor
        // @strapi/provider-email-nodemailer ya instalado, sin paquete nuevo.
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: env('RESEND_API_KEY'),
        },
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
