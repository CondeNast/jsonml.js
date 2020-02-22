/*
 jsonml-dom.js
 HTML to JsonML utility

 Created: 2007-02-15-2235

 Copyright (c)2006-2012 Stephen M. McKamey
 Distributed under The MIT License: http://jsonml.org/license
*/

'use strict';

const { JSDOM } = require('jsdom');

/**
 * A JsonML node represented as an Array or string value
 * @typedef {Array/string} JsonML
 */

/**
 * Add children to a JsonML node from a given DOM element
 *
 * @param {Element} elem - DOM Element
 * @param {Function} filter - optional filter method to be applied to every element
 * @param {JsonML} jml - JsonML node
 * @return {boolean} true if child node(s) were successfully added
 */
var addChildren = function(elem, filter, jml) {
  if (elem.hasChildNodes()) {
    for (var i=0; i<elem.childNodes.length; i++) {
      var child = elem.childNodes[i];
      child = fromHTML(child, filter);
      if (child) {
        jml.push(child);
      }
    }
    return true;
  }
  return false;
};

/**
 * Create a JsonML tree from a root DOM Element
 *
 * @param {Element} elem - DOM Element
 * @param {Function} [filter] - optional filter method to be applied to every element
 * @return {JsonML|null} JsonML or null if no tree to could generated
 */
var fromHTML = exports.fromHTML = function(elem, filter) {
  if (!elem || !elem.nodeType) {
    // free references
    return (elem = null);
  }

  var i, jml;
  switch (elem.nodeType) {
    case 1:  // element
    case 9:  // document
    case 11: // documentFragment
      jml = [elem.tagName.toLowerCase()||''];

      var attr = elem.attributes,
        props = {},
        hasAttrib = false;

      for (i=0; attr && i<attr.length; i++) {
        if (attr[i].specified) {
          if (attr[i].name === 'style') {
            props.style = elem.style.cssText || attr[i].value;
          } else if ('string' === typeof attr[i].value) {
            props[attr[i].name] = attr[i].value;
          }
          hasAttrib = true;
        }
      }
      if (hasAttrib) {
        jml.push(props);
      }

      var child;
      switch (jml[0].toLowerCase()) {
        case 'frame':
        case 'iframe':
          try {
            if ('undefined' !== typeof elem.contentDocument) {
              // W3C
              child = elem.contentDocument;
            } else if ('undefined' !== typeof elem.contentWindow) {
              // Microsoft
              child = elem.contentWindow.document;
            } else if ('undefined' !== typeof elem.document) {
              // deprecated
              child = elem.document;
            }

            child = fromHTML(child, filter);
            if (child) {
              jml.push(child);
            }
          } catch (ex) {}
          break;
        case 'style':
          child = elem.styleSheet && elem.styleSheet.cssText;
          if (child && 'string' === typeof child) {
            // unwrap comment blocks
            child = child.replace('<!--', '').replace('-->', '');
            jml.push(child);
          } else if (elem.hasChildNodes()) {
            for (i=0; i<elem.childNodes.length; i++) {
              child = elem.childNodes[i];
              child = fromHTML(child, filter);
              if (child && 'string' === typeof child) {
                // unwrap comment blocks
                child = child.replace('<!--', '').replace('-->', '');
                jml.push(child);
              }
            }
          }
          break;
        case 'input':
          addChildren(elem, filter, jml);
          child = (elem.type !== 'password') && elem.value;
          if (child) {
            if (!hasAttrib) {
              // need to add an attribute object
              jml.shift();
              props = {};
              jml.unshift(props);
              jml.unshift(elem.tagName.toLowerCase()||'');
            }
            props.value = child;
          }
          break;
        case 'textarea':
          if (!addChildren(elem, filter, jml)) {
            child = elem.value || elem.innerHTML;
            if (child && 'string' === typeof child) {
              jml.push(child);
            }
          }
          break;
        default:
          addChildren(elem, filter, jml);
          break;
      }

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    case 3: // text node
    case 4: // CDATA node
      var str = String(elem.nodeValue);
      // free references
      elem = null;
      return /^(\n|\s)+$/.test(str) ? null : str;
    case 10: // doctype
      jml = ['!'];

      var type = ['DOCTYPE', (elem.name || 'html').toLowerCase()];

      if (elem.publicId) {
        type.push('PUBLIC', '"' + elem.publicId + '"');
      }

      if (elem.systemId) {
        type.push('"' + elem.systemId + '"');
      }

      jml.push(type.join(' '));

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    case 8: // comment node
      if ((elem.nodeValue||'').indexOf('DOCTYPE') !== 0) {
        // free references
        elem = null;
        return null;
      }

      jml = ['!',
     elem.nodeValue];

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    default: // etc.
      // free references
      return (elem = null);
  }
};

const doc = typeof document === 'undefined' ?
      (new JSDOM()).window.document :
      document;

/**
 * Generate a JsonML tree from an HTML string
 *
 * @param {string} html - HTML text
 * @param {Function} [filter] - optinal filter method to be applied to each element
 * @return {JsonML|null} JsonML tree or null if no tree could be generated
 */
exports.fromHTMLText = function(html, filter) {
  var elem = doc.createElement('div');
  elem.innerHTML = html;

  var jml = fromHTML(elem, filter);

  // free references
  elem = null;

  if (jml.length === 2) {
    return jml[1];
  }

  // make wrapper a document fragment
  jml[0] = '';
  return jml;
};
