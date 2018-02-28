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
const axios = require(`../axios`)

module.exports = class Deployer{
  constructor(repo, domain, mustWeSSL, deployPort){
    this._deployId = uniqid()
    this._protocol = `https`
    this._repo = repo
    this._folder = null
    this._cloneFolder = `/tmp/${this._deployId}`
    this._port = null
    this._deployPort = deployPort
    this._domain = domain
    this._mustWeSSL = mustWeSSL
    this.assertDomainIsValid()
    this.parseRepoUrl()
  }

  assertDomainIsValid(){
    //eslint-disable-next-line
    const isValid = this._domain.match(`^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$`)
    if (isValid === null){
      console.log(`Error, given domain seems erroneous.`)
    }
  }

  async deploy(mustWeSSL){
    Timer.start()
    const existingContainer = await this.verifyIfExists()
    await this.createVolume()
    const cloneUrl = this.getCloneUrl(this._repo)
    if (existingContainer.data.success) return this.updateDepoyment(existingContainer.data.data, cloneUrl)
    git().silent(true)
      .clone(cloneUrl, this._cloneFolder)
      .then(() => {
        let t = Timer.stop()
        console.log(`Clone done in ${t} ms, building the Docker image. This could take a while...`)
        Timer.start()
        exec(`docker build -t ${this._deployId} ${this._cloneFolder}`, (err) => {
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
                console.log(`Registering container on master server...`)
                this.registerToMaster().then(() => {
                  Timer.stop()
                  console.log(`Container successfully launched!`.green.bold)
                }).catch(() => {
                  Timer.stop()
                  console.log(`The container is online, but there was an error while contacting the master server.`.yellow.bold)
                  console.log(`Please investigate.`.yellow.bold)
                })
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

  async updateDepoyment(container){
    Timer.stop()
    console.log(`Stopping current container...`)
    Timer.start()
    this.getVolumePath(container.uid).then(path => {
      exec(`docker container stop ${container.uid}`, () => {
        console.log(`Done in ${Timer.stop()} ms.`)
        Timer.start()
        console.log(`Updating sources...`)
        git(path).pull().then(() => {
          console.log(`Done in ${Timer.stop()} ms. Rebuilding Docker image...`)
          Timer.start()
          exec(`docker build -t ${this._deployId} ${path}`, (err) => {
            if (err){
              console.error(`exec error: ${err}`)
            }else{
              console.log(`Build done in ${Timer.stop()} ms.`)
              console.log(`Re-creating Nginx Config...`)
              Timer.start()
              this.deployNginxConfig().then(() => {
                console.log(`Nginx ready in ${Timer.stop()} ms.`)
                Timer.start()
                console.log(`Launching container...`)
                this.launchContainer().then(() => {
                  console.log(`Updating container on master server...`)
                  this.registerToMaster().then(() => {
                    Timer.stop()
                    console.log(`Container successfully launched!`.green.bold)
                    console.log(`Your website was updated from the latest sources.`.green.bold)
                  }).catch(() => {
                    Timer.stop()
                    console.log(`The container is online, but there was an error while contacting the master server.`.yellow.bold)
                    console.log(`Please investigate.`.yellow.bold)
                  })
                })
              })
            }
          })
          
        })
      })
      
    })
    
  }

  verifyIfExists(){
    return axios.get(`containers/${this._domain}`)
  }

 async registerToMaster(){
   return axios.post(`containers`, {domain: this._domain, uid: this._deployId, repo: this._repo})
 }

  async launchContainer(){
    const portToPublish = await this.getPortToPublish()
    exec(`docker container run -dt --restart unless-stopped --name ${this._deployId} -p 127.0.0.1:${this._port}:${portToPublish} -v ${this._deployId}:/app ${this._deployId}`)
  }

  getPortToPublish(){
    return new Promise((resolve) => {
      if (this._deployPort !== null) {
        resolve(this._deployPort)
        return;
      }
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
    const nginxConfig = util.format(nginxBaseConfig, 
      this._domain,this._domain,this._domain, this._port)
    fs.writeFileSync(`/etc/nginx/sites-enabled/${this._domain}.conf`, nginxConfig)
    exec(`service nginx reload`)
  }

  async generatePort(){
    this._port = await getPort()
  }

  async letsencrypt(){
    
  }

  createVolume(){
    return new Promise((resolve) => {
      exec(`docker volume create ${this._deployId}`, () => {
        this.getVolumePath(this._deployId).then(path => {
          this._folder = path
          resolve()
        })
      })
    })
  }

  getVolumePath(deployId){
    return new Promise (resolve => {
        exec(`docker volume inspect ${deployId}`, (error, stdout) => {
        const info = JSON.parse(stdout)[0]
        resolve(info.Mountpoint)
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
    if (tokens === null) return false
    if (this._repo.startsWith(`github.com`) && tokens.github !== undefined)
      return {username: `sailer`, token: tokens.github}
    for (let t in tokens){
      if (this._repo.startsWith(t)) return tokens[t]
    }
    return false
  }
}


