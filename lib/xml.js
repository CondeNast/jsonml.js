// adapted from: https://raw.githubusercontent.com/mckamey/jsonml/master/jsonml-xml.js
/* eslint-disable no-use-before-define */
'use strict';

/*
  jsonml-xml.js
  JsonML XML utilities

  Created: 2007-02-15-2235
  Modified: 2012-11-03-2051

  Copyright (c)2006-2012 Stephen M. McKamey
  Distributed under The MIT License: http://jsonml.org/license

  This file creates a global JsonML object containing these methods:

    toXML(string|array, filter)
      Converts JsonML to XML nodes

    toXMLText(JsonML, filter)
      Converts JsonML to XML text

    fromXML(node, filter)
      Converts XML nodes to JsonML

    fromXMLText(xmlText, filter)
      Converts XML text to JsonML
*/

const { JSDOM } = require('jsdom');

const win = typeof window === 'undefined' ?
  (new JSDOM()).window :
  window; // eslint-disable-line no-undef
// enable usage of XML DOM, fallback to HTML DOM
const doc = parseXML('<xml/>') || win.document;

module.exports = {
  fromXML,
  fromXMLText,
  isXML,
  onerror: null,
  parseXML,
  renderXML,
  toXML,
  toXMLText,
};

/**
  * Determines if the value is an Array
  *
  * @private
  * @param {*} val the object being tested
  * @return {boolean} true if an Array
  */
const isArray = Array.isArray || function(val) {
  return (val instanceof Array);
};

/**
  * Creates a DOM element
  *
  * @private
  * @param {string} tag The element's tag name

  * @return {Node} DOM Element
  */
const createElement = function(tag) {
  if (!tag) {
    // create a document fragment to hold multiple-root elements
    if (doc.createDocumentFragment) {
      return doc.createDocumentFragment();
    }

    tag = '';

  } else if (tag.charAt(0) === '!') {
    return doc.createComment(tag === '!' ? '' : tag.substr(1) + ' ');
  }

  return doc.createElement(tag);
};

/**
  * Appends an attribute to an element
  *
  * @private
  * @param {Node} elem The element
  * @param {Object} attr Attributes object
  * @return {Node} DOM Element
  */
const addAttributes = function(elem, attr) {
  // for each attributeName
  for (const name in attr) {
    if (attr.hasOwnProperty(name)) {
      // attributes
      elem.setAttribute(name, attr[name]);
    }
  }
  return elem;
};

/**
  * Appends a child to an element
  *
  * @private
  * @param {Node} elem The parent element
  * @param {Node} child The child
  */
const appendDOM = function(elem, child) {
  if (child) {
    if (elem.nodeType === win.Node.COMMENT_NODE) {
      if (child.nodeType === win.Node.TEXT_NODE) {
        elem.nodeValue += child.nodeValue;
      }

    } else if (elem.canHaveChildren !== false) {
      elem.appendChild(child);
    }
  }
};

/**
  * Default error handler
  * @param {Error} ex - error
  * @return {Node} Text node
  */
const onError = function(ex) {
  return doc.createTextNode(`[${ex}]`);
};

/**
  * @param {Node} elem - DOM Element to patch
  * @param {*} jml - JsonML node
  * @param {function} filter - filter function
  * @return {Node} patched DOM Element
  */
function patch(elem, jml, filter) {
  for (let i = 1; i < jml.length; i++) {
    if (isArray(jml[i]) || 'string' === typeof jml[i]) {
      // append children
      appendDOM(elem, toXML(jml[i], filter));

    } else if ('object' === typeof jml[i] && jml[i] !== null && elem.nodeType === win.Node.ELEMENT_NODE) {
      // add attributes
      elem = addAttributes(elem, jml[i]);
    }
  }
  return elem;
}

/**
  * Main builder entry point
  * @param {string|array} jml - JsonML value
  * @param {function} filter - filter function
  * @return {Node} DOM Element
  */
function toXML(jml, filter) {
  try {
    if (!jml) {
      return null;
    }
    if ('string' === typeof jml) {
      return doc.createTextNode(jml);
    }
    if (!isArray(jml) || ('string' !== typeof jml[0])) {
      throw new SyntaxError('invalid JsonML');
    }

    const tagName = jml[0]; // tagName
    if (!tagName) {
      // correctly handle a list of JsonML trees
      // create a document fragment to hold elements
      const frag = createElement('');
      for (let i = 1; i < jml.length; i++) {
        appendDOM(frag, toXML(jml[i], filter));
      }

      // eliminate wrapper for single nodes
      if (frag.childNodes.length === 1) {
        return frag.firstChild;
      }
      return frag;
    }

    const elem = patch(createElement(tagName), jml, filter);

    return (elem && 'function' === typeof filter) ? filter(elem) : elem;
  } catch (ex) {
    try {
      // handle error with complete context
      const err = ('function' === typeof module.exports.onerror) ? module.exports.onerror : onError;
      return err(ex, jml, filter);
    } catch (ex2) {
      return doc.createTextNode(`[${ex2}]`);
    }
  }
}

