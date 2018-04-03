const fs = require(`fs`)
const jsonfile = require(`jsonfile`)
const path = require(`path`)
const merge = require(`merge-deep`)
const db = require(`./database`)

module.exports = class Config {
  constructor () {
    this._col = db.getCollection(`config`)
    if (this._col === null){
      this._config = {}
    }else{
      this._config = this._col.find()
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
    db.removeCollection(`config`)
    this._col = db.addCollection(`config`)
    this._col.insert(this._config)
    db.saveDatabase()
    db.close()
  }
}
