'use strict';

const dom = require('./dom');
const html = require('./html');
const utils = require('./utils');
const xml = require('./xml');

const namespaces = {
  dom,
  html,
  utils,
  xml,
};

// Export all methods and namespaced interfaces
Object.assign(module.exports,
  namespaces,
  dom,
  html,
  utils,
  xml
);
