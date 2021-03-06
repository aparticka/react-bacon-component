import { Component, createElement } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import Bacon from 'baconjs';
import createAction from './createAction';
import isProperty from './isProperty';

const isReactComponent = c =>
  c && c.prototype && typeof c.prototype.render === 'function';

const createBaconComponent = (mapProps, renderOrComponent, shouldPassThroughProps = false) => {
  const render = isReactComponent(renderOrComponent) ?
    props => createElement(renderOrComponent, props) :
    renderOrComponent;

  return class extends Component {
    constructor(props, context) {
      super(props, context);

      this.receive = createAction();

      this.propsP = this.receive.$.map(x => x[0]).startWith(props).toProperty();
      this.contextP = this.receive.$.map(x => x[1]).startWith(context).toProperty();

      this.setComponentIsMounted = createAction();
      
      this.componentIsMountedP = this.setComponentIsMounted.$
        .skipDuplicates()
        .startWith(false)
        .toProperty();

      this.subscriptions = [];

      this.addSubscription = subscription => this.subscriptions.push(subscription);

      this.childPropsP = mapProps(this.propsP, this.contextP, this.componentIsMountedP, this.addSubscription);

      if (shouldPassThroughProps) {
        this.childPropsP = isProperty(this.childPropsP)
          ? this.childPropsP
            .combine(this.propsP, (childProps, props) => ({ ...props, ...childProps }))
          : this.propsP;
      }

      if (isProperty(this.childPropsP)) {
        const subscribeP = Bacon.combineTemplate({
          childProps: this.childPropsP,
          componentIsMounted: this.componentIsMountedP
        });

        this.unsubscribe = subscribeP
          .onValue(({ childProps, componentIsMounted }) =>
            componentIsMounted ?
              this.setState(childProps) :
              this.state = childProps
        );
      }
    }

    componentDidMount() {
      this.setComponentIsMounted(true);
    }

    componentWillReceiveProps(nextProps, nextContext) {
      this.receive([ nextProps, nextContext ]);
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    componentWillUnmount() {
      this.setComponentIsMounted(false);
      this.subscriptions.forEach(unsubscribe => unsubscribe());
      if (typeof this.unsubscribe === 'function') {
        this.unsubscribe();
      }
    }

    render() {
      return render(this.state);
    }
  }
};

const curry = func => {
  return (a, b, c) =>
    typeof b === 'undefined' ?
      d => func(a, d, c) :
      func(a, b, c);
}

export default curry(createBaconComponent);
