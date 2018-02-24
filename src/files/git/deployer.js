const REPO = 'github.com/Lelenaic/test-dwm'
const uniqid = require('uniqid')
const git = require('simple-git/promise')
const Timer = require('../timer')
const Config  = require('../config').getInstance()
const folder = '/tmp/'+uniqid()+'/'
const PASS = Config.get('tokens', 'github')
const remote = `https://sailer:${PASS}@${REPO}`
const {exec} = require('child_process')

module.exports = class Deployer{
  constructor(repo){

  }

  verifyIfNeedsAuth(repo){
    const tokens = Config.get('tokens')
    for (let t in tokens){
      let url = tokens[t].url
      if (repo.startsWith(url)) return true
    }
    return false
  }
}

Timer.start()
git().silent(true)
  .clone(remote, folder)
  .then(() => {
    exec('docker build -t test-sailer '+folder, (err) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
    
      console.log(`done`);
    })
  })
  .catch((err) => console.error('failed: ', err))
