module.exports = class Timer {
  static start (mustWeKeepTimer = false) {
    if (Timer._t === undefined){
      if (mustWeKeepTimer !== true){
        Timer._time = Date.now()
      }
      var P = [`\\`, `|`, `/`, `-`]
      var x = 0
      Timer._t = setInterval(function () {
        process.stdout.write(`\r` + P[x++])
        x &= 3
      }, 250)
    }
  }

  static stop () {
    if (Timer._t !== undefined) {
      clearInterval(Timer._t)
      process.stdout.write(`\r`)
      const elapsedTime = Date.now() - Timer._time
      delete Timer._t
      return elapsedTime
    }
  }
}
