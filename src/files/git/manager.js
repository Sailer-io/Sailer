const REPO = 'github.com/Lelenaic/test-dwm'
const uniqid = require('uniqid')
const Docker = require('dockerode')
const docker = new Docker()
const git = require('simple-git/promise')
const Timer = require('../timer')
const Config  = require('../config').getInstance()
const folder = '/tmp/'+uniqid()+'/'
const PASS = Config.get('tokens', 'github')
const remote = `https://sailer:${PASS}@${REPO}`


Timer.start()
git().silent(true)
  .clone(remote, folder)
  .then(() => {
    docker.buildImage({
      context: folder,
      src: ['Dockerfile']
    }, {t: 'test-sailer'}).then(() => {
      console.log('ok')
      Timer.stop()
    });
  })
  .catch((err) => console.error('failed: ', err))
