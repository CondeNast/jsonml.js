'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');
let xml = require('../lib/xml');

const CONTENT_TYPE = 'application/xml';
const XML_PREAMBLE = '<?xml version="1.0" encoding="UTF-8"?>';

function reloadModule(relativePath) {
  delete require.cache[require.resolve(relativePath)];
  return require(relativePath);
}

describe('xml', function() {
  let doc;
  let DOMParser;
  let domParser;
  let window;

  before(function() {
    ({ window } = new JSDOM());
    ({ DOMParser } = window);
    domParser = new DOMParser();
    doc = domParser.parseFromString(`${XML_PREAMBLE}\n<xml/>`, CONTENT_TYPE);
  });

  describe('fromXML', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.fromXML, 'function');
    });

    it('should create a JsonML node from an XML element', function() {
      const xmlStr = '<foo id="my-el"><bar data-x="xyz">hello world</bar></foo>';
      const elem = domParser.parseFromString(xmlStr, CONTENT_TYPE)
        .getElementById('my-el');
      const jml = xml.fromXML(elem);
      assert.deepEqual(jml, ['foo', { id: 'my-el' },
        ['bar', { 'data-x': 'xyz' }, 'hello world'],
      ]);
    });

    it('should create a JsonML node from an XML fragment', function() {
      const elem = doc.createDocumentFragment();
      elem.appendChild(doc.createTextNode('hello'));
      const jml = xml.fromXML(elem);
      assert.deepEqual(jml, ['', 'hello']);
    });

    it('should create a JsonML node from an XML element and apply a filter function', function() {
      const xmlStr = '<foo id="f1"><bar a="1">hello world</bar></foo>';
      const elem = domParser.parseFromString(xmlStr, CONTENT_TYPE)
        .getElementById('f1');
      const jml = xml.fromXML(elem, (jml, el) => {
        jml[1].b = `x-${el.tagName}`;
        return jml;
      });
      assert.deepEqual(jml, ['foo', { id: 'f1', b: 'x-foo' },
        ['bar', { a: '1', b: 'x-bar' }, 'hello world'],
      ]);
    });

    it('should return null if no element is passed', function() {
      assert.equal(xml.fromXML(), null);
    });

    it('should return null if a non-element value is passed', function() {
      assert.equal(xml.fromXML('foo'), null);
      assert.equal(xml.fromXML(5), null);
      assert.equal(xml.fromXML(null), null);
      assert.equal(xml.fromXML([]), null);
      assert.equal(xml.fromXML({}), null);
    });

    describe('doctype', function() {
      let docWithDoctype;
      let docTypeValue;

      before(function() {
        docTypeValue = 'DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"';
        const SVG_DOCTYPE = `<!${docTypeValue}>\n`;
        const xmlStr = `${SVG_DOCTYPE}<svg/>`;
        docWithDoctype = domParser.parseFromString(xmlStr, CONTENT_TYPE);
        assert.notEqual(docWithDoctype.doctype, null);
      });

      it('should transform a doctype node', function() {
        const jml = xml.fromXML(docWithDoctype.doctype);
        assert.deepEqual(jml, ['!', docTypeValue]);
      });

      it('should transform a doctype node with an optional filter', function() {
        const jml = xml.fromXML(docWithDoctype.doctype, (jml, elem) => {
          return jml.concat({ type: elem.toString() });
        });
        assert.deepEqual(jml, ['!', docTypeValue, { type: '[object DocumentType]' }]);
      });
    });

    describe('comments', function() {
      it('should ignore comment nodes', function() {
        const xmlStr = '<foo id="my-el"><!-- this is a test --><bar data-x="xyz">hello world</bar></foo>';
        const elem = domParser.parseFromString(xmlStr, CONTENT_TYPE)
          .getElementById('my-el');
        const jml = xml.fromXML(elem);
        assert.deepEqual(jml, ['foo', { id: 'my-el' },
          ['bar', { 'data-x': 'xyz' }, 'hello world'],
        ]);
      });

      it('should transform a comment node with text starting with "DOCTYPE"', function() {
        const xmlStr = '<content><!--DOCTYPE html--></content>';
        const xmlDoc = domParser.parseFromString(xmlStr, CONTENT_TYPE);
        const content = xmlDoc.querySelectorAll('content')[0];
        const elem = content.childNodes[0];
        assert.equal(elem.nodeType, window.Node.COMMENT_NODE);
        const jml = xml.fromXML(elem);
        assert.deepEqual(jml, ['!', 'DOCTYPE html']);
      });

      it('should apply a filter function to comment nodes starting with "DOCTYPE"', function() {
        const xmlStr = '<content><!--DOCTYPE html--></content>';
        const xmlDoc = domParser.parseFromString(xmlStr, CONTENT_TYPE);
        const content = xmlDoc.querySelectorAll('content')[0];
        const elem = content.childNodes[0];
        const jml = xml.fromXML(elem, jmlEl => {
          const value = jmlEl.pop();
          jmlEl.push(`MY_DOC (${value})`);
          return jmlEl;
        });
        assert.deepEqual(jml, ['!', 'MY_DOC (DOCTYPE html)']);
      });

      it('ignore empty comment nodes', function() {
        const xmlStr = '<foo id="my-el"><!----></foo>';
        const elem = domParser.parseFromString(xmlStr, CONTENT_TYPE)
          .getElementById('my-el');
        const jml = xml.fromXML(elem);
        assert.deepEqual(jml, ['foo', { id: 'my-el' }]);
      });
    });

    describe('ignored types', function() {
      it('should return null for ignored types', function() {
        const xmlStr = [
          XML_PREAMBLE,
          '<?xml-stylesheet type="text/xsl" href="example.xsl"?>',
          '<foo />',
        ].join('\n');
        const xmlDoc = domParser.parseFromString(xmlStr, CONTENT_TYPE);
        const piNode = xmlDoc.childNodes[0];
        assert.equal(piNode.nodeType, window.Node.PROCESSING_INSTRUCTION_NODE);
        assert.equal(xml.fromXML(piNode), null);
      });
    });
  });

  describe('fromXMLText', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.fromXMLText, 'function');
    });

    it('should create a simple JsonML node from an XML string', function() {
      const xmlStr = '<foo/>';
      const jml = xml.fromXMLText(xmlStr);
      assert.deepEqual(jml, ['foo']);
    });

    it('should create a complex JsonML node from an XML string', function() {
      const xmlStr = [
        XML_PREAMBLE,
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
        '  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="120" height="120">',
        '<rect x="14" y="23" width="200" height="50" fill="lime" stroke="black" />',
        '</svg>',
      ].join('');
      const jml = xml.fromXMLText(xmlStr);
      assert.deepEqual(jml, [
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          version: '1.1',
          width: '120',
          height: '120',
        },
        [
          'rect',
          {
            x: '14',
            y: '23',
            width: '200',
            height: '50',
            fill: 'lime',
            stroke: 'black',
          },
        ],
      ]);
    });

    it('should allow a filter param to modify the returned JsonML node', function() {
      const xmlStr = '<foo>hello</foo>';
      const jml = xml.fromXMLText(xmlStr, jml => {
        jml[0] = 'bar';
        return jml;
      });
      assert.deepEqual(jml, ['bar', 'hello']);
    });
  });

  describe('isXML', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.isXML, 'function');
    });

    it('should identify an XML node', function() {
      const node = doc.createElement('foo');
      assert.equal(xml.isXML(node), true);
    });

    it('should return false when given an HTML node', function() {
      const { document } = (new JSDOM()).window;
      const node = document.createElement('foo');
      assert.equal(xml.isXML(node), false);
    });
  });

  describe('parseXML', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.parseXML, 'function');
    });

    it('should return null for any non-string inputs', function() {
      [5, {}, true, undefined].forEach(val => assert.equal(xml.parseXML(val), null));
    });

    it('should return null when passed an empty string', function() {
      assert.equal(xml.parseXML(''), null);
    });

    describe('when using the standard DOMParser', function() {
      it('should parse a document from a simple XML string', function() {
        const xmlStr = '<foo a="b">hi</foo>';
        const xmlDoc = xml.parseXML(xmlStr);
        assert.notEqual(xmlDoc, null);
        const elem = xmlDoc.childNodes[0];
        assert.equal(elem.tagName, 'foo');
        assert.equal(elem.getAttribute('a'), 'b');
        assert.equal(elem.childNodes.length, 1);
        assert.equal(elem.childNodes[0].nodeValue, 'hi');
      });

      it('should parse a document from a complex XML string', function() {
        const svgStr = [
          '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="120" height="120">',
          '<rect x="14" y="23" width="200" height="50" fill="lime" stroke="black"/>',
          '</svg>',
        ].join('');
        const docTypeStr = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
          '  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
        const xmlStr = `${XML_PREAMBLE}\n${docTypeStr}\n${svgStr}`;
        const xmlDoc = xml.parseXML(xmlStr);
        assert.notEqual(xmlDoc, null);
        assert.equal(xmlDoc.childNodes.length, 2);

        assert.equal(xmlDoc.doctype.name, 'svg');
        assert.equal(xmlDoc.doctype.internalSubset, undefined);
        assert.equal(xmlDoc.doctype.publicId, '-//W3C//DTD SVG 1.1//EN');
        assert.equal(xmlDoc.doctype.systemId, 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd');

        const elem = xmlDoc.querySelectorAll('svg')[0];
        assert.notEqual(elem, null);

        assert.equal(elem.tagName, 'svg');
        assert.equal(elem.getAttribute('xmlns'), 'http://www.w3.org/2000/svg');
        assert.equal(elem.getAttribute('version'), '1.1');
        assert.equal(elem.getAttribute('width'), '120');
        assert.equal(elem.getAttribute('height'), '120');
        assert.equal(elem.childNodes.length, 1);

        const rect = elem.childNodes[0];
        assert.equal(rect.tagName, 'rect');
        assert.equal(rect.getAttribute('x'), '14');
        assert.equal(rect.getAttribute('y'), '23');
        assert.equal(rect.getAttribute('width'), '200');
        assert.equal(rect.getAttribute('height'), '50');
        assert.equal(rect.getAttribute('fill'), 'lime');
        assert.equal(rect.getAttribute('stroke'), 'black');
      });
    });

    describe('when using legacy IE XML DOM', function() {
      const MS_XMLDOM = 'Microsoft.XMLDOM';
      function MockActiveXObject(type) {
        this.type = type;
        this.doc = null;
        this.loadXML = xmlStr => {
          if (type === MS_XMLDOM) {
            this.doc = domParser.parseFromString(xmlStr, CONTENT_TYPE);
          }
        };
      }

      before(function() {
        assert.equal(global.window, undefined);
        global.window = { // Prevent using JSDOM
          ActiveXObject: MockActiveXObject,
        };
        xml = reloadModule('../lib/xml');
      });

      after(function() {
        delete global.window;
        xml = reloadModule('../lib/xml');
      });

      it('should parse using window.ActiveXObject', function() {
        const obj = xml.parseXML('<foo/>');
        assert.equal(obj.constructor, global.window.ActiveXObject);
      });

      it('should return an instance of MockActiveXObject for testing', function() {
        const obj = xml.parseXML('<foo/>');
        assert.equal(obj instanceof MockActiveXObject, true);
        assert.equal(obj.hasOwnProperty('type'), true);
        assert.equal(obj.hasOwnProperty('doc'), true);
      });

      it('should load an ActiveXObject using Microsoft.XMLDOM', function() {
        const obj = xml.parseXML('<foo/>');
        assert.equal(obj.type, 'Microsoft.XMLDOM');
      });

      it('should disable async loading with ActiveXObject', function() {
        const obj = xml.parseXML('<foo/>');
        assert.equal(obj.async, 'false');
      });

      it('should parse a document from a simple XML string', function() {
        const xmlStr = '<foo a="b">hi</foo>';
        const { doc: xmlDoc } = xml.parseXML(xmlStr);
        assert.notEqual(xmlDoc, null);
        const elem = xmlDoc.childNodes[0];
        assert.equal(elem.tagName, 'foo');
        assert.equal(elem.getAttribute('a'), 'b');
        assert.equal(elem.childNodes.length, 1);
        assert.equal(elem.childNodes[0].nodeValue, 'hi');
      });
    });

    describe('when no DOM parser is available', function() {
      before(function() {
        assert.equal(global.window, undefined);
        global.window = {}; // Prevent using JSDOM
        // window.DOMParser will be undefined
        // window.ActiveXObject will be undefined
        xml = reloadModule('../lib/xml');
      });

      after(function() {
        delete global.window;
        xml = reloadModule('../lib/xml');
      });

      it('should return null', function() {
        assert.equal(xml.parseXML('<foo/>'), null);
      });
    });
  });

  describe('renderXML', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.renderXML, 'function');
    });

    it('should return null by default', function() {
      assert.equal(xml.renderXML(), null);
    });

    it('should render an XML element to a string', function() {
      const elem = doc.createElement('foo');
      elem.setAttribute('a', 'ok');
      elem.appendChild(doc.createTextNode('hi'));
      assert.equal(xml.renderXML(elem), '<foo a="ok">hi</foo>');
    });

    describe('when XMLSerializer API is not available', function() {
      describe('legacy IE XML', function() {
        before(function() {
          assert.equal(global.window, undefined);
          global.window = {}; // Prevent using JSDOM
          xml = reloadModule('../lib/xml');
        });

        after(function() {
          delete global.window;
          xml = reloadModule('../lib/xml');
        });

        it('should return the element `xml` property', function() {
          const elem = doc.createElement('foo');
          elem.setAttribute('a', 'ok');
          elem.appendChild(doc.createTextNode('hi'));
          assert.equal(elem.xml, undefined);
          elem.xml = '<foo a="ok">hi</foo>';
          assert.equal(xml.renderXML(elem), elem.xml);
        });
      });

      describe('fallback to HTML DOM', function() {
        before(function() {
          assert.equal(global.window, undefined);
          global.window = {}; // Prevent using JSDOM
          xml = reloadModule('../lib/xml');
        });

        after(function() {
          delete global.window;
          xml = reloadModule('../lib/xml');
        });

        it('should return the element outerHTML', function() {
          const elem = doc.createElement('foo');
          elem.setAttribute('a', 'ok');
          elem.appendChild(doc.createTextNode('hi'));
          assert.equal(elem.xml, undefined);
          const expected = '<foo a="ok">hi</foo>';
          assert.equal(xml.renderXML(elem), expected);
          assert.equal(elem.outerHTML, expected);
        });
      });

      describe('fallback to jsdom', function() {
        before(function() {
          assert.equal(global.window, undefined);
          global.window = { // Prevent using JSDOM
            document: doc,
          };
          xml = reloadModule('../lib/xml');
          const Element = doc.createElement('x').constructor;
          delete Element.prototype.outerHTML;
        });

        after(function() {
          delete global.window;
          xml = reloadModule('../lib/xml');
          doc = domParser.parseFromString(`${XML_PREAMBLE}\n<xml/>`, CONTENT_TYPE);
        });

        it('should return the element html using a jsdom document', function() {
          const elem = doc.createElement('foo');
          elem.setAttribute('a', 'ok');
          elem.appendChild(doc.createTextNode('hi'));
          assert.equal(elem.xml, undefined);
          assert.equal(elem.outerHTML, undefined);
          const expected = '<foo a="ok">hi</foo>';
          assert.equal(xml.renderXML(elem), expected);
        });
      });
    });
  });

  describe('toXML', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.toXML, 'function');
    });

    it('should export a method', function() {
      assert.equal(typeof xml.toXML, 'function');
    });

    it('should return null for falsy values', function() {
      assert.strictEqual(xml.toXML(), null);
      assert.strictEqual(xml.toXML(0), null);
      assert.strictEqual(xml.toXML(false), null);
      assert.strictEqual(xml.toXML(NaN), null);
      assert.strictEqual(xml.toXML(''), null);
    });

    it('should return a text node with an error if not passed a valid JsonML node', function() {
      const elem = xml.toXML({});
      assert.equal(elem.constructor.name, 'Text');
      assert.equal(elem.nodeValue, '[SyntaxError: invalid JsonML]');
    });

    it('should create a text node for a string value', function() {
      const elem = xml.toXML('foo');
      assert.equal(elem.constructor.name, 'Text');
      assert.equal(elem.nodeValue, 'foo');
    });

    it('should return a DocumentFragment when passed a JsonML fragment', function() {
      const jml = ['', 'foo ', ['span', 'bar']];
      const elem = xml.toXML(jml);
      assert.equal(elem.constructor.name, 'DocumentFragment');
      assert.equal(elem.childNodes[0].nodeValue, 'foo ');
      assert.equal(elem.childNodes[1].tagName, 'span');
      assert.equal(elem.childNodes[1].childNodes[0].nodeValue, 'bar');
    });

    it('should return the single value when passed a JsonML fragment with one child', function() {
      const jml = ['', ['span', 'bar']];
      const elem = xml.toXML(jml);
      assert.equal(elem.tagName, 'span');
      assert.equal(elem.childNodes.length, 1);
      assert.equal(elem.childNodes[0].nodeValue, 'bar');
    });

    it('should create an XML element for JsonML node', function() {
      const jml = ['span', { 'data-foo': 'bar' }, 'hello'];
      const elem = xml.toXML(jml);
      assert.equal(elem.tagName, 'span');
      assert.equal(elem.getAttribute('data-foo'), 'bar');
      assert.equal(elem.childNodes.length, 1);
      assert.equal(elem.childNodes[0].nodeValue, 'hello');
    });

    it('should create an XML element for JsonML node with children', function() {
      const jml = ['span', { 'data-foo': 'bar' },
        'hello ',
        ['strong', 'world'],
      ];
      const elem = xml.toXML(jml);
      assert.equal(elem.tagName, 'span');
      assert.equal(elem.getAttribute('data-foo'), 'bar');
      assert.equal(elem.childNodes.length, 2);
      assert.equal(elem.childNodes[0].nodeValue, 'hello ');
      assert.equal(elem.childNodes[1].tagName, 'strong');
      assert.equal(elem.childNodes[1].childNodes[0].nodeValue, 'world');
    });

    it('should be able to set element attributes', function() {
      const attrs = {
        id: 'my-el-1',
        name: 'my-best-el',
        className: 'foo bar baz',
        disabled: true,
      };
      const jml = ['input', attrs];
      const elem = xml.toXML(jml);
      assert.equal(elem.getAttribute('id'), attrs.id);
      assert.equal(elem.getAttribute('name'), attrs.name);
      assert.equal(elem.getAttribute('className'), attrs.className);
      assert.equal(elem.getAttribute('disabled'), 'true');
    });

    it('should be able to create a comment element', function() {
      const jml = ['!', 'note for later'];
      const elem = xml.toXML(jml);
      assert.equal(elem.nodeType, window.Node.COMMENT_NODE);
      assert.equal(elem.nodeValue, 'note for later');
    });

    it('should be able to create a doctype node', function() {
      const publicId = '-//W3C//DTD SVG 1.1//EN';
      const systemId = 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd';
      const jml = ['!DOCTYPE', `svg PUBLIC "${publicId}" "${systemId}"`];
      const elem = xml.toXML(jml);
      assert.equal(elem.nodeType, window.Node.COMMENT_NODE);
      assert.equal(elem.nodeValue, `DOCTYPE svg PUBLIC "${publicId}" "${systemId}"`);
    });


    it('should create an element and apply a filter function', function() {
      const jml = ['span', 'hello ',
        ['strong', 'world'],
      ];
      const elem = xml.toXML(jml, el => {
        el.setAttribute('filtered', true);
        return el;
      });
      assert.equal(elem.tagName, 'span');
      assert.equal(elem.getAttribute('filtered'), 'true');
      assert.equal(elem.childNodes[1].tagName, 'strong');
      assert.equal(elem.childNodes[1].getAttribute('filtered'), 'true');
    });
  });

  describe('toXMLText', function() {
    it('should export a method', function() {
      assert.equal(typeof xml.toXMLText, 'function');
    });

    it('should return a string value', function() {
      assert.deepEqual(xml.toXMLText('foo'), 'foo');
    });

    it('should create an XML string from a JsonML node', function() {
      const jml = ['span', { 'data-foo': 'bar' }, 'hello'];
      const text = xml.toXMLText(jml);
      assert.equal(text, '<span data-foo="bar">hello</span>');
    });

    it('should create an XML string from a JsonML node with children', function() {
      const jml = ['span', { 'data-foo': 'bar' },
        'hello ',
        ['strong', 'world'],
      ];
      const text = xml.toXMLText(jml);
      assert.equal(text, '<span data-foo="bar">hello <strong>world</strong></span>');
    });
  });
});
