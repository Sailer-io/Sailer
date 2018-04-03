const loki = require(`lokijs`)
const path = require(`path`)


module.exports = new loki(path.join(require(`os`).homedir(), `.sailer`))