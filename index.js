const mqtt = require('mqtt');

const MQTT_BROKER_URL = 'mqtt://localhost';

/**
 * A message encapusalated within a MQTT message.
 * @typedef {Object} Message
 * @property {any} data - The information the client sends.
 * @property {MetaMessage} meta - Information that the client does not see.
 */

/**
 * Meta data used to describe the message ordering and which client it came from.
 * @typedef {Object} MetaMessage
 * @property {Number} counter - The nth message sent.
 * @property {string} clientId - The clientId, this may change.
 */

/**
 * Create a simple uuidv4 response.  Not super random.
 *
 * @returns {string} - A uuid v4.
 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; // eslint-disable-line
    const v = c === 'x' ? r : (r & 0x3) | 0x8; // eslint-disable-line
    return v.toString(16);
  });
}

/**
 * Our connection to for publish and subscribe events.
 *
 * @class Connection
 */
class Connection {
  constructor({ topic, url = MQTT_BROKER_URL, log = console, dropOld = false }) {
    const client = mqtt.connect(url);
    client.on('connect', () => {
      log.info('connected');
    });

    // Counters will track our clients
    let pubCounter = 0;
    const subCounters = {};
    let clientId = uuid();

    // Only one subscribe/publish allowed
    let isSubscriber = false;
    let isPublisher = false;

    /**
     * Our connection to for publish and subscribe events.
     *
     * @param {Message} obj - The message to check.
     */
    const checkSubCounter = obj => {
      if (!obj.meta && typeof obj.meta.clientId !== 'string') {
        throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
      }
      if (!obj.meta && typeof obj.meta.counter !== 'number') {
        throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
      }
      if (!dropOld) return true;

      const currentCounter = subCounters[obj.meta.clientId];
      if (currentCounter !== undefined && currentCounter.counter > obj.meta.counter) {
        return false;
      }

      // All good, update the counter
      subCounters[obj.meta.clientId] = {
        counter: obj.meta.counter,
      };
      return true;
    };

    this.publish = data => {
      if (isSubscriber) {
        log.error('Connection already active, only one connection allowed.');
        return;
      }
      isPublisher = true;
      pubCounter += 1;
      if (pubCounter >= Number.MAX_SAFE_INTEGER) {
        clientId = uuid();
        pubCounter = 0;
      }
      const msg = {
        data,
        meta: {
          counter: pubCounter,
          clientId,
        },
      };
      client.publish(topic, JSON.stringify(msg));
    };

    /**
     * Subscribe to an event.
     *
     * @param {Function} callback - The callback, standard `callback(err, data)`.
     */
    this.subscribe = callback => {
      if (isSubscriber || isPublisher) {
        log.error('Connection already active, only one connection allowed.');
        return false;
      }
      isSubscriber = true;
      client.subscribe(topic);
      client.on('message', (msgTopic, msg) => {
        if (topic !== msgTopic) return;
        msg = msg.toString();
        let obj;
        try {
          obj = JSON.parse(msg);
        } catch (ex) {
          callback(`Unable to parse data: ${msg}`);
          return;
        }
        if (!checkSubCounter(obj)) {
          log.warn(`Dropping packet: ${msg}`);
        }
        callback(null, obj.data);
      });
      return true;
    };
  }
}
module.exports = Connection;
