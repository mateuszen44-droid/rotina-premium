const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Store {
  constructor(opts) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, (opts.name || 'store') + '.json');
    this.data = this.parseDataFile(this.path);
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    return true;
  }

  clear() {
    this.data = {};
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    return true;
  }

  parseDataFile(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      return {};
    }
  }
}

module.exports = Store;
