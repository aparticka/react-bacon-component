import Bacon from 'baconjs';

// modeled after MEGABLOB implementation by @milankinen
export default () => {
  const bus = new Bacon.Bus();
  const action = value => bus.push(value);
  action.$ = bus;
  return action;
};
