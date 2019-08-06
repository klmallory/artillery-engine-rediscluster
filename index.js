'use strict';

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const net = require('net');
const debug = require('debug')('engine:RedisCluster');
const A = require('async');
const _ = require('lodash');
const redis = require('redis');
const redisCluster = require('redis-clustr');
const helpers = require('artillery-core/lib/engine_util');

function RedisClusterEngine(script, ee) {
  this.script = script;
  this.ee = ee;
  this.helpers = helpers;
  this.config = script.config;

  return this;
}

RedisClusterEngine.prototype.createScenario = function createScenario(scenarioSpec, ee) {
  const tasks = scenarioSpec.flow.map(rs => this.step(rs, ee));

  return this.compile(tasks, scenarioSpec.flow, ee);
};

RedisClusterEngine.prototype.step = function step(rs, ee, opts) {
  opts = opts || {};
  let self = this;

  if (rs.loop) {
    let steps = _.map(rs.loop, function (rs) {
      return self.step(rs, ee, opts);
    });

    return this.helpers.createLoopWithCount(
      rs.count || -1,
      steps,
      {
        loopValue: rs.loopValue || '$loopCount',
        overValues: rs.over,
        whileTrue: self.config.processor
          ? self.config.processor[rs.whileTrue] : undefined
      });
  }

  if (rs.log) {
    return function log(context, callback) {
      return process.nextTick(function () { callback(null, context); console.log(self.helpers._renderVariables(JSON.stringify(rs.log), context.vars)); });
    };
  }

  if (rs.think) {
    return this.helpers.createThink(rs, _.get(self.config, 'defaults.think', {}));
  }

  if (rs.function) {
    return function (context, callback) {
      let func = self.config.processor[rs.function];
      if (!func) {
        return process.nextTick(function () { callback(null, context); });
      }

      return func(context, ee, function () {
        return callback(null, context);
      });
    };
  }

  if (rs.send) {
    return function send(context, callback) {
      const command = rs.send.command.toLowerCase();
      const key = rs.send.key == null ? "" : self.helpers._renderVariables(rs.send.key, context.vars);
      const value = rs.send.value == null ? "" : self.helpers._renderVariables(rs.send.value, context.vars);

      ee.emit('request');
      const startedAt = process.hrtime();

      var rdc = context.rcluster;

      rdc.on('connect', function () {
      });

      rdc.on("error", function (err) {
        debug('Send error');
        ee.emit('error', err);
        console.log(err);
        return callback(err, context);
      });

      if (command == "get") {
        var data = rdc.get(key, function (err, reply) {
          const endedAt = process.hrtime(startedAt);
          let delta = (endedAt[0] * 1e9) + endedAt[1];
          reply = reply == null ? "" : reply
          if (err) {
            console.log("error " + err);
            ee.emit('response', delta, err, context._uid);
            debug('response');
            return callback(null, context);
          }
          else {
            ee.emit('response', delta, 'response', context._uid);
            debug('response');
            debug(reply.toString());
            return callback(null, context);
          }
        });

      }
    };
  }

  return function (context, callback) {
    return callback(null, context);
  };
};

RedisClusterEngine.prototype.compile = function compile(tasks, scenarioSpec, ee) {
  const self = this;
  return function scenario(initialContext, callback) {
    const init = function init(next) {
      var servers = [];
      var hosts = self.script.config.redis.targets.split(',');
      hosts.forEach(function (ele) { servers.push({ host: ele.split(':')[0], port: parseInt(ele.split(':')[1]) }); });

      initialContext.rcluster = new redisCluster(servers);


      ee.emit('started');
      return next(null, initialContext);
    };

    let steps = [init].concat(tasks);

    A.waterfall(
      steps,
      function done(err, context) {
        if (err) {
          debug(err);
        }

        return callback(err, context);
      });
  };
};

module.exports = RedisClusterEngine;
