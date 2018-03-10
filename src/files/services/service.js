const axios = require(`../axios`)

module.exports = class Service {
    static async displayInfo(serviceName){
        return await axios.get(`/services/info?name=${serviceName}`)
    }
}