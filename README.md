# **Y**et **A**nother **M**essaging **P**rotocol **a**s an **M**QTT wrap**per**

A simple messaging protocol built on top of MQTT. It provides subscriber and publisher functionality. You need to have a 3rd party MQTT broker like [Mosquitto](http://mosquitto.org/) or [Mosca](http://www.mosca.io/).

It's great for IoT devices like sensors to communicate with a central server.

## Usage

First you need an MQTT broker running somewhere, but you can use `mqtt://test.mosquitto.org` for testing.

```js
const Connection = require('yampamper');

// Create the subscription
const subConn = new Connection({ topic: 'sensors/x', url: 'mqtt://test.mosquitto.org', dropOld: true });
subConn.subscribe((err, data) => {
  if (!err) {
    console.log(data);
  }
});

// Create the publisher and send data every 300 milliseconds
const pubConn = new Connection({ topic: 'sensors/x', url: 'mqtt://test.mosquitto.org' });
setInterval(() => pubConn.publish({ x: Math.random() }), 300);
```

### Notes

- You can only subscribe and publish to one topic.
- You should not subscribe to multiple MQTT topics.

## Options

You can instatiate `Connection` with:

```js
{
  topic,      // Manditory: The topic to subscribe/publish to.
  url,        // Optional: The mqtt URL. Default is "mqtt://localhost".
  log,        // Optional: The logger to use (log, debug, info, warn, error).  Default is `console`.
  dropOld     // Optional: Check the order of arrival of messages and drop the old messages.
}
```
