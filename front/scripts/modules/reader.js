'use strict';
const electron = require('electron');
const remote = electron.remote;
const webFrame = electron.webFrame;
const app = remote.app;
const co = require('co');
const View = require('./view');
const util = require('./util');
const keycodes = require('./keycodes');
let current = null;
const _events = {};

class Reader extends View {
  constructor(id) {
    super(id);
    this.inner = this.el.querySelector('#readerInner');
    this.left = this.el.querySelector('#readerLeft');
    this.right = this.el.querySelector('#readerRight');
    this.bindKeyHandler = _bindKeyHandler.bind(this);
    this.swipeHandler = _swipeHandler.call(this);
    _events.left = this.next.bind(this);
    _events.right = this.prev.bind(this);
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
    this.left.addEventListener('click', _events.left);
    this.right.addEventListener('click', _events.right);
  }

  endEvent() {
    document.removeEventListener('keydown', this.bindKeyHandler);
    window.removeEventListener('wheel', this.swipeHandler);
    this.left.removeEventListener('click', _events.left);
    this.right.removeEventListener('click', _events.right);
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
  const isZoom = () => {
    return innerHeight === document.body.clientHeight;
  };
  let executed = false;
  let scale = 100;
  let swipe = _.throttle((e) => {
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

  let timeout = null;

  const fn = (e) => {
    if (isZoom()) {
      swipe(e);
    }

    // if (e.ctrlKey) {
    //   scale += e.deltaY / 10;
    //   if (scale < 100) scale = 100;
    //   this.el.style.cssText = `width: ${scale}vw; height: ${scale}vh`;
    //   console.log(this.el.clientHeight);
    //   const width = this.el.clientWidth / 4;
    //   const height = this.el.clientHeight / 4;
    //   console.log(width, height);
    //   scroll(width, height);
    // }
  }
  return fn;
}

function zoomHandler() {
}
