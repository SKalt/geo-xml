import { delete_, transaction } from '../src/index.js';
import { filter, idFilter } from '@geo-xml/fes-2';
import { test, expect } from 'vitest';

const layer: string = 'myLayer';
test('deleting a feature by id', () => {
  const del = delete_(layer, filter(idFilter('myLayer.id')));
  const actual = transaction([del])();
  expect(actual).toMatchFileSnapshot('./snapshots/delete.example.xml');
});
