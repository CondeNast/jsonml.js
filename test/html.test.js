'use strict';

const assert = require('assert');
const jsdom = require('jsdom').jsdom;
const html = require('../lib/html');

describe('html', function() {
  before(function() {
    global.document = jsdom();
  });

  after(function() {
    delete global.document;
  });

  describe('raw', function() {
    it('should export a method', function() {
      assert.equal(typeof html.raw, 'function');
    });

    it('should create a new Markup instance', function() {
      const inst = html.raw();
      assert.equal(inst.constructor.name, 'Markup');
    });

    describe('Markup instance', function() {
      it('should store an internal value', function() {
        const inst = html.raw('foo');
        assert.equal(inst.value, 'foo');
      });

      it('should implement a toString method and output value', function() {
        const inst = html.raw('foo');
        assert.equal(inst.toString(), 'foo');
      });
    });
  });

  describe('isRaw', function() {
    it('should export a method', function() {
      assert.equal(typeof html.isRaw, 'function');
    });

    it('should identify raw Markup instances', function() {
      const inst = html.raw('foo');
      assert.strictEqual(html.isRaw(inst), true);
    });

    it('should return false for other objects', function() {
      const obj = { value: 'foo' };
      assert.strictEqual(html.isRaw(obj), false);
    });
  });

  describe('onerror', function() {
    it('should export null by default', function() {
      assert.strictEqual(html.onerror, null);
    });
  });

  describe('patch', function() {
    it('should export a method', function() {
      assert.equal(typeof html.patch, 'function');
    });

    it('should update an element given a new JsonML representation', function() {
      const elem = document.createElement('div');
      const jml = ['div', { id: 'a1' },
        'hello ',
        ['span', 'world']
      ];
      html.patch(elem, jml);
      assert.equal(elem.outerHTML, '<div id="a1">hello <span>world</span></div>');
    });

    it('should not update the value of a text node', function() {
      const elem = document.createTextNode('foo');
      const jml = ['', 'bar'];
      html.patch(elem, jml);
      assert.equal(elem.nodeValue, 'foo');
    });

    it('should not modify the element tag', function() {
      const elem = document.createElement('div');
      const jml = ['span', { id: 'a1' }];
      html.patch(elem, jml);
      assert.equal(elem.outerHTML, '<div id="a1"></div>');
    });
  });

  describe('toHTML', function() {
    it('should export a method', function() {
      assert.equal(typeof html.toHTML, 'function');
    });

    it('should return null for falsy values', function() {
      assert.strictEqual(html.toHTML(), null);
      assert.strictEqual(html.toHTML(0), null);
      assert.strictEqual(html.toHTML(false), null);
      assert.strictEqual(html.toHTML(NaN), null);
      assert.strictEqual(html.toHTML(''), null);
    });

    it('should return a text node with an error if not passed a valid JsonML node', function() {
      const elem = html.toHTML({});
      assert.equal(elem.constructor.name, 'Text');
      assert.equal(elem.nodeValue, '[SyntaxError: invalid JsonML]');
    });

    it('should create a text node for a string value', function() {
      const elem = html.toHTML('foo');
      assert.equal(elem.constructor.name, 'Text');
      assert.equal(elem.nodeValue, 'foo');
    });

    it('should create a text node for the value of a raw Markup instance', function() {
      const elem = html.toHTML(html.raw('foo'));
      assert.equal(elem.constructor.name, 'Text');
      assert.equal(elem.nodeValue, 'foo');
    });

    it('should return a DocumentFragment when passed a JsonML fragment', function() {
      const jml = ['', 'foo ', ['span', 'bar']];
      const elem = html.toHTML(jml);
      assert.equal(elem.constructor.name, 'DocumentFragment');
      assert.equal(elem.childNodes[0].nodeValue, 'foo ');
      assert.equal(elem.childNodes[1].outerHTML, '<span>bar</span>');
    });

    it('should return the single value when passed a JsonML fragment with one child', function() {
      const jml = ['', ['span', 'bar']];
      const elem = html.toHTML(jml);
      assert.equal(elem.outerHTML, '<span>bar</span>');
    });

    it('should create a DOM element for JsonML node', function() {
      const jml = ['span', { 'data-foo': 'bar' }, 'hello'];
      const elem = html.toHTML(jml);
      assert.equal(elem.outerHTML, '<span data-foo="bar">hello</span>');
    });

    it('should create a DOM element for JsonML node with children', function() {
      const jml = ['span', { 'data-foo': 'bar' },
        'hello ',
        ['strong', 'world']
      ];
      const elem = html.toHTML(jml);
      assert.equal(elem.outerHTML, '<span data-foo="bar">hello <strong>world</strong></span>');
    });
  });

  describe('toHTMLText', function() {
    it('should export a method', function() {
      assert.equal(typeof html.toHTMLText, 'function');
    });

    it('should return a string value', function() {
      assert.deepEqual(html.toHTMLText('foo'), 'foo');
    });

    it('should create an html string from a JsonML node', function() {
      const jml = ['span', { 'data-foo': 'bar' }, 'hello'];
      const text = html.toHTMLText(jml);
      assert.equal(text, '<span data-foo="bar">hello</span>');
    });

    it('should create an html string from a JsonML node with children', function() {
      const jml = ['span', { 'data-foo': 'bar' },
        'hello ',
        ['strong', 'world']
      ];
      const text = html.toHTMLText(jml);
      assert.equal(text, '<span data-foo="bar">hello <strong>world</strong></span>');
    });
  });
});
