var liveStream = require('level-live-stream')
var through = require('through')

module.exports = function (db, viewer) {
  liveStream(db)

  return function (opts, start, end) {
    opts = 'string' === typeof opts ? {name: opts} : opts
    var view = viewer.views[opts.name]

    if(!view)
      throw new Error('view: ' +opts.name+ ' does not exist'))

    if(start) opts.start = start
    if(end)   opts.end = end

    var range = view.bucket.range(opts.start, opts.end)
    
    opts.start = range.start; opts.end = range.end

    var ls = opts.tail === false ? db.readStream(opts) : db.liveStream(opts)

    return ls.pipe(through(function (data) {
        var _data = {key: view.bucket.parse(data.key).key, value: data.value}
        this.queue(_data)
      })).once('close', ls.destroy.bind(ls))
  }
}
