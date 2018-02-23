const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const file = path.join(require('os').homedir(), '.sailer')
const merge = require('merge-deep')

module.exports = class Config {
  constructor () {
    if (fs.existsSync(file)) {
      this._config = jsonfile.readFileSync(file)
    } else {
      this._config = {}
    }
  }

  static getInstance () {
    if (Config._instance === undefined) {
      Config._instance = new Config()
    }
    return Config._instance
  }

  add (object) {
    this._config = merge(this._config, object)
    this.save()
  }

  get (...keys) {
    let conf = this._config
    for (let key of keys) {
      if (conf[key] === undefined) return null
      conf = conf[key]
    }
    return conf
  }

  save () {
    jsonfile.writeFileSync(file, this._config)
    fs.chmodSync(file, '0600')
  }
}
