import {select, templates, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);


  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

  }

  initAccordion(){
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    const trigger = thisProduct.element;

    /* START: click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function(event){

      /* prevent default action for event */
      event.preventDefault();

      /* toggle active class on element of thisProduct */
      if (trigger.classList.contains('active')){
        trigger.classList.remove('active');
      } else {
        trigger.classList.add('active');
      }


      /* find all active products */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

      /* START LOOP: for each active product */
      for (let activeProduct of activeProducts) {

        /* START: if the active product isn't the element of thisProduct */
        if (activeProduct != trigger) {

          /* remove class active for the active product */
          activeProduct.classList.remove('active');

        /* END: if the active product isn't the element of thisProduct */
        }
      /* END LOOP: for each active product */
      }
    /* END: click event listener to trigger */
    });
  }

  initOrderForm(){
    const thisProduct = this;
    //console.log('Product method: initOrderForm');

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    //console.log('Product method: processOrder');

    const formData = utils.serializeFormToObject(thisProduct.form);

    thisProduct.params = {};

    let price = thisProduct.data.price;

    /* START LOOP for every paramID in product */
    for (let paramId in thisProduct.data.params){
      const param = thisProduct.data.params[paramId];
      //console.log('param: ', param);

      /* START LOOP for every optionID in params */
      for (let optionId in param.options){
        const option = param.options[optionId];
        const isSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) != -1;

        if (isSelected && !option.default){
          price += option.price;

        } else if (!isSelected && option.default) {
          price -= option.price;

        }
        const images = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);

        if (isSelected) {
          if (!thisProduct.params[paramId]){
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label;

          for (let image of images) {
            image.classList.add(classNames.menuProduct.imageVisible);
          }

        } else {

          for (let image of images) {
            image.classList.remove(classNames.menuProduct.imageVisible);
          }

        }

      /* END LOOP for every optionID in params */
      }



    /* END LOOP for every paramID in product */
    }

    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;


  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
  }

  addToCart(){
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;

    // app.cart.add(thisProduct);

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;
