/*jshint node:true, laxcomma:true */

var util = require('util'),
    redis = require('redis');

function RedisBackend(startupTime, config, emitter) {
  var defaults = {
    host: 'localhost',
    port: 6379,
    key: 'statsd'
  }
  var self = this;
  this.lastFlush = startupTime;
  this.lastException = startupTime;
  this.config = config.redis || defaults;
  this.client = redis.createClient(this.config.port, this.config.host);

  // attach
  emitter.on('flush', function(timestamp, metrics) {
    self.flush(timestamp, metrics);
  });
}

RedisBackend.prototype.flush = function(timestamp, metrics) {
  var out = {
    counters: metrics.counters,
    timers: metrics.timers,
    gauges: metrics.gauges,
    timer_data: metrics.timer_data,
    counter_rates: metrics.counter_rates,
    sets: function (vals) {
      var ret = {};
      for (var val in vals) {
        ret[val] = vals[val].values();
      }
      return ret;
    }(metrics.sets),
    pctThreshold: metrics.pctThreshold
  };

  this.client.set(this.config.key, JSON.stringify(out));
};

exports.init = function(startupTime, config, events) {
  module.exports.instance = new RedisBackend(startupTime, config, events);
  return true;
};
