const Connection = require('./');

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
