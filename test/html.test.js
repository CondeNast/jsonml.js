'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');
let html = require('../lib/html');

describe('html', function() {
  let doc;

  before(function() {
    doc = new JSDOM().window.document;
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
      const elem = doc.createElement('div');
      const jml = ['div', { id: 'a1' },
        'hello ',
        ['span', 'world'],
      ];
      html.patch(elem, jml);
      assert.equal(elem.outerHTML, '<div id="a1">hello <span>world</span></div>');
    });

    it('should not update the value of a text node', function() {
      const elem = doc.createTextNode('foo');
      const jml = ['', 'bar'];
      html.patch(elem, jml);
      assert.equal(elem.nodeValue, 'foo');
    });

    it('should not modify the element tag', function() {
      const elem = doc.createElement('div');
      const jml = ['span', { id: 'a1' }];
      html.patch(elem, jml);
      assert.equal(elem.outerHTML, '<div id="a1"></div>');
    });

    it('should update an element given JsonML with raw (Markup) instance', function() {
      const rawStr = new html.raw('foo');
      assert.equal(rawStr.value, 'foo');
      assert.equal(rawStr.toString(), 'foo');
      const elem = doc.createElement('div');
      const jml = ['', rawStr];
      html.patch(elem, jml);
      assert.equal(elem.outerHTML, '<div>foo</div>');
    });

    describe('element attributes', function() {
      it('should be able to update element attributes', function() {
        const elem = doc.createElement('input');
        const attrs = {
          id: 'my-el-1',
          name: 'my-best-el',
          className: 'foo bar baz',
          disabled: true,
        };
        const jml = ['', attrs];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML, `<input id="${attrs.id}" name="${attrs.name}" class="${attrs.className}" disabled="">`);
      });

      it('should be able to update "duplicate" attributes', function() {
        const elem = doc.createElement('input');
        const attrs = {
          enctype: 'utf-8',
          onscroll: function onscroll() {},
        };
        const jml = ['', attrs];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML, '<input enctype="utf-8" encoding="utf-8">');
      });

      it('should be able to update boolean attributes on arbitrary elements', function() {
        const elem = doc.createElement('div');
        const attrs = {
          disabled: true,
        };
        const jml = ['', attrs];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML, '<div disabled="disabled"></div>');
      });

      it('should be able to update element styles through attributes', function() {
        const elem = doc.createElement('input');
        // NOTE: JsonML style attribute must provide the literal inline CSS string value.
        // An object of DOM style properties (e.g. marginTop) will not be applied as expected.
        const attrs = {
          style: 'color: blue; margin-top: 25px;',
        };
        const jml = ['', attrs];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML, `<input style="${attrs.style}">`);
      });

      it('should be able to update set event handlers through attributes', function(done) {
        const elem = doc.createElement('input');
        // NOTE: event names must be lowercase. camelCase will currently fail
        // click to complete the test otherwise the test will fail due to timeout
        html.patch(elem, ['', { onclick: () => done() }]);
        elem.dispatchEvent(new doc.defaultView.Event('click'));
      });
    });

    describe('tables', function() {
      it('should attempt to append a TD cell to by creating a tbody and tr', function() {
        const elem = doc.createElement('table');
        const jml = ['',
          ['td', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<tbody>' +
          '<tr>' +
          '<td>rogue table cell</td>' +
          '</tr>' +
          '</tbody>' +
          '</table>'
        );
      });

      it('should attempt to append a TH cell to by creating a thead', function() {
        const elem = doc.createElement('table');
        const jml = ['',
          ['th', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<thead>' +
          '<tr>' +
          '<th>rogue table cell</th>' +
          '</tr>' +
          '</thead>' +
          '</table>'
        );
      });

      it('should attempt to append a TD cell to an existing tbody', function() {
        const elem = doc.createElement('table');
        const tbody = doc.createElement('tbody');
        tbody.setAttribute('id', 'my-tbody');
        elem.appendChild(tbody);
        const jml = ['',
          ['td', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<tbody id="my-tbody">' +
          '<tr>' +
          '<td>rogue table cell</td>' +
          '</tr>' +
          '</tbody>' +
          '</table>'
        );
      });


      it('should attempt to append a TH cell to an existing thead', function() {
        const elem = doc.createElement('table');
        const thead = doc.createElement('thead');
        thead.setAttribute('id', 'my-thead');
        elem.appendChild(thead);
        const jml = ['',
          ['th', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<thead id="my-thead">' +
          '<tr>' +
          '<th>rogue table cell</th>' +
          '</tr>' +
          '</thead>' +
          '</table>'
        );
      });

      it('should attempt to append a TD cell to the last existing tbody', function() {
        const elem = doc.createElement('table');
        [1, 2, 3].forEach(n => {
          const tbody = doc.createElement('tbody');
          tbody.setAttribute('id', `my-tbody-${n}`);
          elem.appendChild(tbody);
        });
        const jml = ['',
          ['td', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<tbody id="my-tbody-1"></tbody>' +
          '<tbody id="my-tbody-2"></tbody>' +
          '<tbody id="my-tbody-3"><tr><td>rogue table cell</td></tr></tbody>' +
          '</table>'
        );
      });

      it('should attempt to append a TD cell to the last row of the last existing tbody', function() {
        const elem = doc.createElement('table');
        [1, 2, 3].forEach(n => {
          const tbody = doc.createElement('tbody');
          tbody.setAttribute('id', `my-tbody-${n}`);
          tbody.appendChild(doc.createElement('tr'));
          tbody.appendChild(doc.createElement('tr'));
          elem.appendChild(tbody);
        });
        const jml = ['',
          ['td', 'rogue table cell'],
        ];
        html.patch(elem, jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<tbody id="my-tbody-1"><tr></tr><tr></tr></tbody>' +
          '<tbody id="my-tbody-2"><tr></tr><tr></tr></tbody>' +
          '<tbody id="my-tbody-3"><tr></tr><tr><td>rogue table cell</td></tr></tbody>' +
          '</table>'
        );
      });
    });

    describe('comments', function() {
      it('should append text to existing comments', function() {
        const message = 'this is a comment';
        const elem = doc.createComment(message);
        const jml = ['', '...hello'];
        html.patch(elem, jml);
        const div = doc.createElement('div');
        div.appendChild(elem);
        assert.equal(div.innerHTML, `<!--${message}...hello-->`);
      });
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
        ['strong', 'world'],
      ];
      const elem = html.toHTML(jml);
      assert.equal(elem.outerHTML, '<span data-foo="bar">hello <strong>world</strong></span>');
    });

    // Also tested within the patch() suite
    describe('element attributes', function() {
      it('should be able to update element attributes', function() {
        const attrs = {
          id: 'my-el-1',
          name: 'my-best-el',
          className: 'foo bar baz',
          disabled: true,
        };
        const jml = ['input', attrs];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, `<input id="${attrs.id}" name="${attrs.name}" class="${attrs.className}" disabled="">`);
      });

      it('should be able to update "duplicate" attributes', function() {
        const attrs = {
          enctype: 'utf-8',
          onscroll: function onscroll() {},
        };
        const jml = ['input', attrs];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, '<input enctype="utf-8" encoding="utf-8">');
      });

      it('should be able to update boolean attributes on arbitrary elements', function() {
        const attrs = {
          disabled: true,
        };
        const jml = ['div', attrs];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, '<div disabled="disabled"></div>');
      });

      it('should be able to update element styles through attributes', function() {
        // NOTE: JsonML style attribute must provide the literal inline CSS string value.
        // An object of DOM style properties (e.g. marginTop) will not be applied as expected.
        const attrs = {
          style: 'color: blue; margin-top: 25px;',
        };
        const jml = ['input', attrs];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, `<input style="${attrs.style}">`);
      });

      it('should be able to update set event handlers through attributes', function(done) {
        // NOTE: event names must be lowercase. camelCase will currently fail
        // click to complete the test otherwise the test will fail due to timeout
        const elem = html.toHTML(['input', { onclick: () => done() }]);
        elem.dispatchEvent(new doc.defaultView.Event('click'));
      });

      it('should set null attribute values to empty strings', function() {
        const jml = ['input', {
          id: null,
          class: null,
        }];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, '<input id="" class="">');
      });

      it('should omit set null "value" attributes', function() {
        const jml = ['input', {
          value: null,
        }];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, '<input>');
      });

      it('should set boolean attributes', function() {
        const jml = ['input', {
          disabled: true,
          hidden: false,
        }];
        const elem = html.toHTML(jml);
        assert.equal(elem.disabled, true);
        assert.equal(elem.hidden, false);
        assert.equal(elem.outerHTML, '<input disabled="">');
      });

      it('should coerce date objects to strings setting attribute values', function() {
        const someDate = new Date('2015-06-15');
        const jml = ['div', {
          'data-date': someDate,
        }];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML, `<div data-date="${someDate.toString()}"></div>`);
      });
    });


    describe('tables', function() {
      it('should do create table elements from JsonML', function() {
        const jml = ['table', { id: 'my-table', border: 1, cellPadding: 2, cellSpacing: 3 },
          ['thead',
            ['tr', { class: 'row-heading' },
              ['th', '-'],
              ['th', 'A'],
              ['th', 'B'],
            ],
          ],
          ['tbody',
            ['tr', { class: 'row' },
              ['th', '1'],
              ['th', 'a1'],
              ['th', 'b1'],
            ],
            ['tr', { class: 'row-alt' },
              ['th', '2'],
              ['th', { 'data-val': 'foo' }, 'a2'],
              ['th', 'b2'],
            ],
          ],
        ];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML,
          '<table id="my-table" border="1" cellpadding="2" cellspacing="3">' +
          '<thead>' +
          '<tr class="row-heading"><th>-</th><th>A</th><th>B</th></tr>' +
          '</thead>' +
          '<tbody>' +
          '<tr class="row"><th>1</th><th>a1</th><th>b1</th></tr>' +
          '<tr class="row-alt"><th>2</th><th data-val="foo">a2</th><th>b2</th></tr>' +
          '</tbody>' +
          '</table>'
        );
      });

      it('should nest rows inside a tbody if there is no body', function() {
        const jml = ['table',
          ['tr',
            ['td', '1'],
            ['td', '2'],
            ['td', '3'],
          ],
        ];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML,
          '<table>' +
          '<tbody>' +
          '<tr><td>1</td><td>2</td><td>3</td></tr>' +
          '</tbody>' +
          '</table>'
        );
      });

      it('should do create table elements containing multiple tbodies', function() {
        const jml = ['table', { id: 'my-table', border: 1, cellPadding: 2, cellSpacing: 3 },
          ['tbody',
            ['tr', { class: 'row' },
              ['td', 'a1'],
              ['td', 'a2'],
            ],
          ],
          ['tbody',
            ['tr', { class: 'row' },
              ['td', 'b1'],
              ['td', 'b2'],
            ],
          ],
        ];
        const elem = html.toHTML(jml);
        assert.equal(elem.outerHTML,
          '<table id="my-table" border="1" cellpadding="2" cellspacing="3">' +
          '<tbody>' +
          '<tr class="row"><td>a1</td><td>a2</td></tr>' +
          '</tbody>' +
          '<tbody>' +
          '<tr class="row"><td>b1</td><td>b2</td></tr>' +
          '</tbody>' +
          '</table>'
        );
      });
    });

    describe('comments', function() {
      it('should create a comment from JsonML', function() {
        const message = 'this is a comment';
        const jml = ['!', message];
        const elem = html.toHTML(jml);
        assert.equal(elem.toString(), '[object Comment]');
        const div = doc.createElement('div');
        div.appendChild(elem);
        assert.equal(div.innerHTML, `<!--${message}-->`);
      });

      // NOTE: This tests the existing code, but there is no documentation as to why it should be supported
      // The code branch inserts a space after the message
      it('should create a shorthand comment from JsonML', function() {
        const message = 'this is a comment';
        const jml = [`! ${message}`];
        const elem = html.toHTML(jml);
        assert.equal(elem.toString(), '[object Comment]');
        const div = doc.createElement('div');
        div.appendChild(elem);
        assert.equal(div.innerHTML, `<!-- ${message} -->`);
      });
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
        ['strong', 'world'],
      ];
      const text = html.toHTMLText(jml);
      assert.equal(text, '<span data-foo="bar">hello <strong>world</strong></span>');
    });
  });

  describe('when a global document is provided', function() {
    beforeEach(function() {
      delete require.cache[require.resolve('../lib/html')];
    });

    afterEach(function() {
      delete global.window;
      delete global.document;
    });

    after(function() {
      delete require.cache[require.resolve('../lib/html')];
      html = require('../lib/html');
    });

    it('should use the global document', function() {
      global.window = new JSDOM().window;
      global.window.document.createTextNode = str => doc.createTextNode(`text:${str}`);
      html = require('../lib/html');
      assert.equal(html.toHTML('hello world').nodeValue, 'text:hello world');
    });
  });
});
