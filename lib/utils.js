'use strict';

const isRaw = require('./html').isRaw;

/**
 * A JsonML node represented as an Array or string value
 * @typedef {Array/string} JsonML
 */

/**
 * Determine if a value is an Array
 *
 * @param {any} val - parameter to be evaluated
 * @return {boolean} true if an Array instance
 */
const isArray = Array.isArray || function isArray(val) {
  return val instanceof Array;
};

/**
 * Identify if JsonML node represents a DocumentFragment
 *
 * @param {JsonML} jml - JsonML node
 * @return {boolean} true if representing a DocumentFragment
 */
exports.isFragment = function isFragment(jml) {
  return isArray(jml) && jml[0] === '';
};

/**
 * Get the element tag name for the current JsonML node
 *
 * @param {JsonML} jml - JsonML node
 * @return {string} tag name if available, otherwise an empty string
 */
exports.getTagName = function getTagName(jml) {
  return jml[0] || '';
};

/**
 * Identify if a parameter is a string
 *
 * @param {any} str - parameter to evaluate
 * @return {boolean} true if a string literal
 */
function isString(str) {
  return typeof str === 'string';
}

/**
 * Identify a valid JsonML node (element)
 *
 * @param {any} jml - parameter to evaluate
 * @return {boolean} true if a valid JsonML node
 */
const isElement = exports.isElement = function isElement(jml) {
  return isArray(jml) && isString(jml[0]) || isString(jml);
};

/**
 * Identify a JsonML attributes object
 *
 * @param {any} jml - parameter to evaluate
 * @return {boolean} true if an attributes object
 */
const isAttributes = exports.isAttributes = function isAttributes(jml) {
  return !!jml && typeof jml === 'object' && !isArray(jml);
};

/**
 * Determine if a JsonML node has an associated attributes object
 * Will return true even if attributes are empty
 *
 * @param {JsonML} jml - JsonML node
 * @return {boolean} true if the node has an attributes object
 */
const hasAttributes = exports.hasAttributes = function hasAttributes(jml) {
  if (!isElement(jml)) {
    throw new SyntaxError('invalid JsonML');
  }

  return isAttributes(jml[1]);
};

/**
 * Get attributes associated with a JsonML node and optionally initialize an empty object
 *
 * @param {JsonML} jml - JsonML node
 * @param {boolean} [addIfMissing] - optionally initialize an empty attributes object
 * @return {Object} JsonML attributes
 */
const getAttributes = exports.getAttributes = function getAttributes(jml, addIfMissing) {
  if (hasAttributes(jml)) {
    return jml[1];
  }

  if (!addIfMissing) {
    return {};
  }

  // need to add an attribute object
  const name = jml.shift();
  const attr = {};
  jml.unshift(attr);
  jml.unshift(name || '');
  return attr;
};

/**
 * Add attributes to a JsonML node
 *
 * @param {JsonML} jml - JsonML node
 * @param {Object} attr -  JsonML attributes
 * @return {undefined} undefined
 */
const addAttributes = exports.addAttributes = function addAttributes(jml, attr) {
  if (!isElement(jml) || !isAttributes(attr)) {
    throw new SyntaxError('invalid JsonML');
  }

  if (!isAttributes(jml[1])) {
    // just insert attributes
    const name = jml.shift();
    jml.unshift(attr);
    jml.unshift(name || '');
    return;
  }

  // merge attribute objects
  const old = jml[1];
  for (let key in attr) {
    if (attr.hasOwnProperty(key)) {
      old[key] = attr[key];
    }
  }
};

/**
 * Get an attribute by name
 *
 * @param {JsonML} jml - JsonML node
 * @param {string} key - attribute name
 * @return {any} attribute value or undefined
 */
exports.getAttribute = function getAttribute(jml, key) {
  if (!hasAttributes(jml)) {
    return undefined;
  }
  return jml[1][key];
};

exports.setAttribute = function setAttribute(jml, key, value) {
  getAttributes(jml, true)[key] = value;
};

exports.appendChild = function appendChild(parent, child) {
  if (!isArray(parent)) {
    throw new SyntaxError('invalid JsonML');
  }

  if (isArray(child) && child[0] === '') {
    // result was multiple JsonML sub-trees (i.e. documentFragment)
    const fragments = child.slice(1);

    // directly append children
    while (fragments.length) {
      appendChild(parent, fragments.shift(), arguments[2]);
    }

  } else if (child && 'object' === typeof child) {
    if (isArray(child)) {
      if (!isElement(child)) {
        throw new SyntaxError('invalid JsonML');
      }

      if (typeof arguments[2] === 'function') {
        // onAppend callback for JBST use
        arguments[2](parent, child);
      }

      // result was a JsonML node
      parent.push(child);

    } else if (isRaw(child)) {

      // result was a JsonML node
      parent.push(child);

    } else {
      // result was JsonML attributes
      addAttributes(parent, child);
    }

  } else if ('undefined' !== typeof child && child !== null) {

    // must convert to string or JsonML will discard
    child = String(child);

    // skip processing empty string literals
    if (child && parent.length > 1 && 'string' === typeof parent[parent.length - 1]) {
      // combine strings
      parent[parent.length - 1] += child;
    } else if (child || !parent.length) {
      // append
      parent.push(child);
    }
  }
};

/**
 * Get child nodes of a JsonML node
 *
 * @param {JsonML} jml - JsonML node
 * @return {JsonML[]} child nodes
 */
exports.getChildren = function getChildren(jml) {
  if (hasAttributes(jml)) {
    return jml.slice(2);
  }

  return jml.slice(1);
};
