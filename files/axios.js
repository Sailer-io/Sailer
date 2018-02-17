const axios = require('axios').default

const instance = axios.create({
    baseURL: 'http://localhost:8000/api/agent',
    timeout: 1000,
    headers: {"Accept": "application/json"}
})

module.exports = instance