'use strict';

const assert = require('assert');
const jsdom = require('jsdom').jsdom;
const dom = require('../lib/dom');

describe('dom', function() {
  describe('fromHTML', function() {
    let doc;

    before(function() {
      // Using jsdom@8.5.0
      // see: https://github.com/jsdom/jsdom/tree/8.5.0#jsdom
      doc = jsdom('<html><head></head><body></body></html>');
    });

    afterEach(function() {
      doc.body.innerHTML = '';
    });

    it('should export a method', function() {
      assert.equal(typeof dom.fromHTML, 'function');
    });

    it('should create a JsonML node from a DOM element', function() {
      doc.body.innerHTML = '<div id="my-div"><span class="foo" data-x="bar">hello world</span></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['span', { class: 'foo', 'data-x': 'bar' }, 'hello world'],
      ]);
    });

    it('should return null if no element is passed', function() {
      assert.equal(dom.fromHTML(), null);
    });

    it('should return null if a non-element value is passed', function() {
      assert.equal(dom.fromHTML('foo'), null);
      assert.equal(dom.fromHTML(5), null);
      assert.equal(dom.fromHTML(null), null);
      assert.equal(dom.fromHTML([]), null);
      assert.equal(dom.fromHTML({}), null);
    });

    it('should include DOM style attributes', function() {
      doc.body.innerHTML = '<div id="my-div"></div>';
      const elem = doc.getElementById('my-div');
      elem.style.color = 'red';
      elem.style.float = 'left';
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', {
        id: 'my-div',
        style: 'color: red; float: left;',
      }]);
    });

    it('should include iframe elements', function() {
      doc.body.innerHTML = '<div id="my-div"><iframe src="https://www.yahoo.com" width="500" height="200"></iframe></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['iframe', { src: 'https://www.yahoo.com', width: 500, height: 200 }],
      ]);
    });

    it('should include style elements', function() {
      doc.body.innerHTML = '<div id="my-div"><style>#my-div { color: red; }</style></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['style', '#my-div { color: red; }'],
      ]);
    });

    it('should include input elements', function() {
      doc.body.innerHTML = '<div id="my-div"><input name="foo" value="bar" /></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['input', { name: 'foo', value: 'bar' }],
      ]);
    });

    it('should include textarea elements', function() {
      doc.body.innerHTML = '<div id="my-div"><textarea name="foo">hello world</textarea></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['textarea', { name: 'foo' }, 'hello world'],
      ]);
    });

    it('should ignore comment nodes', function() {
      doc.body.innerHTML = '<div id="my-div">foo<!-- this is a test --><span>bar</span></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        'foo',
        ['span', 'bar'],
      ]);
    });
  });

  describe('fromHTMLText', function() {
    it('should export a method', function() {
      assert.equal(typeof dom.fromHTMLText, 'function');
    });

    it('should create a JsonML node from an HTML string', function() {
      const html = '<div id="my-div"><span class="foo" data-x="bar">hello world</span></div>';
      const jml = dom.fromHTMLText(html);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['span', { class: 'foo', 'data-x': 'bar' }, 'hello world'],
      ]);
    });

    it('should return a string value when passed a string value', function() {
      const html = 'hello world';
      const jml = dom.fromHTMLText(html);
      assert.equal(jml, html);
    });

    it('should create a JsonML fragment if missing a root element', function() {
      const html = 'foo <span>hello world</span>';
      const jml = dom.fromHTMLText(html);
      assert.deepEqual(jml, ['', 'foo ',
        ['span', 'hello world'],
      ]);
    });

    it('should allow a filter param to modify the returned JsonML node', function() {
      const html = '<div>hello</div>';
      const jml = dom.fromHTMLText(html, jml => {
        jml[0] = 'foo';
        return jml;
      });
      assert.deepEqual(jml, ['foo', 'hello']);
    });
  });
});
