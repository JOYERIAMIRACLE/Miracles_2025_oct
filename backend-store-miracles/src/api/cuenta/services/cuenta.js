'use strict';

/**
 * cuenta service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cuenta.cuenta');
