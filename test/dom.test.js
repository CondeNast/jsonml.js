'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');
const dom = require('../lib/dom');

describe('dom', function() {
  describe('fromHTML', function() {
    let doc;

    before(function() {
      const { window } = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      doc = window.document;
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

    it('should include input elements with additional attributes', function() {
      doc.body.innerHTML = '<div id="my-div"><input name="foo" value="bar" placeholder="hello world" required /></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['input', {
          name: 'foo',
          placeholder: 'hello world',
          required: '',
          value: 'bar',
        }],
      ]);
    });

    it('should include input elements no attributes but a DOM value set', function() {
      doc.body.innerHTML = '<input />';
      const elem = doc.getElementsByTagName('input')[0];
      elem.value = 'hello';
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['input', { value: 'hello' }]);
    });

    it('should include textarea elements', function() {
      doc.body.innerHTML = '<div id="my-div"><textarea name="foo">hello world</textarea></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['textarea', { name: 'foo' }, 'hello world'],
      ]);
    });

    it('should include empty textarea elements', function() {
      doc.body.innerHTML = '<div id="my-div"><textarea name="foo"></textarea></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['textarea', { name: 'foo' }],
      ]);
    });

    it('should include a textarea element with a value', function() {
      doc.body.innerHTML = '<textarea id="my-text" name="foo"></textarea>';
      const elem = doc.getElementById('my-text');
      elem.value = 'hello world';
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['textarea', { id: 'my-text', name: 'foo' }, 'hello world']);
    });

    describe('doctype', function() {
      it('should transform a doctype node', function() {
        assert.notEqual(doc.doctype, null);
        const jml = dom.fromHTML(doc.doctype);
        assert.deepEqual(jml, ['!', 'DOCTYPE html']);
      });

      it('should transform a doctype node with extended attributes', function() {
        const HTML4_DOCTYPE = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"\n"http://www.w3.org/TR/html4/loose.dtd">';
        const { window: { document: html4doc } } = new JSDOM(`${HTML4_DOCTYPE}><html><body></body></html>`);
        assert.notEqual(html4doc.doctype, null);
        const jml = dom.fromHTML(html4doc.doctype);
        assert.deepEqual(jml, ['!', 'DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"']);
      });

      it('should transform a doctype node with an optional filter', function() {
        assert.notEqual(doc.doctype, null);
        const jml = dom.fromHTML(doc.doctype, (jml, elem) => {
          return jml.concat({ type: elem.toString() });
        });
        assert.deepEqual(jml, ['!', 'DOCTYPE html', { type: '[object DocumentType]' }]);
      });
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

    it('should maintain spaces between adjacent inline elements', function() {
      doc.body.innerHTML = '<div id="my-div"><em>foo</em> <em>bar</em></div>';
      const elem = doc.getElementById('my-div');
      const jml = dom.fromHTML(elem);
      assert.deepEqual(jml, ['div', { id: 'my-div' },
        ['em', 'foo'],
        ' ',
        ['em', 'bar'],
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

    it('should maintain spaces between adjacent inline elements', function() {
      const html = '<p><em>foo</em> <em>bar</em></p>';
      const jml = dom.fromHTMLText(html);
      assert.deepEqual(jml, ['p',
        ['em', 'foo'],
        ' ',
        ['em', 'bar'],
      ]);
    });
  });
});
