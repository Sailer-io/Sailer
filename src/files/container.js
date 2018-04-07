const config = require('./config').getInstance()

module.exports = class Container {
    constructor (domain, uid, repo){
        this._domain = domain
        this._uid = uid
        this._repo = repo
    }

    save(){
        const containersObject = {data: {containers: {}}}
        const container = {domain: this._domain, uid: this._uid, repo: this._repo}
        containersObject[`data`][`containers`][this._uid] = container
        config.add(containersObject)
    }

    static find(containerUid){
        return config.get(`data`, `containers`, containerUid)
    }
}