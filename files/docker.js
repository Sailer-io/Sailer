const spawn = require(`child_process`).spawnSync

module.exports = class Docker{
    static getAll() {
        const me=spawn(`whoami`)
        console.log(me.stdout.toString())
    }
}