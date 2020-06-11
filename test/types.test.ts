import {
  Attributes,
  AttributeValue,
  JSONMLNode,
} from '..';

import * as jsonml from '..';

// Utils
const isFragYes: boolean = jsonml.isFragment(['', 'hi']);
const isFragNo: boolean = jsonml.isFragment(['div', 'hi']);

const isMarkupYes: boolean = jsonml.isMarkup(jsonml.raw('hello'));
const isMarkupNo: boolean = jsonml.isMarkup(['div', 'hello']);

const paraTag: string = jsonml.getTagName(['p', 'some text']);
const fragTag: string = jsonml.getTagName(['', 'some fragment text']);

const foo = jsonml.getTagName([
  '', // fragment
  { foo: 'bar' }, // attributes allowed here
  ['p', { foo: 'bar' }, 'some fragment text'],
  ['p', { foo: 'bar' }, 'some fragment text'],
  ['div', 'foo'],
  'baz'
]);

const isElemYes: boolean = jsonml.isElement(['img', { href: 'https://example.com/foo.jpg' }]);
const isElemNo: boolean = jsonml.isElement({});

const isAttrsYes: boolean = jsonml.isAttributes({ foo: 'bar' });
const isAttrsNo: boolean = jsonml.isAttributes(['foo']);

const hasAttrsYes: boolean = jsonml.hasAttributes(['p', { foo: 'bar' }]);
const hasAttrsNo: boolean = jsonml.hasAttributes(['p']);

const gotAttrs: Attributes = jsonml.getAttributes(['p', { foo: 'bar' }]);
const gotAddedAttrs: Attributes = jsonml.getAttributes(['p'], true);
const gotEmptyAttrs: Attributes = jsonml.getAttributes(['p'], false);

const addAttributesRetval: void = jsonml.addAttributes(['p'], { foo: 'bar', a: 1 });

type MaybeAttributeValue = AttributeValue | void;
const gotAttr: MaybeAttributeValue = jsonml.getAttribute(['p', { foo: 'bar' }], 'foo');
const gotNoAttr: MaybeAttributeValue = jsonml.getAttribute(['p', { foo: 'bar' }], 'this-does-not-exist');

const setAttributeRetval: void = jsonml.setAttribute(['p'], 'foo', 'bar');

const childWasAppended: boolean = jsonml.appendChild(['p', { foo: 'bar'}], ['strong', 'Hello World', ['em', 'another'], 'bye' ]);

const gotChildren: JSONMLNode[] = jsonml.getChildren(['div', ['p', 'one'], ['p', 'two'], 'foo']);
