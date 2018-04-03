const axios = require(`../axios`)
const Config = require(`../config`)
const inquirer = require(`inquirer`)
const vanillaAxios = require(`axios`).default

module.exports = class Server {
  constructor () {
  }

  static getInstance () {
    if (Server._instance === undefined) {
      Server._instance = new Server()
    }
    return Server._instance
  }

  isLinked(){
    return Config.getInstance().get(`master`) !== null
  }

  async ping () {
    if (this.isLinked()){
      return await axios.get(`ping`)
    }else{
      throw false
    }
  }

  async whoami(){
    if (this.isLinked()){
      return await axios.get(`whoami`)
    }else{
      throw false
    }
  }

  static async link(){
    if (Config.getInstance().get(`master`) !== null ){
      const already = await inquirer.prompt([{type: `confirm`, message: `A master server is already there. Do you really want to change it?`, name: `isSure`, default: false}])
      if (!already.isSure){
        return;
      }
    }
    const master = await inquirer.prompt([{name: `url`, message: `Please give the master server URL (with http:// or https://)`}])
    let url = master.url
    if (!url.startsWith(`http://`) && !url.startsWith(`https://`)){
      console.log(`Error, given URL MUST starts with http:// or https://`.yellow.bold)
      return;
    }else if (url.endsWith(`/`)){
      url = url.slice(0, -1)
    }
    try {
      const ping = await vanillaAxios.get(master.url+`/api/agent/ping`)
      if (ping.status!=200){
        throw false;
      }
    } catch (error){
      if (error.response.status === 401){
        console.log(`This node is not authorized on the given master server.`.red.bold)
      }else{
        console.log(`Master server unreachable, error code: `+error.response.status)
      }
    }
    Config.getInstance().add({master: url})
    console.log(`Node successfully linked to the given master server!`.green.bold)
  }
}
