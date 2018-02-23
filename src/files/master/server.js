const axios = require('../axios')

module.exports = class Server {
  constructor () {
  }

  static getInstance () {
    if (Server._instance === undefined) {
      Server._instance = new Server()
    }
    return Server._instance
  }

  async ping () {
    return await axios.get('ping')
  }
}
