'use strict';
const EventEmitter = require('events');
const ev = new EventEmitter();

class Manga {
  constructor (name, dirname, state) {
    this.name = name;
    this.dirname = dirname;
    this.state = state;
  }
}
