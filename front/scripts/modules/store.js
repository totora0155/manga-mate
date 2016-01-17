'use strict';
const remote = require('remote');
const app = remote.require('app');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const ev = new EventEmitter();
const _ = require('lodash');
const co = require('co');
const util = require('./util');

const config = {
  path: {
    dir: 'manga-mate',
    data: 'data.json'
  }
};

const initData = {
  mangas: [],
  state: {}
};

class Store extends EventEmitter {
  constructor(data) {
    super();
    _.merge(this, data);
  }

  init() {
    const self = this;
    co(function* () {
      const dirPath = path.join(app.getPath('appData'), config.path.dir)
      const dataFilePath = path.join(dirPath, config.path.data);
      if (!(yield util.existsFile(dirPath)))
        yield util.makeDir(dirPath);
      if (!(yield util.existsFile(dataFilePath)))
        yield util.writeFile(dataFilePath, initData, null, 2);
      const data = yield util.readFile(dataFilePath);
      _.merge(self, data);
      self.emit('inited');
    });
  }

  addManga(manga) {
    this.mangas.push(manga);
    return this;
  }

  save() {
    const dirPath = path.join(app.getPath('appData'), config.path.dir)
    const dataFilePath = path.join(dirPath, config.path.data);
    const data = _.pick(this, ['mangas', 'state']);
    co(function* () {
      yield util.writeFile(dataFilePath, data);
    }).catch(err => console.error(err));
  }
}

module.exports = new Store();
