require(`colors`)
const supportedServices = [`mysql`, `mariadb`]
const passwordEnvNames = {mysql: `MYSQL_ROOT_PASSWORD`, mariadb: `MYSQL_ROOT_PASSWORD`}
const {exec} = require(`child_process`)
const Timer = require(`../timer`)
const uniqid = require(`uniqid`)
const Service = require(`./service`)


module.exports = class ServiceManager {

    constructor(){
        this._servicesList = {}
    }

    async deploy(services){
        console.log(`Waiting for services to be up and running...`)
        Timer.start()
        const wantedServicesList = services.split(`,`)
        wantedServicesList.forEach(element => {
            if (supportedServices.indexOf(element.toLowerCase()) === -1){
                console.error(`Error! "${element}" is not a supported service at this time. Here is the list of supported services:`)
                supportedServices.forEach(console.log)
                //eslint-disable-next-line
                process.exit(1)
            }
        });
        for (let service of wantedServicesList ){
            await this.launch(service)
        }
        Timer.stop()
        return this._servicesList;
    }

    async launch(serviceName) {
        const pass = this.makeServicePassword()
        const serviceId = uniqid()+`-${serviceName}`
        console.log(`\rCreating ${serviceName} network...`)
        exec(`docker network create ${serviceId}`, () => {
            console.log(`\rLaunching ${serviceName}...`)
            exec(`docker container run -dt --restart unless-stopped -e "${passwordEnvNames[serviceName]}=${pass}" --network ${serviceId} --name ${serviceId} ${serviceName}`, () => {
                console.log(`${serviceName} up in ${Timer.stop()} ms. The hostname to enter in your app config is: ${serviceId.bold}`)
            })
        })
       
        Timer.start()
        this._servicesList[serviceId] = pass
        let service = new Service(serviceName, serviceId, pass)
        await service.save()

    }


    makeServicePassword() {
        var text = ``;
        var possible = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
      
        for (var i = 0; i < 24; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
      }
}