const axios = require(`../axios`)
const config  = require(`../config`).getInstance()

module.exports = class Service {
    constructor(name, uid, password){
        this._name = name
        this._uid = uid
        this._password = password
    }

    async save(){
        const servicesObject = {}
        const service = {name: this._name, uid: this._uid, password: this._password}
        servicesObject[`data`][`services`][this._uid] = service
        config.add(servicesObject)
        await axios.post(`services/getOrCreate`, {name: this._name})
    }

    static async displayInfo(serviceName){
        return await axios.get(`/services/info?name=${serviceName}`)
    }
}