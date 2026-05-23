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
    anio: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<2025>;
    atributos: Schema.Attribute.Text;
    categoria: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
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
    notas: Schema.Attribute.Text;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
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
    tipo: Schema.Attribute.Enumeration<['completa', 'titulos_extra']> &
      Schema.Attribute.DefaultTo<'completa'>;
    unidadNegocio: Schema.Attribute.String & Schema.Attribute.Required;
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
    gastoycentrodecostos: Schema.Attribute.Relation<
      'oneToMany',
      'api::gasto.gasto'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::centro-costo.centro-costo'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
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
    canalContacto: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    direccion: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    Estado: Schema.Attribute.Enumeration<['Activo', 'Inactivo']>;
    Funnel: Schema.Attribute.Enumeration<
      ['Lead', 'Prospecto', 'Cotizacion', 'Pedido']
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cliente.cliente'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    origenContacto: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    segmento: Schema.Attribute.Enumeration<
      ['Pareja', 'Matrimonio', 'Familiar', 'Personalizado']
    >;
    telefono: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ventas: Schema.Attribute.Relation<'oneToMany', 'api::venta.venta'>;
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
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    evento_calendarios: Schema.Attribute.Relation<
      'oneToMany',
      'api::evento-calendario.evento-calendario'
    >;
    gastos: Schema.Attribute.Relation<'oneToMany', 'api::gasto.gasto'>;
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

export interface ApiGastoGasto extends Struct.CollectionTypeSchema {
  collectionName: 'gastos';
  info: {
    displayName: 'gasto';
    pluralName: 'gastos';
    singularName: 'gasto';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    centro_costo: Schema.Attribute.Relation<
      'manyToOne',
      'api::centro-costo.centro-costo'
    >;
    comprobante: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    concepto: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuenta: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::gasto.gasto'> &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal;
    notas: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
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
    materialProducto: Schema.Attribute.Enumeration<['Oro 10k', 'Plata 925']>;
    nombreProducto: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    sku: Schema.Attribute.String;
    slug: Schema.Attribute.UID<'nombreProducto'>;
    stock: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    talla: Schema.Attribute.String;
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
    ambito: Schema.Attribute.Enumeration<['personal', 'trabajo']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'personal'>;
    area: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    estado: Schema.Attribute.Enumeration<
      ['pendiente', 'en_progreso', 'en_pausa', 'completada']
    > &
      Schema.Attribute.DefaultTo<'pendiente'>;
    esTicket: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    etiqueta: Schema.Attribute.String;
    fechaCompletada: Schema.Attribute.DateTime;
    fechaInicio: Schema.Attribute.Date;
    fechaVencimiento: Schema.Attribute.Date;
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
    categoria: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuentaDestino: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    cuentaOrigen: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    descripcion: Schema.Attribute.String & Schema.Attribute.Required;
    fecha: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::transaccion.transaccion'
    > &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<['ingreso', 'gasto', 'transferencia']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
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
    concepto: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cuenta: Schema.Attribute.Relation<'manyToOne', 'api::cuenta.cuenta'>;
    estado: Schema.Attribute.Enumeration<
      ['Cotizado', 'Pagado', 'Preparando', 'Enviado', 'Entregado', 'Cancelado']
    > &
      Schema.Attribute.DefaultTo<'Cotizado'>;
    fecha: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::venta.venta'> &
      Schema.Attribute.Private;
    metodoPago: Schema.Attribute.Enumeration<
      ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']
    >;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notas: Schema.Attribute.String;
    producto: Schema.Attribute.Relation<'manyToOne', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
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
      'api::blog-post.blog-post': ApiBlogPostBlogPost;
      'api::boxscore-semana.boxscore-semana': ApiBoxscoreSemanaBoxscoreSemana;
      'api::campana.campana': ApiCampanaCampana;
      'api::categoria-pago.categoria-pago': ApiCategoriaPagoCategoriaPago;
      'api::categoria.categoria': ApiCategoriaCategoria;
      'api::cdl-metrica.cdl-metrica': ApiCdlMetricaCdlMetrica;
      'api::centro-costo.centro-costo': ApiCentroCostoCentroCosto;
      'api::centro-venta.centro-venta': ApiCentroVentaCentroVenta;
      'api::cliente-trabajo.cliente-trabajo': ApiClienteTrabajoClienteTrabajo;
      'api::cliente.cliente': ApiClienteCliente;
      'api::cuenta.cuenta': ApiCuentaCuenta;
      'api::ecosistema-mkt.ecosistema-mkt': ApiEcosistemaMktEcosistemaMkt;
      'api::ejercicio.ejercicio': ApiEjercicioEjercicio;
      'api::evento-calendario.evento-calendario': ApiEventoCalendarioEventoCalendario;
      'api::gasto.gasto': ApiGastoGasto;
      'api::global.global': ApiGlobalGlobal;
      'api::ingrediente-despensa.ingrediente-despensa': ApiIngredienteDespensaIngredienteDespensa;
      'api::item-compra.item-compra': ApiItemCompraItemCompra;
      'api::material-trabajo.material-trabajo': ApiMaterialTrabajoMaterialTrabajo;
      'api::meta-ahorro.meta-ahorro': ApiMetaAhorroMetaAhorro;
      'api::metrica-corporal.metrica-corporal': ApiMetricaCorporalMetricaCorporal;
      'api::pago-trabajo.pago-trabajo': ApiPagoTrabajoPagoTrabajo;
      'api::partida-presupuesto.partida-presupuesto': ApiPartidaPresupuestoPartidaPresupuesto;
      'api::pasivo.pasivo': ApiPasivoPasivo;
      'api::plan-comida.plan-comida': ApiPlanComidaPlanComida;
      'api::plan-ejercicio.plan-ejercicio': ApiPlanEjercicioPlanEjercicio;
      'api::prestamo-otorgado.prestamo-otorgado': ApiPrestamoOtorgadoPrestamoOtorgado;
      'api::product-category.product-category': ApiProductCategoryProductCategory;
      'api::product.product': ApiProductProduct;
      'api::proyecto.proyecto': ApiProyectoProyecto;
      'api::receta.receta': ApiRecetaReceta;
      'api::registro-mensual.registro-mensual': ApiRegistroMensualRegistroMensual;
      'api::reunion.reunion': ApiReunionReunion;
      'api::rutina.rutina': ApiRutinaRutina;
      'api::sesion-gym.sesion-gym': ApiSesionGymSesionGym;
      'api::snapshot-cuenta.snapshot-cuenta': ApiSnapshotCuentaSnapshotCuenta;
      'api::snapshot-mes.snapshot-mes': ApiSnapshotMesSnapshotMes;
      'api::tarea.tarea': ApiTareaTarea;
      'api::ticket.ticket': ApiTicketTicket;
      'api::transaccion.transaccion': ApiTransaccionTransaccion;
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
