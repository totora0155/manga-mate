'use strict';
const _ = require('lodash');
const glob = require('glob');
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const win = remote.getCurrentWindow();
const dialog = remote.dialog;
const app = remote.app;
// const Manga = require('./scripts/modules/manga');
const store = require('./scripts/modules/store');
const Shelf = require('./scripts/modules/shelf');
const Reader = require('./scripts/modules/reader');

const shelf = new Shelf('shelf');
const reader = new Reader('reader');

store.init();
store.once('inited', () => {
  if (!store.mangas || store.mangas.length === 0) {
    const guide = document.getElementById('guide');
    const guideBtn = document.getElementById('guideBtn');
    guide.classList.remove('hidden');

    guideBtn.addEventListener('click', () => {
      shelf.addManga(() => guide.classList.add('hidden'));
    });

    return;
  }

  if (store.state.type === 'shelf') {
    shelf.start();
  } else if (store.state.type === 'manga') {
    const manga = _.find(store.mangas, {name: store.state.name});
    reader.start(manga);
  }
});

shelf.on('read', (manga, reset) => {
  store.state.type = 'manga';
  reader.start(manga, reset);
});

reader.on('end', () => {
  store.state.type = 'shelf';
  shelf.start();
});

win.on('close', () =>  store.save());
