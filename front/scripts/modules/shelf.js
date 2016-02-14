'use strict';
const path = require('path');
const EventEmitter = require('events');
const remote = require('remote');
const dialog = remote.dialog;
const win = remote.getCurrentWindow();
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
    this.title = this.el.querySelector('#shelfTitle');
    this.halfwayBtn = this.el.querySelector('#halfwayBtn');
    this.beginningBtn = this.el.querySelector('#beginningBtn');
    this.starBtns = this.el.querySelectorAll('.icon__star');
    this.delBtn = this.el.querySelector('.icon__del');
    this.items = null;
  }

  render() {
    const _this = this;
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
    let singleClickTimer = null;
    _.forEach(els, (el) => {
      el.addEventListener('click', (e) => {
        if (singleClickTimer == null) {
          singleClickTimer = setTimeout(() => {
            singleClick.call(_this, e.target.dataset.name);
          }, 180);
        } else {
          clearTimeout(singleClickTimer);
          doubleClick.call(_this, e.target.dataset.name);
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
    this.halfwayBtn.addEventListener('click', () => {
      const manga = _.find(store.mangas, {name: store.state.name});
      this.hidden();
      this.emit('read', manga);
    });
    this.beginningBtn.addEventListener('click', () => {
      const manga = _.find(store.mangas, {name: store.state.name});
      this.hidden();
      this.emit('read', manga, true);
    });
    _.forEach(this.starBtns, (_btn) => {
      let btn = _btn;
      btn.addEventListener('click', () => {
        this.setStar(0);
        btn.classList.add('shelf__disp__star--active');
        store.getManga(store.state.name).state.star = btn.dataset.star;
        store.save();
      });
    });
    this.delBtn.addEventListener('click', () => {
      dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['はい', 'いいえ'],
        message: `「${store.state.name}」を削除します。\nよろしいですか？`,
      }, (idx) => {
        if (idx === 0) {
          const targetIdx = _.findIndex(store.mangas, {name: store.state.name});
          store.mangas.splice(targetIdx, 1);
          const manga = store.mangas[targetIdx]
                            ? store.mangas[targetIdx]
                            : store.mangas[targetIdx-1] || null
          this.setManga(manga ? manga.name : '')
            .then(() => {
              this.render()
            });
          store.save();
        }
      });
    });
  }

  setManga(name) {
    const _this = this;
    const manga = _.find(store.mangas, {name});
    if (manga) {
      return co(function* () {
        const paths = yield util.getFilePaths(manga.dirPath);
        const currentPage = manga.state.currentPage;
        _this.disp.style.cssText =
          `background-image: url(file://${paths[currentPage || 1]})`;
        _this.title.innerText = manga.name;
        _this.setStar(manga.state.star || 0);
        store.state.name = manga.name;
        currentPage === 1
          ? _this.halfwayBtn.classList.add('hidden')
          : _this.halfwayBtn.classList.remove('hidden');
        _this.beginningBtn.classList.remove('hidden');
        store.save();
        _this.render();
      });
    } else {
      return co(function* () {
        _this.setStar(0);
        _this.disp.style.cssText = '';
        _this.title.innerText = '';
        _this.halfwayBtn.classList.add('hidden');
        _this.beginningBtn.classList.add('hidden');
        store.state.name = '';
      });
    }
  }

  init() {
    this.setManga(store.state.name);
  }

  addManga(cb) {
    const self = this;
    dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      filters: [
        {name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']},
      ]
    }, (dirPath) => {
      if (dirPath == null) return;
      const manga = {
        name: dirPath[0].split(path.sep).slice(-1)[0],
        dirPath: dirPath[0],
        state: {
          currentPage: 0,
          star: false
        }
      };
      store.addManga(manga).save();
      self.setManga(manga.name);
      self.start();
      cb && typeof cb === 'function' && cb();
    });
  }

  startEvent() {
    this.addBtn.addEventListener('click', this.addManga.bind(this));
  }

  start() {
    this.visible();
    this.startEvent();
    this.render();
    this.init();
  }

  setStar(starId) {
    removeStar.call(this);
    if (starId > 0) {
      this.el.querySelector(`[data-star="${starId}"]`)
        .classList.add('shelf__disp__star--active');
    }
    function removeStar() {
      _.forEach(this.starBtns, (btn) => {
        btn.classList.remove('shelf__disp__star--active');
      });
    }
  }
}

module.exports = Shelf;
