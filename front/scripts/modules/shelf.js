'use strict';
const path = require('path');
const EventEmitter = require('events');
const remote = require('remote');
const win = remote.getCurrentWindow();
const dialog = remote.dialog;
const _ = require('lodash');
const co = require('co');
const View = require('./view');
const store = require('./store');
const util = require('./util');

class Shelf extends View {
  constructor(id) {
    super(id);
    this.addBtn = this.el.querySelector('#shelfAddBtn');
    this.list = this.el.querySelector('#shelfList');
    this.disp = this.el.querySelector('#shelfDisp');
    this.items = null;
  }

  render() {
    const self = this;
    const markup = _.template(`
<% _.forEach(mangas, manga => { %>
<li class="shelf__item">
  <a role="button" data-name="<%= manga.name %>"
  class="shelf__a<%= state.name === manga.name ? ' shelf__a--active' : ''%>">
    <%= manga.name %>
  </a>
</li>
<% }); %>
    `)({mangas: store.mangas, state: store.state});
    this.list.innerHTML = markup;
    const els = this.el.querySelectorAll('.shelf__a');
    var singleClickTimer, clickCount = 0;
    _.forEach(els, el => {
      el.addEventListener('click', e => {
        clickCount++;
        if (clickCount === 1) {
          singleClickTimer = setTimeout(function() {
            clickCount = 0;
            singleClick.bind(self)(e.target.dataset.name);
          }, 200);
        } else if (clickCount === 2) {
          clearTimeout(singleClickTimer);
          clickCount = 0;
          doubleClick.bind(self)(e.target.dataset.name);
        }
      });
    });
    function singleClick(mangaName) {
      this.setManga(mangaName);
    }
    function doubleClick(mangaName) {
      const manga = _.find(store.mangas, {name: mangaName});
      this.hidden();
      this.emit('read', manga);
    }
  }

  setManga(name) {
    const self = this;
    const manga = _.find(store.mangas, {name});
    co(function* () {
      const paths = yield util.getFilePaths(manga.dirPath);
      self.disp.style.cssText = `background-image: url(file://${paths[0]})`;
      store.state.name = manga.name;
      store.save();
      self.render();
    });
  }

  init() {
    this.setManga(store.state.name);
  }

  addManga() {
    const self = this;
    dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      filters: [
        {name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']},
      ]
    }, dirPath => {
      const manga = {
        name: dirPath[0].split(path.sep).slice(-1)[0],
        dirPath: dirPath[0],
        state: {
          currentPage: 0,
          star: false
        }
      };
      store.addManga(manga).save();
      self.render();
    });
  }

  startEvent() {
    this.addBtn.addEventListener('click', this.addManga.bind(this));
  }

  start() {
    this.visible();
    // this.startEvent();
    // this.render();
    // this.init();
  }
}

module.exports = Shelf;
