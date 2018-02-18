const spawn = require(`child_process`).spawn
const Docker = require('dockerode')
const docker = new Docker()

module.exports = class Docker{
    static getAll() {
        return docker.listContainers()
    }
}