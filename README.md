# react-bacon-component

Utility for attaching Bacon.js to React components

```
npm install --save react-bacon-component baconjs
```

## API

```js
import { createBaconComponent } from 'react-bacon-component';
```

### `createBaconComponent(mapProps, [renderOrComponent], [shouldPassThroughProps])`

Creates a React component or a higher-order component.

`mapProps()` maps Bacon.js `Property`s containing the props, context, and component mount status to a `Property` that will be passed as props to the child element.

`mapProps([propsP], [contextP], [componentHasMountedP], [addSubscription])`

`propsP` A `Property` containing the owner component's props

`contextP` A `Property` containing the context

`componentHasMountedP` A `Property` containing the component's mount status (boolean)

`addSubscription` A function that takes a subscription to be unsubscribed from when the component unmounts

```js
const CountToNumber = createBaconComponent((propsP, contextP) => {
  const countP = Bacon.interval(1000)
    .scan(0, x => x + 1)
    .combine(propsP, (count, props) => ({ count, number: props.number }))
    .takeWhile(x => x.count <= x.number)
    .map(x => x.count);
  return Bacon.combineTemplate({
    count: countP
  })
    .combine(propsP, (template, props) => ({ ...props, ...template }));
}, props => <div>Counting to {props.number}... {props.count}</div>);

render(<CountToNumber number={3} />, targetEl);
```

The `mapProps()` function above uses the props passed to the component that is produced to determine when to stop counting.

If `shouldPassThroughProps` is set to `true`, the props are automatically passed through to the child element.

```js
const Counter = createBaconComponent(() => {
  const countP = Bacon.interval(1000)
    .scan(0, x => x + 1);
  return Bacon.combineTemplate({
    count: countP
  });
}, props => <div>{props.name} - {props.count}</div>, true);

render(<Counter name='My Counter' />, targetEl);
```

Even though the props are not explicitly returned from `mapProps()`, because `shouldPassThroughProps` was set to `true` the props are passed through and are available in the render method of the resulting component.

If the second parameter of `createBaconComponent` is left off, a higher-order component is returned.

### `isProperty(element)`

Tests whether the element passed to it is a Bacon `Property`.

### `createAction()`

Creates an action that can be called which adds a value to a `Bus` which is accessible via the `$` property. Credit goes to [@milankinen](https://github.com/milankinen) and his [MEGABLOB](https://github.com/milankinen/megablob/blob/master/src/createAction.js) implementation.

```js
let count = 0;
const incrementCountBy = createAction();
incrementCountBy.$.onValue(value => count += value);
incrementCountBy(1); // count = 1
incrementCountBy(7); // count = 8
```

## Credits

- Andrew Clark [@acdlite](https://github.com/acdlite) - the bulk of the code is taken from his [react-rx-component](https://github.com/acdlite/react-rx-component) library
- Matti Lankinen [@milankinen](https://github.com/milankinen) - his submission to [@staltz](https://github.com/staltz)'s [Flux Challenge](https://github.com/staltz/flux-challenge) was my inspiration to start working with Bacon.js
