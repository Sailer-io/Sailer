const Docker = require(`dockerode`)
const docker = new Docker()

module.exports = class Docker {
  static getAll () {
    return docker.listContainers()
  }
}
