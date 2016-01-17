'use strict';
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const ENC = 'utf-8';

const util = {
  getFilePaths(dirPath) {
    return new Promise((resolve, reject) => {
      const pattern = path.join(dirPath, '**/*.+(jpg|jpeg|png|gif)');
      glob(pattern, (err, paths) => {
        return err ? reject(err) : resolve(paths);
      });
    });
  },
  existsFile(filePath) {
    return new Promise(resolve => {
      fs.stat(filePath, (err, stats) => {
        return err ? resolve(false) : resolve(true);
      });
    });
  },
  makeDir(filePath) {
    return new Promise((resolve, reject) => {
      mkdirp(filePath, (err) => {
        return err ? reject(err) : resolve();
      });
    });
  },
  readFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, ENC, (err, content) => {
        return err ? reject(err) : resolve(JSON.parse(content));
      });
    });
  },
  writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(content, null, 2), ENC, (err) => {
        return err ? reject(err) : resolve();
      });
    });
  }
};

module.exports = util;
