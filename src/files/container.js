const config = require(`./config`).getInstance()
const axios = require(`./axios`)
const server = require(`./master/server`).getInstance()

module.exports = class Container {
    constructor (domain, uid, repo){
        this._domain = domain
        this._uid = uid
        this._repo = repo
    }

    save(){
        return new Promise((resolve, reject) => {
            const containersObject = {data: {containers: {}}}
            const container = {domain: this._domain, uid: this._uid, repo: this._repo}
            containersObject[`data`][`containers`][this._uid] = container
            config.add(containersObject)
            if (server.isLinked()){
                try {
                    axios.post(`containers`, {domain: this._domain, uid: this._uid, repo: this._repo}).then(resolve)
                }catch (e) {
                    reject()
                }
            }else{
                resolve()
            }
        })
    }

    static find(containerUid){
        return config.get(`data`, `containers`, containerUid)
    }
}