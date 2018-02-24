const uniqid = require(`uniqid`)
const git = require(`simple-git/promise`)
const Timer = require(`../timer`)
const config  = require(`../config`).getInstance()
const {exec} = require(`child_process`)
require(`colors`)
const fs = require(`fs`)
const nginxBaseConfig = require(`./nginx-conf`)
const getPort = require(`get-port`)
const util = require(`util`)

module.exports = class Deployer{
  constructor(repo, domain, mustWeSSL){
    this._protocol = `https`
    this._repo = repo
    this._folder = null
    this._port = null
    this._domain = domain
    this._mustWeSSL = mustWeSSL
    this._deployId = uniqid()
    this.parseRepoUrl()
  }

  async deploy(mustWeSSL){
    Timer.start()
    await this.createVolume()
    const cloneUrl = this.getCloneUrl(this._repo)
    git().silent(true)
      .clone(cloneUrl, this._folder)
      .then(() => {
        let t = Timer.stop()
        console.log(`Clone done in ${t} ms, building the Docker image. This could take a while...`)
        Timer.start()
        exec(`docker build -t ${this._deployId} ${this._folder}`, (err) => {
          const t = Timer.stop()
          if (err) {
            console.error(`exec error: ${err}`)
          }else{
            console.log(`Build done in ${t} ms.`)
            console.log(`Creating Nginx Config...`)
            Timer.start()
            this.deployNginxConfig().then(() => {
              console.log(`Nginx ready in ${Timer.stop()} ms.`)
              Timer.start()
              if (mustWeSSL){
                console.log(`Launching Letsencrypt...`)
                this.letsenscrypt()
              }
              console.log(`Launching container...`)
              this.launchContainer().then(() => {
                Timer.stop()
                console.log(`Container successfully launched!`)
              })
            })
          }
        })
      })
      .catch(() => {
        Timer.stop()
        console.error(`Error, cannot clone given repository.`.red.bold)
        console.error(`Please verify the URL and use the \`login\` command before if needed.`.red.bold)
      })
  }

  async launchContainer(){
    const portToPublish = await this.getPortToPublish()
    exec(`docker container run -d -t -p ${this._port}:${portToPublish} -v ${this._deployId}:/app ${this._deployId}`)
  }

  getPortToPublish(){
    return new Promise((resolve) => {
      exec(`docker image inspect ${this._deployId}`, (err, stdout) => {
        const exposedPorts = JSON.parse(stdout)[0].ContainerConfig.ExposedPorts
        for (let port in exposedPorts){
          resolve(port.split(`/`)[0])
          break;
        }
      })
    })
  }

  async deployNginxConfig(){
    await this.generatePort()
    this.allowInUfw()
    const nginxConfig = util.format(nginxBaseConfig, 
      this._domain,this._domain,this._domain, this._port)
    fs.writeFileSync(`/etc/nginx/sites-enabled/${this._domain}.conf`, nginxConfig)
    exec(`service nginx reload`)
  }

  allowInUfw(){
    exec(`ufw deny ${this._port}`)
  }

  async generatePort(){
    this._port = await getPort()
  }

  async letsencrypt(){
    
  }

  createVolume(){
    return new Promise((resolve) => {
      exec(`docker volume create ${this._deployId}`, () => {
        exec(`docker volume inspect ${this._deployId}`, (error, stdout) => {
          const info = JSON.parse(stdout)[0]
          this._folder = info.Mountpoint
          resolve()
        })
      })
    })
  }

  getCloneUrl(){
    const login = this.doesItNeedsAuth()
    if (login === false){
      return `${this._protocol}://${this._repo}`
    }else{
      return `${this._protocol}://${login.username}:${login.token}@${this._repo}`
    }
  }

  parseRepoUrl(){
    let goodUrl = this._repo
    if (goodUrl.startsWith(`http://`)){
      goodUrl = goodUrl.substr(7)
      this._protocol = `http`
    }else if (goodUrl.startsWith(`https://`)){
      goodUrl = goodUrl.substr(8)
    }else if (goodUrl.startsWith(`ssh://`) || goodUrl.startsWith(`git://`)){
      goodUrl = goodUrl.substr(6)
    }
    if (goodUrl.endsWith(`.git`)){
      goodUrl = goodUrl.substr(0, goodUrl.length-4)
    }
    const firstIndex = goodUrl.indexOf(`@`)
    if (firstIndex > -1){
      goodUrl = goodUrl.substr(firstIndex+1)
      goodUrl = goodUrl.replace(`:`, `/`)
    }
    this._repo = goodUrl
  }

  doesItNeedsAuth(){
    const tokens = config.get(`tokens`)
    if (this._repo.startsWith(`github.com`) && tokens.github !== undefined)
      return {login: `sailer`, token: tokens.github}
    for (let t in tokens){
      if (this._repo.startsWith(t)) return tokens[t]
    }
    return false
  }
}


