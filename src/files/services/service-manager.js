require(`colors`)
const supportedServices = [`mysql`]
const passwordEnvNames = {mysql: `MYSQL_ROOT_PASSWORD`}
const axios = require(`../axios`)
const {exec} = require(`child_process`)
const Timer = require(`../timer`)


module.exports = class ServiceManager {

    constructor(){
        this._servicesList = {}
    }

    deploy(services){
        console.log(`Waiting for services to be up and running...`)
        Timer.start()
        const wantedServicesList = services.split(`,`)
        wantedServicesList.forEach(element => {
            if (supportedServices.indexOf(element.toLowerCase()) === -1){
                throw `Error! "${element}" is not a supported service at this time. Only MySQL is supported.`
            }
        });
        wantedServicesList.forEach(element => {
            this.launch(element)
        });
    }

    launch(serviceName){
        axios.post(`/services/getOrCreate`, {name: serviceName}).then((resp) => {
            const pass = resp.data.password
            if (resp.status === 201){
                console.log(`Launching ${serviceName}...`)
                exec(`docker container run -dt --restart unless-stopped --env "${passwordEnvNames[serviceName]}=${pass}" --name ${serviceName} ${serviceName}`, () => {
                    console.log(`${serviceName} up in ${Timer.stop()} ms.`)
                    Timer.start()
                })
            }
            this._servicesList[serviceName] = pass
        })
    }
}