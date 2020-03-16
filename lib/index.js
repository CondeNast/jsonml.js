'use strict';

const utils = require('./utils');
const dom = require('./dom');
const html = require('./html');
const xml = require('./xml');
Object.assign(module.exports, utils, dom, html, xml);
