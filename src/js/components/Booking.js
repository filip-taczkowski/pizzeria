import { templates, select, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';


class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();

  }

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.form = element.querySelector(select.booking.form);
    thisBooking.dom.starters = element.querySelectorAll(select.booking.starters);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);

  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount, 1);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount, 1);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker, 1);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker, 1);

    thisBooking.dom.wrapper.addEventListener('updated', () => {
      thisBooking.updateDOM();
    });

    thisBooking.dom.datePicker.addEventListener('updated', () => {
      for (let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.active);
      }
      thisBooking.tableToBook = [];
    });

    thisBooking.dom.hourPicker.addEventListener('updated', () => {
      for (let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.active);
      }
      thisBooking.tableToBook = [];
    });

  }

  getData(){
    const thisBooking = this;


    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params: ', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking + '?'
                                           + params.booking.join('&') ,
      eventsCurrent: settings.db.url + '/' + settings.db.event   + '?'
                                           + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   + '?'
                                           + params.eventsRepeat.join('&'),
    };

    //console.log('getData url: ', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if (item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1) ){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    //console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour ; hourBlock < startHour + duration; hourBlock += 0.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.remove(classNames.booking.active);
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initActions(){
    const thisBooking = this;

    thisBooking.tableToBook = [];

    for (let table of thisBooking.dom.tables){
      table.addEventListener('click', () => {
        //for (let tableToDeactivate of thisBooking.dom.tables){
        //  tableToDeactivate.classList.remove('active');
        //}
        const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));

        table.classList.toggle(
          classNames.booking.active,
          !table.classList.contains(classNames.booking.active) && !table.classList.contains('booked')
        );

        if (table.classList.contains(classNames.booking.active)){
          thisBooking.tableToBook.push(tableId);
        } else if ( thisBooking.tableToBook.indexOf(tableId) != -1 ) {
          thisBooking.tableToBook.splice(thisBooking.tableToBook.indexOf(tableId), 1);
        }

        console.log(thisBooking.tableToBook);
      });
    }



    thisBooking.dom.form.addEventListener('submit', (event) => {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    for (let table of thisBooking.tableToBook ){
      const bookedTable = {
        date: thisBooking.datePicker.value,
        hour: thisBooking.hourPicker.value,
        table: table,
        duration: thisBooking.hoursAmount.value,
        ppl: thisBooking.peopleAmount.value,
        phone: thisBooking.dom.phone.value,
        address: thisBooking.dom.address.value,

        starters: [],
      };

      for (let starter of thisBooking.dom.starters){
        if (starter.checked) {
          bookedTable.starters.push(starter.value);
        }
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookedTable),
      };

      fetch(url, options)
        .then(response => {
          return response.json();
        }).then(parsedResponse => {
          console.log('parsedResponse: ', parsedResponse);
          thisBooking.getData();
          thisBooking.updateDOM();
        });
    }
  }
}

export default Booking;
