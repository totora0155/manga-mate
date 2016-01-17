'use strict';
const remote = require('remote');
const app = remote.app;
const co = require('co');
const View = require('./view');
const util = require('./util');
const keycodes = require('./keycodes');
var current = null;

class Reader extends View {
  constructor(id) {
    super(id);
    this.left = this.el.querySelector('#readerLeft');
    this.right = this.el.querySelector('#readerRight');
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


  bindKeyHandler(e) {
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

  startEvent() {
    document.addEventListener('keydown', this.bindKeyHandler.bind(this));
  }

  endEvent() {
    document.removeEventListener('keydown', this.bindKeyHandler.bind(this));
  }

  start(manga) {
    const self = this;
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
