import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';
import { select, settings } from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);

    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = new Date(utils.addDays(thisWidget.value , settings.datePicker.maxDaysInFuture));

    const flatpickrInstace = {
      dateFormat: 'Y-m-d',
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,

      'locale': {
        'firstDayOfWeek': 1
      },

      'disable':[
        function(date) {
          return (date.getDay() === 2);
        }
      ],

      onValueUpdate: function(selectedDates, dateStr){
        thisWidget.value = dateStr;
      }

    };

    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, flatpickrInstace);
  }

  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){}
}

export default DatePicker;
