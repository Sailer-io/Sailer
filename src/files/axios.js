const axios = require(`axios`).default
const Config = require(`./config`).getInstance()

const instance = axios.create({
  baseURL: `${Config.get(`master`)}/api/agent`,
  timeout: 10000,
  headers: {'Accept': `application/json`}
})

module.exports = instance
