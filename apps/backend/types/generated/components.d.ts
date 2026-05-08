import type { Schema, Struct } from '@strapi/strapi';

export interface NuevoComponentesGestion extends Struct.ComponentSchema {
  collectionName: 'components_nuevo_componentes_gestion_s';
  info: {
    displayName: 'componentes gestion ';
    icon: 'arrowRight';
  };
  attributes: {};
}

export interface SharedAnilloss extends Struct.ComponentSchema {
  collectionName: 'components_shared_anillosses';
  info: {
    displayName: 'anilloss';
  };
  attributes: {
    anillo: Schema.Attribute.Enumeration<['solitario', 'lizo', 'graduacionn']>;
  };
}

export interface SharedCadenasss extends Struct.ComponentSchema {
  collectionName: 'components_shared_cadenassses';
  info: {
    displayName: 'cadenasss';
  };
  attributes: {
    esclavas: Schema.Attribute.Enumeration<['cubana', 'placa', 'cartier']>;
    format: Schema.Attribute.JSON;
  };
}

export interface SharedCfgfg extends Struct.ComponentSchema {
  collectionName: 'components_shared_cfgfgs';
  info: {
    displayName: 'detalles';
    icon: 'bold';
  };
  attributes: {
    DetalleAnillos: Schema.Attribute.Enumeration<
      ['Solitario', 'matrimonio ', 'Grafuacion']
    >;
    DetalleEsclavas: Schema.Attribute.Enumeration<
      ['china', 'cartier', 'cubana']
    >;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedWerfewr extends Struct.ComponentSchema {
  collectionName: 'components_shared_werfewrs';
  info: {
    displayName: 'werfewr';
    icon: 'cloud';
  };
  attributes: {
    dfgdfg: Schema.Attribute.JSON;
    sdgfd: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'nuevo.componentes-gestion': NuevoComponentesGestion;
      'shared.anilloss': SharedAnilloss;
      'shared.cadenasss': SharedCadenasss;
      'shared.cfgfg': SharedCfgfg;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.werfewr': SharedWerfewr;
    }
  }
}
