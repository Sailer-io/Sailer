require(`colors`)
const supportedServices = [`mysql`]
const passwordEnvNames = {mysql: `MYSQL_ROOT_PASSWORD`}
const axios = require(`../axios`)
const {exec} = require(`child_process`)
const Timer = require(`../timer`)


module.exports = class ServiceManager {

    constructor(){
        this._servicesList = []
    }

    async deploy(services){
        console.log(`Waiting for services to be up and running...`)
        Timer.start()
        const wantedServicesList = services.split(`,`)
        wantedServicesList.forEach(element => {
            if (supportedServices.indexOf(element.toLowerCase()) === -1){
                throw `Error! "${element}" is not a supported service at this time. Only MySQL is supported.`
            }
        });
        for (const service of wantedServicesList ){
            await this.launch(service)
        }
        Timer.stop()
        return this._servicesList;
    }

    async launch(serviceName) {
        const service = await axios.post(`services/getOrCreate`, {name: serviceName})
        const pass = service.data.data.password
        if (service.status === 201){
            console.log(`Creating ${serviceName} network...`)
            exec(`docker network create ${serviceName}`, () => {
                console.log(`Launching ${serviceName}...`)
                exec(`docker container run -dt --restart unless-stopped --env "${passwordEnvNames[serviceName]}=${pass}" --network ${serviceName} --name ${serviceName} ${serviceName}`, () => {
                    console.log(`${serviceName} up in ${Timer.stop()} ms.`)
                    Timer.start()
                })
            })
        }
        console.log(`The ${serviceName} root password is: ${pass}`)
        this._servicesList.push(serviceName)
    }
}