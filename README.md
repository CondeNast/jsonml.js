# jsonml.js

[![Build Status](https://travis-ci.org/CondeNast/jsonml.js.svg?branch=master)](https://travis-ci.org/CondeNast/jsonml.js)
[![Coverage Status](https://coveralls.io/repos/github/CondeNast/jsonml.js/badge.svg)](https://coveralls.io/github/CondeNast/jsonml.js)

JsonML-related tools.

## Forked Library

Forked from [benjycui/jsonml.js](https://github.com/benjycui/jsonml.js) since it is used by many Condé Nast applications but is not actively supported. Fork created by [pgoldrbx](https://github.com/pgoldrbx).

We are extremely grateful for the [original work](https://github.com/mckamey/jsonml) Stephen M. McKamey, and the adaptation for node by [benjycui](https://github.com/benjycui).

## Maintainers

- Phil Gold ([@pgoldrbx](https://github.com/pgoldrbx) / phil_gold@condenast.com)

## Install

```sh
npm install --save @condenast/jsonml.js
```

## Usage

```js
// To import all the tools
const JsonML = require('@condenast/jsonml.js');

// Only import utils
const JsonML = require('@condenast/jsonml.js/dist/utils');
```

## API

### Types

- **`JsonML`** `{string|Array}` - a JsonML node or value
  NOTE: this type is used for documentation only and is not exported by the module.

### DOM

```js
const { dom } = require('@condenast/jsonml.js');
```

#### `fromHTML( elem, filter)`

Create JsonML tree from DOM, given a root DOM Element.

- `@param` `{Element}` elem - DOM [Element]
- `@param` `{Function}` filter - optional method to apply on every created JsonML node
  The filter method is called with the signature: `filter( jml, elem ) => jml`
- `@returns` `{JsonML}` a JsonML node

[Element]: https://developer.mozilla.org/en-US/docs/Web/API/Element

#### `fromHTMLText( string: html, Function: filter)`

Create JsonML tree from HTML string.

- `@param` `{string}` html - HTML string
- `@param` `{Function}` filter - optional method to apply on every created JsonML node
    The filter method is called with the signature: `filter( jml, elem ) => jml`
- `@returns` `{JsonML}` a JsonML node

-----

### HTML

```js
const { html } = require('@condenast/jsonml.js');
```

#### `toHTML( jml, filter )`

Generate an HTML DOM tree given a JsonML structure. An optional `filter` method can be passed and will be applied to each node.

- `@param` `{string|Array}` jml - JsonML structure
- `@param` `{Function}` [filter] - optional method applied to each node during render
  The filter method is called with the signature: `filter( elem ) => elem`
- `@returns` `{Element}` DOM Element


#### `toHTMLText( jml, filter )`

Generate an HTML string given a JsonML structure. An optional `filter` method can be passed and will be applied to each node.

Warning: Not current efficient

- `@param` `{string|Array}` jml - JsonML structure
- `@param` `{Function}` [filter] - optional method applied to each node during render
  The filter method is called with the signature: `filter( elem ) => elem`
- `@returns` `{string}` HTML text

#### `raw( value ) : Markup`

Create a new `Markup` instance wrapping the given `value`.

- `@param` `{string}` value - markup text value
- `@returns` `{Markup}` instance of `Markup` wrapper containing the given value

#### `isRaw( value )`

Determines if a given value is a `Markup` instance wrapping a string value.

- `@param` `{any}` value - any value to evaluate
- `@returns` `{boolean}` true if an instance of Markup (a "raw" node)

#### `onerror( ex )`

- `@param` `{Error}` exception

**NOTE**: This export is `null` by default. The `onerror` property is exported as a placeholder to be overridden with a custom error handler if desired.

Example:
```js
html.onerror = ex => console.error(ex);
```

#### `patch(elem, jml, filter)`

Update an existing DOM node from JsonML.

This method can be used to append attributes or elements but not remove either. Nor can it be used to modify the tagName of the selected element. It also cannot be used to modify the content of a text node.

- `@param` `{Element}` elem - DOM [Element]
- `@param` `{any}` jml
- `@param` `{Function}` filter
  The filter method is called with the signature: `filter( elem ) => elem`
- `@returns` `{Element}` DOM element

**Example**
```html
<div id="my-el"></div>
```
```js
const elem = document.getElementById('my-el');
html.patch(elem, ['div', { class: 'foo' }, ['span', 'hello']]);
```
```html
<div class="foo" id="my-el">
  <span>hello</span>
</div>
```

-----

### Utils

```js
const { utils } = require('@condenast/jsonml.js');
```

#### Working with JsonML Nodes
##### `appendChild( parent, child )`

Append a child JsonML node to a given parent node

- `@param` `{JsonML}` parent - JsonML node
- `@param` `{JsonML}` child - JsonML content to be appended to the parent node

##### `getChildren( jml )`

Get all child JsonML nodes of a given node

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{JsonML[]}` child nodes

##### `getTagName( jml )`

Get the tag name of a JsonML node

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{string}` tag name

##### `isAttributes( jml )`

Determine if an object is a JsonML attributes object

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{boolean}` true if a JsonML attribute object

##### `isElement( jml )`

Identify a valid JsonML node

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{boolean}` true if a valid JsonML node or string value

##### `isFragment( jml )`

Identify a JsonML fragment without any tag or type

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{boolean}` true if JsonML fragment (node without a tag name)

##### `isMarkup( value )`

Identify a raw Markup element

- `@param` `{any}` value - value to test
- `@returns` `{boolean}` true if representing a raw Markup element

#### Working with JsonML Attributes

##### `addAttributes( jml, attr )`

Adds attributes to a JsonML node

- `@param` `{JsonML}` jml - JsonML node
- `@param` `{Object}` attr - attributes

##### `getAttribute( jml, string: key )`

Get an attribute value from a JsonML node, given an attribute name.

- `@param` `{JsonML}` jml - JsonML node
- `@param` `{string}` key - attribute name
- `@returns` `{any}` value

##### `getAttributes( jml, boolean: addIfMissing )`

Get all attributes for a given JsonML node

- `@param` `{JsonML}` jml - JsonML node
- `@param` `{boolean}` addIfMissing - when `true`, an empty attributes object will be initialized on the node if none exists
- `@returns` `{Object}` attributes

##### `hasAttributes( jml )`

Determine if a JsonML node has attributes

- `@param` `{JsonML}` jml - JsonML node
- `@returns` `{boolean}` true if the node has attributes

##### `setAttribute( jml, key, value )`

- `@param` `{JsonML}` jml - JsonML node
- `@param` `{string}` key - attribute name
- `@param` `{any}` value - attribute value

### XML

```js
const { xml } = require('@condenast/jsonml.js');
```

#### `fromXML( elem, filter )`

Converts XML nodes to JsonML

- `@param` `{Element}` elem - XML DOM node
- `@param` `{Function}` filter - optional method to apply on every created JsonML node
  The filter method is called with the signature: `filter( jml, elem ) => jml`
- `@returns` `{JsonML|null}` a JsonML node

#### `fromXMLText( xmlText, filter )`

Converts XML text to JsonML

- `@param` `{string}` xmlText - XML text
- `@param` `{Function}` filter - optional method to apply on every created JsonML node
  The filter method is called with the signature: `filter( jml, elem ) => jml`
- `@returns` `{JsonML|null}` a JsonML node

#### `isXML( value )`

- `@param` `{any}` value - Input value to test
- `@returns` `{boolean}` true if an XML DOM node

#### `parseXML( xmlText )`

Converts XML text to XML DOM nodes

- `@param` `{string}` xmlText - XML text
- `@returns` `{XMLDocument}` xml document

#### `renderXML( elem )`

Converts XML DOM nodes to XML text

- `@param` `{Element}` elem - XML DOM node
- `@returns` `{string}` XML string

#### `toXML( jml, filter )`

- `@param` `{JsonML}` jml - JsonML structure
- `@param` `{Function}` filter - optional method applied to each node during render
  The filter method is called with the signature: `filter( elem ) => elem`
- `@returns` `{Element}` XML DOM Element

#### `toXMLText( jml, filter )`

Converts JsonML to XML text

- `@param` `{JsonML}` jml - JsonML structure
- `@param` `{Function}` filter - optional method applied to each node during render
  The filter method is called with the signature: `filter( elem ) => elem`
- `@returns` `{string}` XML string

-----

## License

MIT
