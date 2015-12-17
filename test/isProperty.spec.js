import { isProperty } from '../src/index';
import Bacon from 'baconjs';
import { expect } from 'chai';

describe('isProperty', () => {
  it('should return false for non Property elements', () => {
    [ null, {}, [], Bacon.once('test') ]
      .forEach(test => expect(isProperty(test)).to.equal(false));
  });
  it('should return true for Property elements', () => {
    [ Bacon.once('test').toProperty(), Bacon.constant('test'), Bacon.fromArray([1, 2]).scan(0, (sum, x) => sum + x) ]
      .forEach(test => expect(isProperty(test)).to.equal(true));
  });
});
