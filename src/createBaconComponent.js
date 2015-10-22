import { Component, createElement } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { createAction } from 'megablob';

function isReactComponent(c) {
  return c && c.prototype && typeof c.prototype.render === 'function';
}

function createBaconComponent(mapProps, renderOrComponent) {
  const render = isReactComponent(renderOrComponent) ?
    props => createElement(renderOrComponent, props) :
    renderOrComponent;

  return class extends Component {
    constructor(props, context) {
      super(props, context);

      this.receive = createAction();

      this.propsP = this.receive.$.map(x => x[0]).startWith(props).toProperty();
      this.contextP = this.receive.$.map(x => x[1]).startWith(context).toProperty();

      this.childPropsP = mapProps.length == 0 ?
        mapProps().combine(this.propsP, (childProps, props) => ({ ...props, ...childProps })) :
        mapProps(this.propsP, this.contextP);

      this.componentHasMounted = false;

      this.unsubscribe = this.childPropsP
        .onValue(childProps =>
          this.componentHasMounted ?
            this.setState(childProps) :
            this.state = childProps
        );
    }

    componentDidMount() {
      this.componentHasMounted = true;
    }

    componentWillReceiveProps(nextProps, nextContext) {
      this.receive([ nextProps, nextContext ]);
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    componentWillUnmount() {
      this.unsubscribe();
    }

    render() {
      return render(this.state);
    }
  }
}

function curry(func) {
  return (a, b) =>
    typeof b === 'undefined' ?
      c => func(a, c) :
      func(a, b);
}

export default curry(createBaconComponent);
