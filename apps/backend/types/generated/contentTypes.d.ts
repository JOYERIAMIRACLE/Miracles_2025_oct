import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAboutAbout extends Struct.SingleTypeSchema {
  collectionName: 'abouts';
  info: {
    description: 'Write about yourself and the content you create';
    displayName: 'About';
    pluralName: 'abouts';
    singularName: 'about';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<
      ['shared.media', 'shared.quote', 'shared.rich-text', 'shared.slider']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about.about'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiActivoActivo extends Struct.CollectionTypeSchema {
  collectionName: 'activos';
  info: {
    displayName: 'activo';
    pluralName: 'activos';
    singularName: 'activo';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categoria: Schema.Attribute.Enumeration<
      ['efectivo', 'inversi\u00F3n', 'bien_inmueble', 'veh\u00EDculo', 'otros']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::activo.activo'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    valor: Schema.Attribute.Decimal;
  };
}

export interface ApiAnuncioAnuncio extends Struct.CollectionTypeSchema {
  collectionName: 'anuncios';
  info: {
    displayName: 'Anuncio';
    pluralName: 'anuncios';
    singularName: 'anuncio';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clics: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    conversiones: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<
      ['activo', 'pausado', 'finalizado', 'borrador']
    > &
      Schema.Attribute.DefaultTo<'borrador'>;
    fecha_fin: Schema.Attribute.Date;
    fecha_inicio: Schema.Attribute.Date;
    gastado: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    impresiones: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::anuncio.anuncio'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    objetivo: Schema.Attribute.String;
    plataforma: Schema.Attribute.Enumeration<
      ['Instagram', 'Facebook', 'Google', 'TikTok', 'Pinterest', 'Otro']
    > &
      Schema.Attribute.Required;
    presupuesto: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      ['imagen', 'video', 'carousel', 'stories', 'otro']
    > &
      Schema.Attribute.DefaultTo<'imagen'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAvisoAviso extends Struct.CollectionTypeSchema {
  collectionName: 'avisos';
  info: {
    displayName: 'Portal - Aviso';
    pluralName: 'avisos';
    singularName: 'aviso';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    area: Schema.Attribute.String & Schema.Attribute.Required;
    autor: Schema.Attribute.String;
    color: Schema.Attribute.Enumeration<
      ['violet', 'emerald', 'blue', 'orange', 'red', 'amber']
    > &
      Schema.Attribute.DefaultTo<'violet'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    desc: Schema.Attribute.Text & Schema.Attribute.Required;
    emoji: Schema.Attribute.String & Schema.Attribute.DefaultTo<'\uD83D\uDCCB'>;
    imagen: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::aviso.aviso'> &
      Schema.Attribute.Private;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vigencia: Schema.Attribute.Date;
  };
}

export interface ApiBlogPostBlogPost extends Struct.CollectionTypeSchema {
  collectionName: 'blog_posts';
  info: {
    displayName: 'BlogPost';
    pluralName: 'blog-posts';
    singularName: 'blog-post';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categoria_blog: Schema.Attribute.Enumeration<
      [
        'tips-de-joyeria',
        'cuidado-de-joyas',
        'tendencias',
        'guias-de-regalo',
        'noticias',
      ]
    >;
    contenido: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fecha_publicacion: Schema.Attribute.Date;
    imagen_portada: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::blog-post.blog-post'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    resumen: Schema.Attribute.Text;
    seo_descripcion: Schema.Attribute.Text;
    seo_keywords: Schema.Attribute.String;
    seo_titulo: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'titulo'> & Schema.Attribute.Required;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBoxscoreSemanaBoxscoreSemana
  extends Struct.CollectionTypeSchema {
  collectionName: 'boxscore_semanas';
  info: {
    displayName: 'BoxScore Semana';
    pluralName: 'boxscore-semanas';
    singularName: 'boxscore-semana';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    anio: Schema.Attribute.Integer & Schema.Attribute.Required;
    clicsCYA: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clicsIC: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clicsSEM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    conversionesCYA: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    conversionesIC: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    conversionesSEM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    impresionesCorp: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    impresionesCYA: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    impresionesIC: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    impresionesSEM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    impresionesStore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::boxscore-semana.boxscore-semana'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    semana: Schema.Attribute.Integer & Schema.Attribute.Required;
    tasaApertura: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    tasaClics: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    tasaRechazos: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    traficoDirectoCorp: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    traficoDirectoStore: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    traficoGeneral: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    traficoOrganicoCorp: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    traficoOrganicoStore: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    traficoPagaSEM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampanaMetaCampanaMeta extends Struct.SingleTypeSchema {
  collectionName: 'campana_meta';
  info: {
    displayName: 'Campa\u00F1a Meta 110';
    pluralName: 'campana-metas';
    singularName: 'campana-meta';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avance: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<82687>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    etiqueta: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'\u00A1Jugemos al 110!'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campana-meta.campana-meta'
    > &
      Schema.Attribute.Private;
    meta: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<110000>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampanaCampana extends Struct.CollectionTypeSchema {
  collectionName: 'campanas';
  info: {
    displayName: 'campana';
    pluralName: 'campanas';
    singularName: 'campana';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    anio: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<2025>;
    atributos: Schema.Attribute.Text;
    categoria: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    etapas: Schema.Attribute.String;
    keyword: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campana.campana'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.Enumeration<
      [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ]
    > &
      Schema.Attribute.Required;
    multimedia: Schema.Attribute.Media<'images' | 'videos' | 'files'>;
    notas: Schema.Attribute.Text;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publicacion: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    semana1Archivo: Schema.Attribute.String;
    semana1Fecha: Schema.Attribute.Date;
    semana1Partes: Schema.Attribute.Text;
    semana1Titulo: Schema.Attribute.String;
    semana2Archivo: Schema.Attribute.String;
    semana2Fecha: Schema.Attribute.Date;
    semana2Partes: Schema.Attribute.Text;
    semana2Titulo: Schema.Attribute.String;
    semana3Archivo: Schema.Attribute.String;
    semana3Fecha: Schema.Attribute.Date;
    semana3Partes: Schema.Attribute.Text;
    semana3Titulo: Schema.Attribute.String;
    semana4Archivo: Schema.Attribute.String;
    semana4Fecha: Schema.Attribute.Date;
    semana4Partes: Schema.Attribute.Text;
    semana4Titulo: Schema.Attribute.String;
    semana5Archivo: Schema.Attribute.String;
    semana5Fecha: Schema.Attribute.Date;
    semana5Partes: Schema.Attribute.Text;
    semana5Titulo: Schema.Attribute.String;
    tipo: Schema.Attribute.Enumeration<['completa', 'titulos_extra']> &
      Schema.Attribute.DefaultTo<'completa'>;
    unidadNegocio: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCatalogoJoyeriaCatalogoJoyeria
  extends Struct.SingleTypeSchema {
  collectionName: 'catalogo_joyeria';
  info: {
    description: '\u00C1rbol jer\u00E1rquico del cat\u00E1logo de joyer\u00EDa: Material \u2192 Categor\u00EDa \u2192 Producto';
    displayName: 'Cat\u00E1logo Joyer\u00EDa';
    pluralName: 'catalogo-joyerias';
    singularName: 'catalogo-joyeria';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    arbol: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::catalogo-joyeria.catalogo-joyeria'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    skus: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCategoriaPagoCategoriaPago
  extends Struct.CollectionTypeSchema {
  collectionName: 'categoria_pagos';
  info: {
    displayName: 'Categoria Pago';
    pluralName: 'categoria-pagos';
    singularName: 'categoria-pago';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::categoria-pago.categoria-pago'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCategoriaCategoria extends Struct.CollectionTypeSchema {
  collectionName: 'categorias';
  info: {
    displayName: 'categoria';
    pluralName: 'categorias';
    singularName: 'categoria';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activa: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grupo: Schema.Attribute.Enumeration<
      ['necesidad', 'prescindible', 'ahorro', 'ingreso']
    >;
    icono: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::categoria.categoria'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<['ingreso', 'gasto']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCdlMetricaCdlMetrica extends Struct.CollectionTypeSchema {
  collectionName: 'cdl_metricas';
  info: {
    displayName: 'CDL M\u00E9tricas';
    pluralName: 'cdl-metricas';
    singularName: 'cdl-metrica';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    anio: Schema.Attribute.Integer & Schema.Attribute.Required;
    cantidadCampanas: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clientesNuevos: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    contenidosNancy: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    contenidosRichard: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    costoAdquisicion: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cdl-metrica.cdl-metrica'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.String & Schema.Attribute.Required;
    nuevosLeads: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    porcentajeRetencion: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    puntajeEncuestaNancy: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    puntajeEncuestaRichard: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    semana: Schema.Attribute.Integer;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventasCuentasNuevas: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiCentroCostoCentroCosto extends Struct.CollectionTypeSchema {
  collectionName: 'centro_costos';
  info: {
    displayName: 'centro-costo';
    pluralName: 'centro-costos';
    singularName: 'centro-costo';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    codigo: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::centro-costo.centro-costo'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    transacciones: Schema.Attribute.Relation<
      'oneToMany',
      'api::transaccion.transaccion'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCentroVentaCentroVenta extends Struct.CollectionTypeSchema {
  collectionName: 'centro_ventas';
  info: {
    displayName: 'centro-venta';
    pluralName: 'centro-ventas';
    singularName: 'centro-venta';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    codigo: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::centro-venta.centro-venta'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventayCentrodeventas: Schema.Attribute.Relation<
      'oneToMany',
      'api::venta.venta'
    >;
  };
}

export interface ApiClienteTrabajoClienteTrabajo
  extends Struct.CollectionTypeSchema {
  collectionName: 'cliente_trabajos';
  info: {
    displayName: 'Cliente Trabajo';
    pluralName: 'cliente-trabajos';
    singularName: 'cliente-trabajo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    empresa: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cliente-trabajo.cliente-trabajo'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    pagos: Schema.Attribute.Relation<
      'oneToMany',
      'api::pago-trabajo.pago-trabajo'
    >;
    proyectos: Schema.Attribute.Relation<'oneToMany', 'api::proyecto.proyecto'>;
    publishedAt: Schema.Attribute.DateTime;
    reuniones: Schema.Attribute.Relation<'oneToMany', 'api::reunion.reunion'>;
    telefono: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiClienteCliente extends Struct.CollectionTypeSchema {
  collectionName: 'clientes';
  info: {
    displayName: 'Cliente';
    pluralName: 'clientes';
    singularName: 'cliente';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    calificado: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    campanaOrigen: Schema.Attribute.String;
    canalContacto: Schema.Attribute.String;
    cotizaciones: Schema.Attribute.Relation<
      'oneToMany',
      'api::cotizacion.cotizacion'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    direccion: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    Estado: Schema.Attribute.Enumeration<['Activo', 'Inactivo']>;
    estadoCivil: Schema.Attribute.Enumeration<
      [
        'Soltero(a)',
        'En una relaci\u00F3n',
        'Comprometido(a)',
        'Casado(a)',
        'Otro',
      ]
    >;
    fechaCalificado: Schema.Attribute.DateTime;
    fechaEntrega: Schema.Attribute.DateTime;
    fechaLead: Schema.Attribute.DateTime;
    fechaNacimiento: Schema.Attribute.Date;
    fechaOferta: Schema.Attribute.DateTime;
    fechaPedido: Schema.Attribute.DateTime;
    fechaRechazada: Schema.Attribute.DateTime;
    Funnel: Schema.Attribute.Enumeration<
      ['Lead', 'Oferta', 'Pedido', 'Entrega', 'Rechazada']
    >;
    leads: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cliente.cliente'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    ocasionFrecuente: Schema.Attribute.String;
    origenContacto: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    redesSociales: Schema.Attribute.String;
    segmento: Schema.Attribute.Enumeration<
      ['Pareja', 'Matrimonio', 'Familiar', 'Personalizado']
    >;
    sexo: Schema.Attribute.Enumeration<
      ['Masculino', 'Femenino', 'Otro', 'Sin especificar']
    >;
    tallaAnillo: Schema.Attribute.String;
    telefono: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventas: Schema.Attribute.Relation<'oneToMany', 'api::venta.venta'>;
  };
}

export interface ApiCompraMaterialLineaCompraMaterialLinea
  extends Struct.CollectionTypeSchema {
  collectionName: 'compra_material_lineas';
  info: {
    displayName: 'L\u00EDnea de Compra de Material';
    pluralName: 'compra-material-lineas';
    singularName: 'compra-material-linea';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    compra: Schema.Attribute.Relation<
      'manyToOne',
      'api::compra-material.compra-material'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    gramos: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::compra-material-linea.compra-material-linea'
    > &
      Schema.Attribute.Private;
    material: Schema.Attribute.Relation<'manyToOne', 'api::material.material'>;
    precioPorGramo: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    total: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCompraMaterialCompraMaterial
  extends Struct.CollectionTypeSchema {
  collectionName: 'compras_material';
  info: {
    displayName: 'Compra de Materia Prima';
    pluralName: 'compras-material';
    singularName: 'compra-material';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<['borrador', 'recibida']> &
      Schema.Attribute.DefaultTo<'borrador'>;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    lineas: Schema.Attribute.Relation<
      'oneToMany',
      'api::compra-material-linea.compra-material-linea'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::compra-material.compra-material'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    numero: Schema.Attribute.String;
    proveedor: Schema.Attribute.Relation<
      'manyToOne',
      'api::proveedor.proveedor'
    >;
    publishedAt: Schema.Attribute.DateTime;
    transaccion: Schema.Attribute.Relation<
      'oneToOne',
      'api::transaccion.transaccion'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCotizacionCotizacion extends Struct.CollectionTypeSchema {
  collectionName: 'cotizaciones';
  info: {
    displayName: 'Cotizaci\u00F3n';
    pluralName: 'cotizaciones';
    singularName: 'cotizacion';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cliente: Schema.Attribute.Relation<'manyToOne', 'api::cliente.cliente'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    direccionEnvio: Schema.Attribute.JSON;
    estado: Schema.Attribute.Enumeration<
      ['Borrador', 'Enviada', 'Aceptada', 'Rechazada', 'Convertida']
    > &
      Schema.Attribute.DefaultTo<'Borrador'>;
    fecha: Schema.Attribute.DateTime;
    items: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cotizacion.cotizacion'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    numero: Schema.Attribute.String;
    precioEnvio: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    total: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validoHasta: Schema.Attribute.Date;
    ventaGenerada: Schema.Attribute.Relation<'oneToOne', 'api::venta.venta'>;
  };
}

export interface ApiCuentaCuenta extends Struct.CollectionTypeSchema {
  collectionName: 'cuentas';
  info: {
    displayName: 'cuenta';
    pluralName: 'cuentas';
    singularName: 'cuenta';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    activa: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']>;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    evento_calendarios: Schema.Attribute.Relation<
      'oneToMany',
      'api::evento-calendario.evento-calendario'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cuenta.cuenta'
    > &
      Schema.Attribute.Private;
    metaDeCuenta: Schema.Attribute.Decimal;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    proposito: Schema.Attribute.Enumeration<
      ['Operativa', 'Ahorro', 'Inversi\u00F3n', 'Apartado', 'Presupuesto 1']
    >;
    publishedAt: Schema.Attribute.DateTime;
    saldoActual: Schema.Attribute.Decimal;
    saldoBanco: Schema.Attribute.Decimal;
    tipo: Schema.Attribute.Enumeration<['Efectivo', 'Cr\u00E9dito', 'Debito']>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventaCuenta: Schema.Attribute.Relation<'oneToMany', 'api::venta.venta'>;
  };
}

export interface ApiDocumentoLegalDocumentoLegal
  extends Struct.CollectionTypeSchema {
  collectionName: 'documentos_legales';
  info: {
    displayName: 'Portal - Documento Legal';
    pluralName: 'documentos-legales';
    singularName: 'documento-legal';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    archivos: Schema.Attribute.Media<'files' | 'images', true>;
    caracteristicas: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::documento-legal.documento-legal'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    subtitulo: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEcosistemaMktEcosistemaMkt
  extends Struct.CollectionTypeSchema {
  collectionName: 'ecosistema_mkts';
  info: {
    displayName: 'Ecosistema Mkt';
    pluralName: 'ecosistema-mkts';
    singularName: 'ecosistema-mkt';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    anio: Schema.Attribute.Integer & Schema.Attribute.Required;
    canal: Schema.Attribute.String;
    clics: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    compras: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    contactosNuevos: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    impresiones: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    leads: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ecosistema-mkt.ecosistema-mkt'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.String & Schema.Attribute.Required;
    montoCompras: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visitas: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiEjercicioEjercicio extends Struct.CollectionTypeSchema {
  collectionName: 'ejercicios';
  info: {
    displayName: 'Ejercicio';
    pluralName: 'ejercicios';
    singularName: 'ejercicio';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    diaSemana: Schema.Attribute.Enumeration<
      ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ejercicio.ejercicio'
    > &
      Schema.Attribute.Private;
    planEjercicios: Schema.Attribute.Relation<
      'oneToMany',
      'api::plan-ejercicio.plan-ejercicio'
    >;
    publishedAt: Schema.Attribute.DateTime;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEnvioEnvio extends Struct.CollectionTypeSchema {
  collectionName: 'envios';
  info: {
    displayName: 'Env\u00EDo';
    pluralName: 'envios';
    singularName: 'envio';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cliente: Schema.Attribute.String;
    concepto: Schema.Attribute.String;
    costo_envio: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<
      [
        'pendiente',
        'preparando',
        'enviado',
        'en_transito',
        'entregado',
        'devuelto',
        'cancelado',
      ]
    > &
      Schema.Attribute.DefaultTo<'pendiente'>;
    fecha_envio: Schema.Attribute.Date;
    fecha_estimada: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::envio.envio'> &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    numero_guia: Schema.Attribute.String;
    paqueteria: Schema.Attribute.Enumeration<
      ['fedex', 'dhl', 'estafeta', 'ups', 'correos_mex', 'otro']
    > &
      Schema.Attribute.DefaultTo<'otro'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    venta: Schema.Attribute.Relation<'manyToOne', 'api::venta.venta'>;
  };
}

export interface ApiEventoCalendarioEventoCalendario
  extends Struct.CollectionTypeSchema {
  collectionName: 'evento_calendarios';
  info: {
    displayName: 'evento-calendario';
    pluralName: 'evento-calendarios';
    singularName: 'evento-calendario';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categoria: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuenta: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    descripcion: Schema.Attribute.Text;
    fecha: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::evento-calendario.evento-calendario'
    > &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    recurrente: Schema.Attribute.Boolean;
    tipo: Schema.Attribute.Enumeration<['ingreso', 'pago']>;
    tipoPago: Schema.Attribute.Enumeration<
      ['efectivo', 'debito', 'bonos', 'credito', 'ahorros', 'inversion']
    >;
    titulo: Schema.Attribute.String;
    txDocumentId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEventoSocialEventoSocial
  extends Struct.CollectionTypeSchema {
  collectionName: 'evento_socials';
  info: {
    displayName: 'Evento Social';
    pluralName: 'evento-socials';
    singularName: 'evento-social';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<['pendiente', 'realizado']> &
      Schema.Attribute.DefaultTo<'realizado'>;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::evento-social.evento-social'
    > &
      Schema.Attribute.Private;
    lugar: Schema.Attribute.String;
    notas: Schema.Attribute.Text;
    personas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      ['familiar', 'amigos', 'pareja', 'trabajo', 'otro']
    > &
      Schema.Attribute.DefaultTo<'amigos'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGlobalGlobal extends Struct.SingleTypeSchema {
  collectionName: 'globals';
  info: {
    description: 'Define global settings';
    displayName: 'Global';
    pluralName: 'globals';
    singularName: 'global';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultSeo: Schema.Attribute.Component<'shared.seo', false>;
    favicon: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::global.global'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    siteDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    siteName: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHistorialTareaHistorialTarea
  extends Struct.CollectionTypeSchema {
  collectionName: 'historial_tareas';
  info: {
    displayName: 'Historial Tarea';
    pluralName: 'historial-tareas';
    singularName: 'historial-tarea';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estadoAnterior: Schema.Attribute.String;
    estadoNuevo: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::historial-tarea.historial-tarea'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    tareaDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiIdentidadEmpresaIdentidadEmpresa
  extends Struct.CollectionTypeSchema {
  collectionName: 'identidad_empresas';
  info: {
    displayName: 'Identidad Empresa';
    pluralName: 'identidad-empresas';
    singularName: 'identidad-empresa';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    colores: Schema.Attribute.Text;
    correo: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion_campanas: Schema.Attribute.Text;
    descripcion_conoce: Schema.Attribute.Text;
    descripcion_contactos: Schema.Attribute.Text;
    descripcion_depto_administracion: Schema.Attribute.Text;
    descripcion_depto_cadena: Schema.Attribute.Text;
    descripcion_depto_comercial: Schema.Attribute.Text;
    descripcion_depto_marketing: Schema.Attribute.Text;
    descripcion_depto_mision: Schema.Attribute.Text;
    descripcion_depto_rh: Schema.Attribute.Text;
    descripcion_tareas: Schema.Attribute.Text;
    direccion: Schema.Attribute.Text;
    foto_equipo: Schema.Attribute.Media<'images'>;
    icono_principio_1: Schema.Attribute.Media<'images'>;
    icono_principio_2: Schema.Attribute.Media<'images'>;
    icono_principio_3: Schema.Attribute.Media<'images'>;
    icono_principio_4: Schema.Attribute.Media<'images'>;
    icono_principio_5: Schema.Attribute.Media<'images'>;
    icono_valor_1: Schema.Attribute.Media<'images'>;
    icono_valor_2: Schema.Attribute.Media<'images'>;
    icono_valor_3: Schema.Attribute.Media<'images'>;
    icono_valor_4: Schema.Attribute.Media<'images'>;
    icono_valor_5: Schema.Attribute.Media<'images'>;
    imagen_mision: Schema.Attribute.Media<'images'>;
    imagen_vision: Schema.Attribute.Media<'images'>;
    img_orientador_1: Schema.Attribute.Media<'images'>;
    img_orientador_2: Schema.Attribute.Media<'images'>;
    img_orientador_3: Schema.Attribute.Media<'images'>;
    img_orientador_4: Schema.Attribute.Media<'images'>;
    img_valores_logo: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::identidad-empresa.identidad-empresa'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    mision: Schema.Attribute.Text;
    nombre: Schema.Attribute.String;
    notas: Schema.Attribute.Text;
    portada_campanas: Schema.Attribute.Media<'images'>;
    portada_campanas_original: Schema.Attribute.Media<'images'>;
    portada_conoce: Schema.Attribute.Media<'images'>;
    portada_conoce_original: Schema.Attribute.Media<'images'>;
    portada_contactos: Schema.Attribute.Media<'images'>;
    portada_contactos_original: Schema.Attribute.Media<'images'>;
    portada_depto_administracion: Schema.Attribute.Media<'images'>;
    portada_depto_administracion_original: Schema.Attribute.Media<'images'>;
    portada_depto_cadena: Schema.Attribute.Media<'images'>;
    portada_depto_cadena_original: Schema.Attribute.Media<'images'>;
    portada_depto_comercial: Schema.Attribute.Media<'images'>;
    portada_depto_comercial_original: Schema.Attribute.Media<'images'>;
    portada_depto_marketing: Schema.Attribute.Media<'images'>;
    portada_depto_marketing_original: Schema.Attribute.Media<'images'>;
    portada_depto_mision: Schema.Attribute.Media<'images'>;
    portada_depto_mision_original: Schema.Attribute.Media<'images'>;
    portada_depto_rh: Schema.Attribute.Media<'images'>;
    portada_depto_rh_original: Schema.Attribute.Media<'images'>;
    portada_principios: Schema.Attribute.Media<'images'>;
    portada_tareas: Schema.Attribute.Media<'images'>;
    portada_tareas_original: Schema.Attribute.Media<'images'>;
    publishedAt: Schema.Attribute.DateTime;
    redesSociales: Schema.Attribute.Text;
    sitioWeb: Schema.Attribute.String;
    slogan: Schema.Attribute.String;
    telefono: Schema.Attribute.String;
    tipografia: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    valores: Schema.Attribute.Text;
    vision: Schema.Attribute.Text;
  };
}

export interface ApiIngredienteDespensaIngredienteDespensa
  extends Struct.CollectionTypeSchema {
  collectionName: 'ingrediente_despensas';
  info: {
    description: 'Stock de ingredientes en la despensa';
    displayName: 'Ingrediente Despensa';
    pluralName: 'ingrediente-despensas';
    singularName: 'ingrediente-despensa';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cantidad: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    cantidadMinima: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    categoria: Schema.Attribute.Enumeration<
      [
        'verduras',
        'frutas',
        'carnes',
        'l\u00E1cteos',
        'granos',
        'especias',
        'aceites',
        'bebidas',
        'enlatados',
        'otros',
      ]
    > &
      Schema.Attribute.DefaultTo<'otros'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    enProceso: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ingrediente-despensa.ingrediente-despensa'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    unidad: Schema.Attribute.Enumeration<
      ['pz', 'kg', 'g', 'L', 'ml', 'taza', 'bolsa', 'lata', 'caja', 'botella']
    > &
      Schema.Attribute.DefaultTo<'pz'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiItemCompraItemCompra extends Struct.CollectionTypeSchema {
  collectionName: 'item_compras';
  info: {
    description: 'Lista de compras del supermercado';
    displayName: 'Item Compra';
    pluralName: 'item-compras';
    singularName: 'item-compra';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    auto: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cantidadSugerida: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    categoria: Schema.Attribute.String & Schema.Attribute.DefaultTo<'otros'>;
    completado: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ingredienteRef: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::item-compra.item-compra'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    unidad: Schema.Attribute.String & Schema.Attribute.DefaultTo<'pz'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLeadLead extends Struct.CollectionTypeSchema {
  collectionName: 'leads';
  info: {
    displayName: 'Lead';
    pluralName: 'leads';
    singularName: 'lead';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    calificado: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    campanaOrigen: Schema.Attribute.String;
    canalContacto: Schema.Attribute.String;
    cliente: Schema.Attribute.Relation<'manyToOne', 'api::cliente.cliente'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fechaCalificado: Schema.Attribute.DateTime;
    fechaEntrega: Schema.Attribute.DateTime;
    fechaLead: Schema.Attribute.DateTime;
    fechaOferta: Schema.Attribute.DateTime;
    fechaPedido: Schema.Attribute.DateTime;
    fechaRechazada: Schema.Attribute.DateTime;
    Funnel: Schema.Attribute.Enumeration<
      ['Lead', 'Oferta', 'Pedido', 'Entrega', 'Rechazada']
    > &
      Schema.Attribute.DefaultTo<'Lead'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'> &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    numero: Schema.Attribute.String;
    origenApp: Schema.Attribute.Enumeration<['manual', 'tienda']> &
      Schema.Attribute.DefaultTo<'manual'>;
    origenContacto: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    segmento: Schema.Attribute.Enumeration<
      ['Pareja', 'Matrimonio', 'Familiar', 'Personalizado']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMapaIdentidadMapaIdentidad
  extends Struct.CollectionTypeSchema {
  collectionName: 'mapa_identidades';
  info: {
    displayName: 'Mapa Identidad';
    pluralName: 'mapa-identidades';
    singularName: 'mapa-identidad';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    color: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    enlace: Schema.Attribute.String;
    icono: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::mapa-identidad.mapa-identidad'
    > &
      Schema.Attribute.Private;
    moduleId: Schema.Attribute.String;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    placeholder: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    sector: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    x: Schema.Attribute.Integer & Schema.Attribute.Required;
    y: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

export interface ApiMaterialDigitalMaterialDigital
  extends Struct.CollectionTypeSchema {
  collectionName: 'material_digitals';
  info: {
    displayName: 'Material Digital';
    pluralName: 'material-digitals';
    singularName: 'material-digital';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa', 'personal']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    categoria: Schema.Attribute.Enumeration<
      [
        'BRANDING',
        'HERRAMIENTAS_VENTAS',
        'FORMATOS_INTERNOS',
        'INSTALACIONES_VEHICULOS',
        'COLABORADOR',
        'DOCUMENTOS_COLABORADOR',
        'EVENTOS_PROYECTOS',
        'ASSETS',
        'LINKS_UTILIDAD',
        'BASES_DATOS',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    evento: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::material-digital.material-digital'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    subcategoria: Schema.Attribute.String & Schema.Attribute.Required;
    tipo: Schema.Attribute.Enumeration<
      ['pdf', 'imagen', 'presentacion', 'video', 'documento', 'link']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'link'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiMaterialTrabajoMaterialTrabajo
  extends Struct.CollectionTypeSchema {
  collectionName: 'material_trabajos';
  info: {
    displayName: 'Material de Trabajo';
    pluralName: 'material-trabajos';
    singularName: 'material-trabajo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    cantidad: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    categoria: Schema.Attribute.Enumeration<
      ['promocional', 'folleto', 'camisa', 'otro']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'otro'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::material-trabajo.material-trabajo'
    > &
      Schema.Attribute.Private;
    minimo: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMaterialMaterial extends Struct.CollectionTypeSchema {
  collectionName: 'materiales';
  info: {
    displayName: 'Material';
    pluralName: 'materiales';
    singularName: 'material';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::material.material'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    notas: Schema.Attribute.Text;
    precioReferenciaGramo: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    stockGramos: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    unidadMedida: Schema.Attribute.Enumeration<['gramo']> &
      Schema.Attribute.DefaultTo<'gramo'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMetaAhorroMetaAhorro extends Struct.CollectionTypeSchema {
  collectionName: 'meta_ahorros';
  info: {
    displayName: 'meta-ahorro';
    pluralName: 'meta-ahorros';
    singularName: 'meta-ahorro';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    categoria: Schema.Attribute.Enumeration<
      ['emergencia', 'viaje', 'equipo', 'inversion', 'educacion', 'otros']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    fecha_objetivo: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::meta-ahorro.meta-ahorro'
    > &
      Schema.Attribute.Private;
    monto_actual: Schema.Attribute.Decimal;
    monto_meta: Schema.Attribute.Decimal;
    nombre: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMetricaCorporalMetricaCorporal
  extends Struct.CollectionTypeSchema {
  collectionName: 'metrica_corporals';
  info: {
    displayName: 'M\u00E9trica Corporal';
    pluralName: 'metrica-corporals';
    singularName: 'metrica-corporal';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    grasa: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::metrica-corporal.metrica-corporal'
    > &
      Schema.Attribute.Private;
    medidas: Schema.Attribute.JSON;
    musculo: Schema.Attribute.Decimal;
    notas: Schema.Attribute.Text;
    peso: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMovimientoMaterialMovimientoMaterial
  extends Struct.CollectionTypeSchema {
  collectionName: 'movimientos_material';
  info: {
    displayName: 'Movimiento de Material';
    pluralName: 'movimientos-material';
    singularName: 'movimiento-material';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    compraLinea: Schema.Attribute.Relation<
      'oneToOne',
      'api::compra-material-linea.compra-material-linea'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fecha: Schema.Attribute.DateTime & Schema.Attribute.Required;
    gramos: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::movimiento-material.movimiento-material'
    > &
      Schema.Attribute.Private;
    material: Schema.Attribute.Relation<'manyToOne', 'api::material.material'>;
    notas: Schema.Attribute.Text;
    producto: Schema.Attribute.Relation<'manyToOne', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<['entrada', 'salida']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNotaMejoraNotaMejora extends Struct.CollectionTypeSchema {
  collectionName: 'notas_mejora';
  info: {
    displayName: 'Nota de Mejora';
    pluralName: 'notas-mejora';
    singularName: 'nota-mejora';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    autor_nombre: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<['pendiente', 'resuelta']> &
      Schema.Attribute.DefaultTo<'pendiente'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::nota-mejora.nota-mejora'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    respuesta: Schema.Attribute.Text;
    ruta: Schema.Attribute.String & Schema.Attribute.Required;
    texto: Schema.Attribute.Text & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    x: Schema.Attribute.Decimal & Schema.Attribute.Required;
    y: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface ApiOrdenCompraOrdenCompra extends Struct.CollectionTypeSchema {
  collectionName: 'ordenes_compra';
  info: {
    displayName: 'Orden de Compra';
    pluralName: 'ordenes-compra';
    singularName: 'orden-compra';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<
      ['borrador', 'enviada', 'recibida_parcial', 'recibida', 'cancelada']
    > &
      Schema.Attribute.DefaultTo<'borrador'>;
    fecha: Schema.Attribute.Date;
    fechaEntregaEstimada: Schema.Attribute.Date;
    lineas: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::orden-compra.orden-compra'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    numero: Schema.Attribute.String;
    proveedor: Schema.Attribute.Relation<
      'manyToOne',
      'api::proveedor.proveedor'
    >;
    publishedAt: Schema.Attribute.DateTime;
    totalEstimado: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPagoProgramadoPagoProgramado
  extends Struct.CollectionTypeSchema {
  collectionName: 'pago_programados';
  info: {
    displayName: 'Pago Programado';
    pluralName: 'pago-programados';
    singularName: 'pago-programado';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'empresa'>;
    categoria: Schema.Attribute.String;
    concepto: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuenta: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    estado: Schema.Attribute.Enumeration<['pendiente', 'pagado', 'cancelado']> &
      Schema.Attribute.DefaultTo<'pendiente'>;
    fecha: Schema.Attribute.Date;
    frecuencia: Schema.Attribute.Enumeration<
      ['mensual', 'trimestral', 'anual', 'unico']
    > &
      Schema.Attribute.DefaultTo<'unico'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pago-programado.pago-programado'
    > &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    recurrente: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tipo: Schema.Attribute.Enumeration<['pago', 'cobro']> &
      Schema.Attribute.DefaultTo<'pago'>;
    transaccion: Schema.Attribute.Relation<
      'oneToOne',
      'api::transaccion.transaccion'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPagoTrabajoPagoTrabajo extends Struct.CollectionTypeSchema {
  collectionName: 'pago_trabajos';
  info: {
    displayName: 'Pago Trabajo';
    pluralName: 'pago-trabajos';
    singularName: 'pago-trabajo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    categoriaPago: Schema.Attribute.Relation<
      'manyToOne',
      'api::categoria-pago.categoria-pago'
    >;
    clienteTrabajo: Schema.Attribute.Relation<
      'manyToOne',
      'api::cliente-trabajo.cliente-trabajo'
    >;
    concepto: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<['pendiente', 'pagado', 'parcial']> &
      Schema.Attribute.DefaultTo<'pendiente'>;
    fecha: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pago-trabajo.pago-trabajo'
    > &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    proveedor: Schema.Attribute.String;
    proyecto: Schema.Attribute.Relation<'manyToOne', 'api::proyecto.proyecto'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPartidaPresupuestoPartidaPresupuesto
  extends Struct.CollectionTypeSchema {
  collectionName: 'partida_presupuestos';
  info: {
    displayName: 'partida-presupuesto';
    pluralName: 'partida-presupuestos';
    singularName: 'partida-presupuesto';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']>;
    categoria: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    frecuencia: Schema.Attribute.Enumeration<
      ['diario', 'semanal', 'quincenal', 'mensual', 'anual']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::partida-presupuesto.partida-presupuesto'
    > &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      ['necesidad', 'gastos prescindibles', 'ahorro', 'ingreso']
    >;
    tipoPago: Schema.Attribute.Enumeration<
      ['efectivo', 'TDC', 'apartado', 'transferencia', 'bonos', 'debito']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPasivoPasivo extends Struct.CollectionTypeSchema {
  collectionName: 'pasivos';
  info: {
    displayName: 'pasivo';
    pluralName: 'pasivos';
    singularName: 'pasivo';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categoria: Schema.Attribute.Enumeration<
      [
        'tdc',
        'credito_personal',
        'hipoteca',
        'automotriz',
        'educativo',
        'otros',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String;
    dia_corte: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pasivo.pasivo'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    saldo: Schema.Attribute.Decimal;
    tasa_interes: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPersonaSocialPersonaSocial
  extends Struct.CollectionTypeSchema {
  collectionName: 'persona_socials';
  info: {
    displayName: 'Persona Social';
    pluralName: 'persona-socials';
    singularName: 'persona-social';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cumpleaños: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::persona-social.persona-social'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    relacion: Schema.Attribute.Enumeration<
      ['familia', 'amigo', 'pareja', 'compa\u00F1ero', 'conocido', 'otro']
    > &
      Schema.Attribute.DefaultTo<'amigo'>;
    telefono: Schema.Attribute.String;
    ultimaVez: Schema.Attribute.Date;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPlanComidaPlanComida extends Struct.CollectionTypeSchema {
  collectionName: 'plan_comidas';
  info: {
    displayName: 'Plan de Comida';
    pluralName: 'plan-comidas';
    singularName: 'plan-comida';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    diaSemana: Schema.Attribute.Enumeration<
      ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    > &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::plan-comida.plan-comida'
    > &
      Schema.Attribute.Private;
    momento: Schema.Attribute.Enumeration<['desayuno', 'comida', 'cena']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'comida'>;
    publishedAt: Schema.Attribute.DateTime;
    receta: Schema.Attribute.Relation<'manyToOne', 'api::receta.receta'>;
    semanaInicio: Schema.Attribute.Date & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPlanEjercicioPlanEjercicio
  extends Struct.CollectionTypeSchema {
  collectionName: 'plan_ejercicios';
  info: {
    displayName: 'Plan de Ejercicio';
    pluralName: 'plan-ejercicios';
    singularName: 'plan-ejercicio';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    diaSemana: Schema.Attribute.Enumeration<
      ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    > &
      Schema.Attribute.Required;
    ejercicio: Schema.Attribute.Relation<
      'manyToOne',
      'api::ejercicio.ejercicio'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::plan-ejercicio.plan-ejercicio'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    semanaInicio: Schema.Attribute.Date & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPrestamoOtorgadoPrestamoOtorgado
  extends Struct.CollectionTypeSchema {
  collectionName: 'prestamo_otorgados';
  info: {
    displayName: 'prestamo-otorgado';
    pluralName: 'prestamo-otorgados';
    singularName: 'prestamo-otorgado';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    beneficiario: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<['activo', 'liquidado', 'vencido']>;
    fecha_inicio: Schema.Attribute.Date;
    fecha_vencimiento: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::prestamo-otorgado.prestamo-otorgado'
    > &
      Schema.Attribute.Private;
    monto_original: Schema.Attribute.Decimal;
    notas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    saldo_pendiente: Schema.Attribute.Decimal;
    tasa_interes: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProcesoTareaProcesoTarea
  extends Struct.CollectionTypeSchema {
  collectionName: 'proceso_tareas';
  info: {
    displayName: 'Tarea - Proceso';
    pluralName: 'proceso-tareas';
    singularName: 'proceso-tarea';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['personal', 'trabajo', 'empresa']> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::proceso-tarea.proceso-tarea'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProductCategoryProductCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'product_categories';
  info: {
    displayName: 'ProductCategory';
    pluralName: 'product-categories';
    singularName: 'product-category';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::product-category.product-category'
    > &
      Schema.Attribute.Private;
    MainImage: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    NombreCategoria: Schema.Attribute.String;
    products: Schema.Attribute.Relation<'oneToMany', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'NombreCategoria'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProductProduct extends Struct.CollectionTypeSchema {
  collectionName: 'products';
  info: {
    displayName: 'Product';
    pluralName: 'products';
    singularName: 'product';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    atributos: Schema.Attribute.Component<'joyeria.atributos-joya', false>;
    categoria: Schema.Attribute.Relation<
      'manyToOne',
      'api::product-category.product-category'
    >;
    categoriaJoya: Schema.Attribute.Enumeration<
      [
        'Anillos',
        'Cadenas',
        'Esclavas',
        'Dijes',
        'Broqueles',
        'Aretes',
        'Pulsos',
        'Rosarios',
        'Argollas',
      ]
    >;
    contenidoo: Schema.Attribute.RichText;
    costo: Schema.Attribute.Decimal;
    costoManoObra: Schema.Attribute.Decimal;
    costoProduccion: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    figura: Schema.Attribute.String;
    imagenes: Schema.Attribute.Media<'images', true>;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::product.product'
    > &
      Schema.Attribute.Private;
    material: Schema.Attribute.Enumeration<['producto', 'servicio']> &
      Schema.Attribute.DefaultTo<'producto'>;
    materialInsumo: Schema.Attribute.Relation<
      'manyToOne',
      'api::material.material'
    >;
    materialProducto: Schema.Attribute.Enumeration<['Oro 10k', 'Plata 925']>;
    nombreProducto: Schema.Attribute.String & Schema.Attribute.Required;
    pesoGramos: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    puntoVenta: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sku: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'nombreProducto'>;
    stock: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    talla: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPropuestaConcursoPropuestaConcurso
  extends Struct.CollectionTypeSchema {
  collectionName: 'propuesta_concursos';
  info: {
    displayName: 'Propuesta Concurso';
    pluralName: 'propuesta-concursos';
    singularName: 'propuesta-concurso';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    integrantes: Schema.Attribute.Text & Schema.Attribute.Required;
    link_archivo: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::propuesta-concurso.propuesta-concurso'
    > &
      Schema.Attribute.Private;
    nombre_equipo: Schema.Attribute.String & Schema.Attribute.Required;
    objetivo: Schema.Attribute.Text & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProveedorProveedor extends Struct.CollectionTypeSchema {
  collectionName: 'proveedores';
  info: {
    displayName: 'Proveedor';
    pluralName: 'proveedores';
    singularName: 'proveedor';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    contacto: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    direccion: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::proveedor.proveedor'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    ordenes: Schema.Attribute.Relation<
      'oneToMany',
      'api::orden-compra.orden-compra'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rfc: Schema.Attribute.String;
    telefono: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProyectoProyecto extends Struct.CollectionTypeSchema {
  collectionName: 'proyectos';
  info: {
    displayName: 'Proyecto';
    pluralName: 'proyectos';
    singularName: 'proyecto';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clienteTrabajo: Schema.Attribute.Relation<
      'manyToOne',
      'api::cliente-trabajo.cliente-trabajo'
    >;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<
      ['activo', 'pausado', 'completado', 'cancelado']
    > &
      Schema.Attribute.DefaultTo<'activo'>;
    fechaFin: Schema.Attribute.Date;
    fechaInicio: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::proyecto.proyecto'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    pagos: Schema.Attribute.Relation<
      'oneToMany',
      'api::pago-trabajo.pago-trabajo'
    >;
    presupuesto: Schema.Attribute.Decimal;
    prioridad: Schema.Attribute.Enumeration<['baja', 'media', 'alta']> &
      Schema.Attribute.DefaultTo<'media'>;
    publishedAt: Schema.Attribute.DateTime;
    reuniones: Schema.Attribute.Relation<'oneToMany', 'api::reunion.reunion'>;
    tareas: Schema.Attribute.Relation<'oneToMany', 'api::tarea.tarea'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRecetaReceta extends Struct.CollectionTypeSchema {
  collectionName: 'recetas';
  info: {
    description: 'Grimorio de recetas de cocina';
    displayName: 'Receta';
    pluralName: 'recetas';
    singularName: 'receta';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    categoria: Schema.Attribute.Enumeration<
      ['desayuno', 'comida', 'cena', 'snack', 'postre']
    > &
      Schema.Attribute.DefaultTo<'comida'>;
    categorias: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    dificultad: Schema.Attribute.Enumeration<
      ['f\u00E1cil', 'media', 'dif\u00EDcil']
    > &
      Schema.Attribute.DefaultTo<'f\u00E1cil'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::receta.receta'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    planComidas: Schema.Attribute.Relation<
      'oneToMany',
      'api::plan-comida.plan-comida'
    >;
    publishedAt: Schema.Attribute.DateTime;
    tiempoPrep: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<30>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videoUrl: Schema.Attribute.String;
  };
}

export interface ApiRecursoCategoriaRecursoCategoria
  extends Struct.CollectionTypeSchema {
  collectionName: 'recurso_categorias';
  info: {
    displayName: 'Portal - Recurso Categoria';
    pluralName: 'recurso-categorias';
    singularName: 'recurso-categoria';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recurso-categoria.recurso-categoria'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    seccion: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRecursoRecurso extends Struct.CollectionTypeSchema {
  collectionName: 'recursos';
  info: {
    displayName: 'Portal - Recurso Descargable';
    pluralName: 'recursos';
    singularName: 'recurso';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    archivo: Schema.Attribute.Media<'files' | 'images'> &
      Schema.Attribute.Required;
    categoria: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    fecha_lanzamiento: Schema.Attribute.Date;
    grupo: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recurso.recurso'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    rol_autor: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    seccion: Schema.Attribute.String & Schema.Attribute.Required;
    tipo: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    variante: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface ApiRegistroMensualRegistroMensual
  extends Struct.CollectionTypeSchema {
  collectionName: 'registro_mensuals';
  info: {
    displayName: 'registro-mensual';
    pluralName: 'registro-mensuals';
    singularName: 'registro-mensual';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    anio: Schema.Attribute.Integer;
    categoria: Schema.Attribute.Enumeration<
      [
        'vivienda',
        'alimentaci\u00F3n',
        'transporte',
        'servicios',
        'gastos_personales',
        'entretenimiento',
        'salud',
        'ropa',
        'educaci\u00F3n',
        'ahorro',
        'inversi\u00F3n',
        'ingreso',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::registro-mensual.registro-mensual'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    monto: Schema.Attribute.Decimal;
    notas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      ['ingreso_variable', 'gasto_extra', 'ahorro_real']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReunionReunion extends Struct.CollectionTypeSchema {
  collectionName: 'reuniones';
  info: {
    displayName: 'Reuni\u00F3n';
    pluralName: 'reuniones';
    singularName: 'reunion';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    acuerdos: Schema.Attribute.Text;
    clienteTrabajo: Schema.Attribute.Relation<
      'manyToOne',
      'api::cliente-trabajo.cliente-trabajo'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fecha: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reunion.reunion'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    participantes: Schema.Attribute.String;
    proyecto: Schema.Attribute.Relation<'manyToOne', 'api::proyecto.proyecto'>;
    publishedAt: Schema.Attribute.DateTime;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRhItemRhItem extends Struct.CollectionTypeSchema {
  collectionName: 'rh_items';
  info: {
    displayName: 'Portal RH - Prestacion/Politica/Emergencia';
    pluralName: 'rh-items';
    singularName: 'rh-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    archivos: Schema.Attribute.Media<'files' | 'images', true>;
    caracteristicas: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::rh-item.rh-item'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    subtitulo: Schema.Attribute.String;
    tipo: Schema.Attribute.Enumeration<
      ['prestacion', 'politica', 'emergencia']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRutinaRutina extends Struct.CollectionTypeSchema {
  collectionName: 'rutinas';
  info: {
    displayName: 'Rutina';
    pluralName: 'rutinas';
    singularName: 'rutina';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activa: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    diasSemana: Schema.Attribute.String;
    ejercicios: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::rutina.rutina'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    sesiones: Schema.Attribute.Relation<
      'oneToMany',
      'api::sesion-gym.sesion-gym'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiServicioVehiculoServicioVehiculo
  extends Struct.CollectionTypeSchema {
  collectionName: 'servicio_vehiculos';
  info: {
    displayName: 'Servicio Veh\u00EDculo';
    pluralName: 'servicio-vehiculos';
    singularName: 'servicio-vehiculo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    costo: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    km: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::servicio-vehiculo.servicio-vehiculo'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.String;
    proximaFecha: Schema.Attribute.Date;
    proximoKm: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      [
        'lavado',
        'aceite',
        'afinaci\u00F3n',
        'llantas',
        'frenos',
        'verificaci\u00F3n',
        'gasolina',
        'seguro',
        'otro',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vehiculoDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiSesionGymSesionGym extends Struct.CollectionTypeSchema {
  collectionName: 'sesion_gyms';
  info: {
    displayName: 'Sesi\u00F3n Gym';
    pluralName: 'sesion-gyms';
    singularName: 'sesion-gym';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    duracion: Schema.Attribute.Integer;
    ejerciciosRealizados: Schema.Attribute.JSON;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sesion-gym.sesion-gym'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    rutina: Schema.Attribute.Relation<'manyToOne', 'api::rutina.rutina'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSitioWebMiraclesSitioWebMiracles
  extends Struct.SingleTypeSchema {
  collectionName: 'sitio_web_miracles';
  info: {
    description: '\u00C1rbol de arquitectura del sitio web de Joyer\u00EDa Miracles';
    displayName: 'Sitio Web Miracles';
    pluralName: 'sitio-webs-miracles';
    singularName: 'sitio-web-miracles';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    arbol: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sitio-web-miracles.sitio-web-miracles'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSitioWebSitioWeb extends Struct.SingleTypeSchema {
  collectionName: 'sitio_webs';
  info: {
    description: '\u00C1rbol de arquitectura del sitio web';
    displayName: 'Sitio Web';
    pluralName: 'sitio-webs';
    singularName: 'sitio-web';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    arbol: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sitio-web.sitio-web'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSkuOpcionSkuOpcion extends Struct.CollectionTypeSchema {
  collectionName: 'sku_opciones';
  info: {
    displayName: 'SKU Opci\u00F3n';
    pluralName: 'sku-opciones';
    singularName: 'sku-opcion';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    categoria: Schema.Attribute.Enumeration<
      ['material', 'tipo', 'estilo', 'talla', 'extra', 'piedra']
    > &
      Schema.Attribute.Required;
    code: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sku-opcion.sku-opcion'
    > &
      Schema.Attribute.Private;
    meta: Schema.Attribute.JSON;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    parentCode: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSnapshotCuentaSnapshotCuenta
  extends Struct.CollectionTypeSchema {
  collectionName: 'snapshot_cuentas';
  info: {
    displayName: 'snapshot-cuenta';
    pluralName: 'snapshot-cuentas';
    singularName: 'snapshot-cuenta';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuentaDocId: Schema.Attribute.String & Schema.Attribute.Required;
    cuentaNombre: Schema.Attribute.String & Schema.Attribute.Required;
    cuentaProposito: Schema.Attribute.String;
    cuentaTipo: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::snapshot-cuenta.snapshot-cuenta'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    saldoBanco: Schema.Attribute.Decimal;
    saldoSistema: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSnapshotMesSnapshotMes extends Struct.CollectionTypeSchema {
  collectionName: 'snapshot_mes';
  info: {
    displayName: 'snapshot-mes';
    pluralName: 'snapshot-mes-list';
    singularName: 'snapshot-mes';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ahorroAcumulado: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    ahorroReal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    apartadosSaldo: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deudaTotal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    egresoPresupuestado: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    flujoNeto: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    gastoReal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    ingresoPresupuestado: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    ingresoReal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    liquidezTotal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::snapshot-mes.snapshot-mes'
    > &
      Schema.Attribute.Private;
    mes: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    necesidadesReal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    operativaSaldo: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    prescindiblesReal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTareaTarea extends Struct.CollectionTypeSchema {
  collectionName: 'tareas';
  info: {
    displayName: 'tarea';
    pluralName: 'tareas';
    singularName: 'tarea';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['personal', 'trabajo', 'empresa']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'personal'>;
    area: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<
      ['sin_iniciar', 'en_progreso', 'en_pausa', 'completada']
    > &
      Schema.Attribute.DefaultTo<'sin_iniciar'>;
    esTicket: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    etiqueta: Schema.Attribute.String;
    fechaCompletada: Schema.Attribute.DateTime;
    fechaInicio: Schema.Attribute.Date;
    fechaVencimiento: Schema.Attribute.Date;
    links: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tarea.tarea'> &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    prioridad: Schema.Attribute.Enumeration<
      ['baja', 'media', 'alta', 'urgente']
    > &
      Schema.Attribute.DefaultTo<'media'>;
    progreso: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    proyecto: Schema.Attribute.Relation<'manyToOne', 'api::proyecto.proyecto'>;
    publishedAt: Schema.Attribute.DateTime;
    responsable: Schema.Attribute.String;
    ticket: Schema.Attribute.Relation<'manyToOne', 'api::ticket.ticket'>;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTicketTicket extends Struct.CollectionTypeSchema {
  collectionName: 'tickets';
  info: {
    displayName: 'ticket';
    pluralName: 'tickets';
    singularName: 'ticket';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<
      ['nuevo', 'en_revision', 'en_progreso', 'entregado', 'cerrado']
    > &
      Schema.Attribute.DefaultTo<'nuevo'>;
    estimacion: Schema.Attribute.Decimal;
    fechaCierre: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ticket.ticket'
    > &
      Schema.Attribute.Private;
    notas: Schema.Attribute.Text;
    prioridad: Schema.Attribute.Enumeration<
      ['baja', 'media', 'alta', 'urgente']
    > &
      Schema.Attribute.DefaultTo<'media'>;
    publishedAt: Schema.Attribute.DateTime;
    responsable: Schema.Attribute.String;
    solicitante: Schema.Attribute.String;
    tareas: Schema.Attribute.Relation<'oneToMany', 'api::tarea.tarea'>;
    tiempoReal: Schema.Attribute.Decimal;
    tipo: Schema.Attribute.Enumeration<
      ['Dise\u00F1o', 'Landing', 'Campa\u00F1a', 'Contenido', 'Soporte', 'Otro']
    > &
      Schema.Attribute.DefaultTo<'Otro'>;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTransaccionTransaccion extends Struct.CollectionTypeSchema {
  collectionName: 'transaccions';
  info: {
    displayName: 'Transaccion';
    pluralName: 'transaccions';
    singularName: 'transaccion';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    ambito: Schema.Attribute.Enumeration<['trabajo', 'empresa']> &
      Schema.Attribute.DefaultTo<'trabajo'>;
    categoria: Schema.Attribute.String;
    centro_costo: Schema.Attribute.Relation<
      'manyToOne',
      'api::centro-costo.centro-costo'
    >;
    cliente: Schema.Attribute.Relation<'manyToOne', 'api::cliente.cliente'>;
    clienteDocumentId: Schema.Attribute.String;
    comprobante: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuentaDestino: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    cuentaOrigen: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    factura: Schema.Attribute.String;
    fecha: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::transaccion.transaccion'
    > &
      Schema.Attribute.Private;
    metodoPago: Schema.Attribute.Enumeration<
      ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']
    >;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    proveedor: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    referencia: Schema.Attribute.String;
    tipo: Schema.Attribute.Enumeration<['ingreso', 'gasto', 'transferencia']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventaOrigen: Schema.Attribute.Relation<'manyToOne', 'api::venta.venta'>;
    ventaQueLoGenero: Schema.Attribute.Relation<'oneToOne', 'api::venta.venta'>;
  };
}

export interface ApiVehiculoVehiculo extends Struct.CollectionTypeSchema {
  collectionName: 'vehiculos';
  info: {
    displayName: 'Veh\u00EDculo';
    pluralName: 'vehiculos';
    singularName: 'vehiculo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    año: Schema.Attribute.Integer;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    kmActuales: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vehiculo.vehiculo'
    > &
      Schema.Attribute.Private;
    marca: Schema.Attribute.String;
    modelo: Schema.Attribute.String;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    placas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiVentaLineaVentaLinea extends Struct.CollectionTypeSchema {
  collectionName: 'venta_lineas';
  info: {
    displayName: 'L\u00EDnea de Venta';
    pluralName: 'venta-lineas';
    singularName: 'venta-linea';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cantidad: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::venta-linea.venta-linea'
    > &
      Schema.Attribute.Private;
    precioUnitario: Schema.Attribute.Decimal & Schema.Attribute.Required;
    producto: Schema.Attribute.Relation<'manyToOne', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
    subtotal: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    venta: Schema.Attribute.Relation<'manyToOne', 'api::venta.venta'>;
  };
}

export interface ApiVentaVenta extends Struct.CollectionTypeSchema {
  collectionName: 'ventas';
  info: {
    displayName: 'venta';
    pluralName: 'ventas';
    singularName: 'venta';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cantidad: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    centro_venta: Schema.Attribute.Relation<
      'manyToOne',
      'api::centro-venta.centro-venta'
    >;
    cliente: Schema.Attribute.Relation<'manyToOne', 'api::cliente.cliente'>;
    comprobantePago: Schema.Attribute.Media<'images' | 'files'>;
    concepto: Schema.Attribute.String & Schema.Attribute.Required;
    cotizacionOrigen: Schema.Attribute.Relation<
      'oneToOne',
      'api::cotizacion.cotizacion'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuenta: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    envios: Schema.Attribute.Relation<'oneToMany', 'api::envio.envio'>;
    estado: Schema.Attribute.Enumeration<
      ['Cotizado', 'Pagado', 'Preparando', 'Enviado', 'Entregado', 'Cancelado']
    > &
      Schema.Attribute.DefaultTo<'Cotizado'>;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    lineas: Schema.Attribute.Relation<
      'oneToMany',
      'api::venta-linea.venta-linea'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::venta.venta'> &
      Schema.Attribute.Private;
    metodoPago: Schema.Attribute.Enumeration<
      ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']
    >;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notas: Schema.Attribute.String;
    numero: Schema.Attribute.String;
    pagos: Schema.Attribute.Relation<
      'oneToMany',
      'api::transaccion.transaccion'
    >;
    producto: Schema.Attribute.Relation<'manyToOne', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
    transaccionGenerada: Schema.Attribute.Relation<
      'oneToOne',
      'api::transaccion.transaccion'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    foto: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::about.about': ApiAboutAbout;
      'api::activo.activo': ApiActivoActivo;
      'api::anuncio.anuncio': ApiAnuncioAnuncio;
      'api::aviso.aviso': ApiAvisoAviso;
      'api::blog-post.blog-post': ApiBlogPostBlogPost;
      'api::boxscore-semana.boxscore-semana': ApiBoxscoreSemanaBoxscoreSemana;
      'api::campana-meta.campana-meta': ApiCampanaMetaCampanaMeta;
      'api::campana.campana': ApiCampanaCampana;
      'api::catalogo-joyeria.catalogo-joyeria': ApiCatalogoJoyeriaCatalogoJoyeria;
      'api::categoria-pago.categoria-pago': ApiCategoriaPagoCategoriaPago;
      'api::categoria.categoria': ApiCategoriaCategoria;
      'api::cdl-metrica.cdl-metrica': ApiCdlMetricaCdlMetrica;
      'api::centro-costo.centro-costo': ApiCentroCostoCentroCosto;
      'api::centro-venta.centro-venta': ApiCentroVentaCentroVenta;
      'api::cliente-trabajo.cliente-trabajo': ApiClienteTrabajoClienteTrabajo;
      'api::cliente.cliente': ApiClienteCliente;
      'api::compra-material-linea.compra-material-linea': ApiCompraMaterialLineaCompraMaterialLinea;
      'api::compra-material.compra-material': ApiCompraMaterialCompraMaterial;
      'api::cotizacion.cotizacion': ApiCotizacionCotizacion;
      'api::cuenta.cuenta': ApiCuentaCuenta;
      'api::documento-legal.documento-legal': ApiDocumentoLegalDocumentoLegal;
      'api::ecosistema-mkt.ecosistema-mkt': ApiEcosistemaMktEcosistemaMkt;
      'api::ejercicio.ejercicio': ApiEjercicioEjercicio;
      'api::envio.envio': ApiEnvioEnvio;
      'api::evento-calendario.evento-calendario': ApiEventoCalendarioEventoCalendario;
      'api::evento-social.evento-social': ApiEventoSocialEventoSocial;
      'api::global.global': ApiGlobalGlobal;
      'api::historial-tarea.historial-tarea': ApiHistorialTareaHistorialTarea;
      'api::identidad-empresa.identidad-empresa': ApiIdentidadEmpresaIdentidadEmpresa;
      'api::ingrediente-despensa.ingrediente-despensa': ApiIngredienteDespensaIngredienteDespensa;
      'api::item-compra.item-compra': ApiItemCompraItemCompra;
      'api::lead.lead': ApiLeadLead;
      'api::mapa-identidad.mapa-identidad': ApiMapaIdentidadMapaIdentidad;
      'api::material-digital.material-digital': ApiMaterialDigitalMaterialDigital;
      'api::material-trabajo.material-trabajo': ApiMaterialTrabajoMaterialTrabajo;
      'api::material.material': ApiMaterialMaterial;
      'api::meta-ahorro.meta-ahorro': ApiMetaAhorroMetaAhorro;
      'api::metrica-corporal.metrica-corporal': ApiMetricaCorporalMetricaCorporal;
      'api::movimiento-material.movimiento-material': ApiMovimientoMaterialMovimientoMaterial;
      'api::nota-mejora.nota-mejora': ApiNotaMejoraNotaMejora;
      'api::orden-compra.orden-compra': ApiOrdenCompraOrdenCompra;
      'api::pago-programado.pago-programado': ApiPagoProgramadoPagoProgramado;
      'api::pago-trabajo.pago-trabajo': ApiPagoTrabajoPagoTrabajo;
      'api::partida-presupuesto.partida-presupuesto': ApiPartidaPresupuestoPartidaPresupuesto;
      'api::pasivo.pasivo': ApiPasivoPasivo;
      'api::persona-social.persona-social': ApiPersonaSocialPersonaSocial;
      'api::plan-comida.plan-comida': ApiPlanComidaPlanComida;
      'api::plan-ejercicio.plan-ejercicio': ApiPlanEjercicioPlanEjercicio;
      'api::prestamo-otorgado.prestamo-otorgado': ApiPrestamoOtorgadoPrestamoOtorgado;
      'api::proceso-tarea.proceso-tarea': ApiProcesoTareaProcesoTarea;
      'api::product-category.product-category': ApiProductCategoryProductCategory;
      'api::product.product': ApiProductProduct;
      'api::propuesta-concurso.propuesta-concurso': ApiPropuestaConcursoPropuestaConcurso;
      'api::proveedor.proveedor': ApiProveedorProveedor;
      'api::proyecto.proyecto': ApiProyectoProyecto;
      'api::receta.receta': ApiRecetaReceta;
      'api::recurso-categoria.recurso-categoria': ApiRecursoCategoriaRecursoCategoria;
      'api::recurso.recurso': ApiRecursoRecurso;
      'api::registro-mensual.registro-mensual': ApiRegistroMensualRegistroMensual;
      'api::reunion.reunion': ApiReunionReunion;
      'api::rh-item.rh-item': ApiRhItemRhItem;
      'api::rutina.rutina': ApiRutinaRutina;
      'api::servicio-vehiculo.servicio-vehiculo': ApiServicioVehiculoServicioVehiculo;
      'api::sesion-gym.sesion-gym': ApiSesionGymSesionGym;
      'api::sitio-web-miracles.sitio-web-miracles': ApiSitioWebMiraclesSitioWebMiracles;
      'api::sitio-web.sitio-web': ApiSitioWebSitioWeb;
      'api::sku-opcion.sku-opcion': ApiSkuOpcionSkuOpcion;
      'api::snapshot-cuenta.snapshot-cuenta': ApiSnapshotCuentaSnapshotCuenta;
      'api::snapshot-mes.snapshot-mes': ApiSnapshotMesSnapshotMes;
      'api::tarea.tarea': ApiTareaTarea;
      'api::ticket.ticket': ApiTicketTicket;
      'api::transaccion.transaccion': ApiTransaccionTransaccion;
      'api::vehiculo.vehiculo': ApiVehiculoVehiculo;
      'api::venta-linea.venta-linea': ApiVentaLineaVentaLinea;
      'api::venta.venta': ApiVentaVenta;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
