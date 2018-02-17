const {exec} = require('child_process')

module.exports = class Docker{
    static getAll() {
        const me=exec('whoami')
        while (true){
            console.log(me.stdout)
        }
    }
}