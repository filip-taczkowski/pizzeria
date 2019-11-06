import {settings, select} from '../settings.js';

class AmountWidget{
  constructor(element, value){
    const thisWidget = this;

    thisWidget.getElements(element);
    if (!value) {
      thisWidget.value = settings.amountWidget.defaultValue;
    } else {
      thisWidget.value = value;
    }

    thisWidget.setValue(thisWidget.value);
    thisWidget.initActions();

    //console.log('AmountWidget: ', thisWidget);
    //console.log('constructor argument: ', element);
  }

  getElements(element){
    const thisWidget = this;

    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);

  }

  setValue(value){
    const thisWidget = this;

    const newValue = parseInt(value);

    /* TODO: Add validation */
    if (newValue != thisWidget.value
      && newValue >= settings.amountWidget.defaultMin
      && newValue <= settings.amountWidget.defaultMax ){

      thisWidget.value = newValue;
      thisWidget.announce();

    }

    thisWidget.input.value = thisWidget.value;

  }

  initActions(){
    const thisWidget = this;

    thisWidget.input.addEventListener('change', function(){
      thisWidget.setValue(thisWidget.input.value);
    });

    thisWidget.linkDecrease.addEventListener('click', function(event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.linkIncrease.addEventListener('click', function(event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });

  }

  announce(){
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.element.dispatchEvent(event);
  }
}

export default AmountWidget;
