import { createAction } from '../src/index';
import Bacon from 'baconjs';
import { expect } from 'chai';

describe('createAction', () => {
  it('should create a function', () => {
    const action = createAction();
    expect(typeof action).to.equal('function');
  });
  it('should have a Bus as a property', () => {
    const action = createAction();
    expect(!!action.$).to.equal(true);
    expect(typeof action.$.onValue).to.equal('function');
  })
  it('should add values to the Bus when called', () => {
    let count = 0;
    const action = createAction();
    action.$.onValue(value => count += value);
    expect(count).to.equal(0);
    action(1);
    expect(count).to.equal(1);
    action(10);
    expect(count).to.equal(11);
  });
});
