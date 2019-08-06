/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const test = require('tape');
const EventEmitter = require('events');

const RedisClusterEngine = require('..');

const script = {
  config: {
    redis: {
      targets: "10.100.1.100:6379"
    },
    scenarios: [{
      name: 'Send data',
      engine: 'rediscluster',
      flow: [
        {
          send: {
            command: "get",
            key: "Redis_Key_{{ Id }}"
          }
        }
      ]
    }]
  }
};

test('Engine interface', function (t) {
  const events = new EventEmitter();
  const engine = new RedisClusterEngine(script, events, {});
  const scenario = engine.createScenario(script.scenarios[0], events);
  t.assert(engine, 'Can construct an engine');
  t.assert(typeof scenario === 'function', 'Can create a scenario');
  t.end();
});
