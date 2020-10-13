# Artillery.io Redis Plugin


Hello 1 With Possible conflicts
With More Changes

<p align="center">
    <em>Load test Redis with <a href="https://artillery.io">Artillery.io</a></em>
</p>

Based on the [TCP Engine by limiter121](https://github.com/limiter121/artillery-engine-tcp).

## Usage

**Important:** The plugin requires Artillery `1.5.8-3` or higher.

### Install the plugin

```
# If Artillery is installed globally:
npm install -g artillery-engine-rediscluster
```

### Use the plugin

1. Set `config.redis.targets` to the list of servers with ports in the cluster
3. Set the `engine` property of the scenario to `rediscluster`.
4. Use `send` in your scenario to send arbitrary data to the server
5. Specify additional invocation parameters:
    - `command` - String Redis Command to use (Get, Set, HSet, HGet, GetAsync, SetAsync, LPush, LPop)
    - `key` - String key to get or set
    - `value` - String used to set values, push, or publish 

*Note:* Currently the engine does not handle failures gracefully and the test will shutdown with timeouts.

#### Example Script

```yaml
config:
  redis:
    targets: "10.100.1.100:6379,10.100.1.100:6380"
  phases:
    - arrivalCount: 10
      duration: 1
  engines:
    rediscluster: {}
scenarios:
  - name: "Test Set & Get"
    engine: rediscluster
    flow:
      - count: 10
        loop:
        - send:
            command: "set"
            key: "Id_{{ id }}"
            value: "Hello"
        -think: 1        
        - send:
            command: "get"
            key: "Id_{{ id }}"
        - think: 1  
```

### Run Your Script

```
artillery run my_script.yml
```

### License

[MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
