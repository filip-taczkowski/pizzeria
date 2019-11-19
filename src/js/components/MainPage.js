import { templates } from '../settings.js';

class MainPage {
  constructor(element){
    const thisMainPage = this;

    thisMainPage.render(element);
  }

  render(element){
    const thisMainPage = this;

    const generatedHTML = templates.mainPage();

    thisMainPage.dom = {};
    thisMainPage.dom.wrapper = element;
    thisMainPage.dom.wrapper.innerHTML = generatedHTML;
  }
}

export default MainPage;
