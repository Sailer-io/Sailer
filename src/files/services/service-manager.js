require(`colors`)
const supportedServices = [`mysql`, `mariadb`]
const passwordEnvNames = {mysql: `MYSQL_ROOT_PASSWORD`, mariadb: `MYSQL_ROOT_PASSWORD`}
const axios = require(`../axios`)
const {exec} = require(`child_process`)
const Timer = require(`../timer`)


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

    launch(serviceName) {
        return new Promise((resolve) => {
            axios.post(`services/getOrCreate`, {name: serviceName}).then(service => {
                const pass = service.data.data.password
                if (service.status === 201){
                    console.log(`\bCreating ${serviceName} network...`)
                    exec(`docker network create ${serviceName}`, () => {
                        console.log(`\bLaunching ${serviceName}...`)
                        exec(`docker container run -dt --restart unless-stopped -e "${passwordEnvNames[serviceName]}=${pass}" --network ${serviceName} --name ${serviceName} ${serviceName}`, () => {
                            console.log(`${serviceName} up in ${Timer.stop()} ms.`)
                        })
                    })
                }else{
                    console.log(`\b${serviceName} already exists, skipping...`)
                }
                Timer.start()
                this._servicesList[serviceName] = pass
                resolve()
            })
        })
    }
}