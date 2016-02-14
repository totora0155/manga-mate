'use strict';
const remote = require('remote');
const app = remote.app;
const co = require('co');
const View = require('./view');
const util = require('./util');
const keycodes = require('./keycodes');
let current = null;

class Reader extends View {
  constructor(id) {
    super(id);
    this.left = this.el.querySelector('#readerLeft');
    this.right = this.el.querySelector('#readerRight');
    this.bindKeyHandler = _bindKeyHandler.bind(this);
    this.swipeHandler = _swipeHandler.call(this);
  }

  set() {
    const leftPath = 'file://' + current.pages[current.state.currentPage + 1];
    const rightPath = 'file://' + current.pages[current.state.currentPage];
    this.left.style.cssText = `background-image: url(${leftPath});`
    this.right.style.cssText = `background-image: url(${rightPath});`
  }

  next() {
    (function(c) {
      if (c.state.currentPage + 2 < c.pages.length - 1) {
        c.state.currentPage += 2;
      } else if (c.state.currentPage + 1 < c.pages.length - 1) {
        c.state.currentPage += 1;
      }
    })(current);
    this.set();
  }

  prev() {
    (function(c) {
      if (c.state.currentPage - 2 > -1) {
        c.state.currentPage -= 2;
      } else if (c.state.currentpage - 1 > -1) {
        c.state.currentPage -= 1;
      }
    })(current);
    this.set();
  }

  startEvent() {
    document.addEventListener('keydown', this.bindKeyHandler);
    window.addEventListener('wheel', this.swipeHandler);
  }

  endEvent() {
    document.removeEventListener('keydown', this.bindKeyHandler);
    window.removeEventListener('wheel', this.swipeHandler);
  }

  start(manga, reset) {
    const self = this;
    if (reset) {
      manga.state.currentPage = 1;
    }
    current = manga;
    co(function* () {
      current.pages = yield util.getFilePaths(manga.dirPath);
      self.set();
      self.startEvent();
      self.visible();
    });
  }

  end() {
    this.endEvent();
    this.hidden();
    this.emit('end');
  }
}

module.exports = Reader;

function _bindKeyHandler(e) {
  if (
    keycodes[e.keyCode] === 'right'
    || keycodes[e.keyCode] === 'k'
    || (keycodes[e.keyCode] === 'n' && e.ctrlKey)
  ) {
    this.prev();
    return;
  }
  if (
    keycodes[e.keyCode] === 'left'
    || keycodes[e.keyCode] === 'space'
    || keycodes[e.keyCode] === 'j'
    || (keycodes[e.keyCode] === 'p' && e.ctrlKey)
  ) {
    this.next();
    return;
  }

  if (keycodes[e.keyCode] === 'esc') {
    this.end();
    return;
  }
}

function _swipeHandler() {
  let executed = false;
  const fn = _.throttle((e) => {
    if (Math.abs(e.deltaX) < 20) {
      executed = false;
    } else if (!executed) {
      if (e.deltaX < -60) {
        executed = true;
        this.next();
      } else if (e.deltaX > 60) {
        executed = true;
        this.prev();
      }
    }
  }, 80);
  return fn;
}
