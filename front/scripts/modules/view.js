'use strict';
const EventEmitter = require('events');
const store = require('./store');

class View extends EventEmitter {
  constructor(id) {
    super();
    this.el = document.getElementById(id);
  }

  visible() {
    this.el.classList.remove('hidden');
    store.save();
  }

  hidden() {
    this.el.classList.add('hidden');
  }
}

module.exports = View;
