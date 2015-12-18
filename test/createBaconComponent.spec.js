import { createBaconComponent } from '../src/index';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import Bacon from 'baconjs';
import { expect } from 'chai';

function getRenderedComponentInContainer(Component, Container) {
  const rendered = TestUtils.renderIntoDocument(
    <Container pass='through' />
  );
  return TestUtils.findRenderedComponentWithType(rendered, Component);
}

function createAction() {
  const bus = new Bacon.Bus();
  const action = value => bus.push(value);
  action.$ = bus;
  return action;
}

describe('createBaconComponent', () => {
  const Component = React.createClass({ render: () => <div /> });
  const mapProps = () => Bacon.combineTemplate();
  const render = props => <Component {...props} />;

  it('should create a higher-order component if second argument undefined', () => {
    const Container = createBaconComponent(mapProps);
    expect(typeof Container).to.equal('function');
    expect(Container.length).to.equal(1);
  });
  it('should create a React component if second argument defined', () => {
    const Container = createBaconComponent(mapProps, render);
    expect(typeof Container.prototype.render).to.equal('function');
  });
  it('should pass props through if shouldPassPropsThrough set to true', () => {
    const Container = createBaconComponent(mapProps, render, true);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(component.props.pass).to.equal('through');
  });
  it('should not pass props through if shouldPassPropsThrough set to false', () => {
    const Container = createBaconComponent(mapProps, render);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(component.props.pass).to.equal(undefined);
  });
  it('should pass props from Bacon Property to component', () => {
    const Container = createBaconComponent(() => {
      return Bacon.combineTemplate({ passed: Bacon.constant('fromBacon') });
    }, render);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(component.props.passed).to.equal('fromBacon');
  });
  it('should be passed props and context `Property`\'s accessible in mapProps', () => {
    let props, context;
    const Container = createBaconComponent((propsP, contextP) => {
      props = propsP;
      context = contextP;
      return propsP;
    }, render);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(typeof props.changes).to.equal('function');
    expect(typeof context.changes).to.equal('function');
  });
  it('should be passed props and context `Property`\'s accessible in mapProps if shouldPassThroughProps true', () => {
    let props, context;
    const Container = createBaconComponent((propsP, contextP) => {
      props = propsP;
      context = contextP;
      return propsP;
    }, render, true);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(typeof props.changes).to.equal('function');
    expect(typeof context.changes).to.equal('function');
  });
  it('should not throw an error when not returning anything from mapProps with shouldPassThroughProps true', () => {
    const Container = createBaconComponent(() => {}, render, true);
    expect(() => getRenderedComponentInContainer(Component, Container)).to.not.throw(Error);
  });
  it('should not clean up subscriptions after unmount if not sent through addSubscription', () => {
    const increment = createAction();
    let count = 0;
    const Container = createBaconComponent(() => {
      increment.$
        .onValue(() => count += 1);
    }, render);
    expect(count).to.equal(0);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(count).to.equal(0);
    increment();
    expect(count).to.equal(1);
    increment();
    expect(count).to.equal(2);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    expect(count).to.equal(2);
    increment();
    expect(count).to.equal(3);
  });
  it('should clean up subscriptions after unmount if sent through addSubscription', () => {
    const increment = createAction();
    let count = 0;
    const Container = createBaconComponent((propsP, contextP, componentIsMountedP, addSubscription) => {
      addSubscription(increment.$
        .onValue(() => count += 1));
    }, render);
    expect(count).to.equal(0);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(count).to.equal(0);
    increment();
    expect(count).to.equal(1);
    increment();
    expect(count).to.equal(2);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    expect(count).to.equal(2);
    increment();
    expect(count).to.equal(2);
  });
  it('should notify when component mounts and unmounts', () => {
    let isMounted = false;
    const Container = createBaconComponent((propsP, contextP, componentIsMountedP) => {
      componentIsMountedP.onValue(status => isMounted = status);
    }, render);
    expect(isMounted).to.equal(false);
    const component = getRenderedComponentInContainer(Component, Container);
    expect(isMounted).to.equal(true);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    expect(isMounted).to.equal(false);
  });
});