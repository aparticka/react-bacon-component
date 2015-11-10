import { Component, createElement } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { createAction } from 'megablob';
import Bacon from 'baconjs';

function isReactComponent(c) {
  return c && c.prototype && typeof c.prototype.render === 'function';
}

function isProperty(p) {
  return p && typeof p.changes === 'function';
}

function createBaconComponent(mapProps, renderOrComponent, shouldPassThroughProps = false) {
  const render = isReactComponent(renderOrComponent) ?
    props => createElement(renderOrComponent, props) :
    renderOrComponent;

  return class extends Component {
    constructor(props, context) {
      super(props, context);

      this.receive = createAction();

      this.propsP = this.receive.$.map(x => x[0]).startWith(props).toProperty();
      this.contextP = this.receive.$.map(x => x[1]).startWith(context).toProperty();

      this.setComponentHasMounted = createAction();
      
      this.componentHasMountedP = this.setComponentHasMounted.$
        .skipDuplicates()
        .startWith(false)
        .toProperty();

      this.childPropsP = mapProps(this.propsP, this.contextP, this.componentHasMountedP);

      if (shouldPassThroughProps) {
        this.childPropsP = isProperty(this.childPropsP)
          ? this.childPropsP
            .combine(this.propsP, (childProps, props) => ({ ...props, ...childProps }))
          : this.propsP;
      }

      if (isProperty(this.childPropsP)) {
        const subscribeP = Bacon.combineTemplate({
          childProps: this.childPropsP,
          componentHasMounted: this.componentHasMountedP
        });

        this.unsubscribe = subscribeP
          .onValue(({ childProps, componentHasMounted }) =>
            componentHasMounted ?
              this.setState(childProps) :
              this.state = childProps
        );
      }
    }

    componentDidMount() {
      this.setComponentHasMounted(true);
    }

    componentWillReceiveProps(nextProps, nextContext) {
      this.receive([ nextProps, nextContext ]);
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    componentWillUnmount() {
      if (typeof this.unsubscribe === 'function') {
        this.unsubscribe();
      }
    }

    render() {
      return render(this.state);
    }
  }
}

function curry(func) {
  return (a, b, c) =>
    typeof b === 'undefined' ?
      d => func(a, d, c) :
      func(a, b, c);
}

export default curry(createBaconComponent);
