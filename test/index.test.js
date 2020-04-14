'use strict';

const assert = require('assert');
const JsonML = require('../lib');
const dom = require('../lib/dom');
const html = require('../lib/html');
const xml = require('../lib/xml');
const utils = require('../lib/utils');

describe('JsonML module index', function() {
  it('should export the dom namespace', function() {
    assert.deepEqual(JsonML.dom, dom);
  });

  it('should export the html namespace', function() {
    assert.deepEqual(JsonML.html, html);
  });

  it('should export the xml namespace', function() {
    assert.deepEqual(JsonML.xml, xml);
  });

  it('should export the utils namespace', function() {
    assert.deepEqual(JsonML.utils, utils);
  });

  it('should export all methods from the dom interface', function() {
    const keys = Object.keys(dom);
    assert(keys.length > 0, '`dom` module should have exports');
    keys.forEach(key => assert.equal(JsonML[key], dom[key]));
  });

  it('should export all methods from the html interface', function() {
    const keys = Object.keys(html);
    assert(keys.length > 0, '`html` module should have exports');
    keys.forEach(key => assert.equal(JsonML[key], html[key]));
  });

  it('should export all methods from the xml interface', function() {
    const keys = Object.keys(xml);
    assert(keys.length > 0, '`xml` module should have exports');
    keys.forEach(key => assert.equal(JsonML[key], xml[key]));
  });

  it('should export all methods from the utils interface', function() {
    const keys = Object.keys(utils);
    assert(keys.length > 0, '`utils` module should have exports');
    keys.forEach(key => assert.equal(JsonML[key], utils[key]));
  });
});