/**
  * Converts JsonML to XML text
  * @param {string|array} jml - JsonML value
  * @param {function} filter - filter function
  * @return {string} XML text
  */
function toXMLText(jml, filter) {
  return renderXML(toXML(jml, filter));
}

/* Reverse conversion -------------------------*/

const addChildren = function(/* DOM */ elem, /* function */ filter, /* JsonML */ jml) {
  if (elem.hasChildNodes()) {
    for (let i = 0, len = elem.childNodes.length; i < len; i++) {
      let child = elem.childNodes[i];
      child = fromXML(child, filter);
      if (child) {
        jml.push(child);
      }
    }
    return true;
  }
  return false;
};

/**
  * @param {Node} elem - XML node
  * @param {function} filter - filter function
  * @return {string|array} JsonML
  */
function fromXML(elem, filter) {
  if (!elem || !elem.nodeType) {
    // free references
    return (elem = null);
  }

  let jml;
  switch (elem.nodeType) {
    case win.Node.ELEMENT_NODE:
    case win.Node.DOCUMENT_NODE:
    case win.Node.DOCUMENT_FRAGMENT_NODE: {
      jml = [elem.tagName || ''];

      const attr = elem.attributes;
      const props = {};
      let hasAttrib = false;

      for (let i = 0; attr && i < attr.length; i++) {
        if (attr[i].specified) {
          if ('string' === typeof attr[i].value) {
            props[attr[i].name] = attr[i].value;
          }
          hasAttrib = true;
        }
      }
      if (hasAttrib) {
        jml.push(props);
      }

      addChildren(elem, filter, jml);

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    }
    case win.Node.TEXT_NODE:
    case win.Node.CDATA_SECTION_NODE: {
      const str = String(elem.nodeValue);
      // free references
      elem = null;
      return str;
    }
    case win.Node.DOCUMENT_TYPE_NODE: {
      jml = ['!'];

      const type = ['DOCTYPE', (elem.name || 'html').toLowerCase()];

      if (elem.publicId) {
        type.push('PUBLIC', `"${elem.publicId}"`);
      }

      if (elem.systemId) {
        type.push(`"${elem.systemId}"`);
      }

      jml.push(type.join(' '));

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    }
    case win.Node.COMMENT_NODE:
      if ((elem.nodeValue || '').indexOf('DOCTYPE') !== 0) {
        // free references
        elem = null;
        return null;
      }

      jml = ['!', elem.nodeValue];

      // filter result
      if ('function' === typeof filter) {
        jml = filter(jml, elem);
      }

      // free references
      elem = null;
      return jml;
    default: // etc.
      if (win.console) {
        win.console.log(`nodeType ${elem.nodeType} skipped.`);
      }
      // free references
      return (elem = null);
  }
}

/**
  * Converts XML text to XML DOM nodes
  * https://developer.mozilla.org/en-US/docs/Parsing_and_serializing_XML
  * https://gist.github.com/553364
  * @param {string} xmlText - XML text string
  * @return {XMLDocument} xml document
  */
function parseXML(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') {
    return null;
  }

  if (win.DOMParser) {
    // standard XML DOM
    return new win.DOMParser().parseFromString(xmlText, 'application/xml');
  }

  if (win.ActiveXObject) {
    // legacy IE XML DOM
    const xml = new win.ActiveXObject('Microsoft.XMLDOM');
    xml.async = 'false';
    xml.loadXML(xmlText);
    return xml;
  }
  /*
  // this doesn't seem to work in any browser yet
  if (win.XMLHttpRequest){
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data:application/xml;charset=utf-8,'+encodeURIComponent(xmlText), false);
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('application/xml');
    }
    xhr.send('');
    return xhr.responseXML;
  }
  */
  return null;
}

/**
  * Converts XML text nodes to JsonML
  * @param {string} xmlText - XML text string
  * @param {function} filter - filter function
  * @return {string|array} JsonML
  */
function fromXMLText(xmlText, filter) {
  let elem = parseXML(xmlText);
  elem = elem && (elem.ownerDocument || elem).documentElement;

  return fromXML(elem, filter);
}

/**
  * Converts XML DOM nodes to XML text
  * https://developer.mozilla.org/en-US/docs/Parsing_and_serializing_XML
  * @param {string} elem - XML DOM Node
  * @return {string} XML text
  */
function renderXML(elem) {
  if (!elem) {
    return null;
  }

  if (win.XMLSerializer) {
    // standard XML DOM
    return new win.XMLSerializer().serializeToString(elem);
  }

  // legacy IE XML
  if (elem.xml) {
    return elem.xml;
  }

  // HTML DOM
  if (elem.outerHTML) {
    return elem.outerHTML;
  }

  const parent = createElement('div');
  parent.appendChild(elem);

  const html = parent.innerHTML;
  parent.removeChild(elem);

  return html;
}

function isXML(elem) {
  const root = elem && (elem.ownerDocument || elem).documentElement;
  return !!root && (root.nodeName !== 'HTML');
}
