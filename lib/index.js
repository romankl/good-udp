'use strict';
// Load modules

const Dgram = require('dgram');
const Stream = require('stream');
const Os = require('os');
const Url = require('url');
const Stringify = require('fast-safe-stringify');



const internals = {
    defaults: {
        threshold: 20,
        schema: 'good-udp',
        udpType: 'udp4',
        host: Os.hostname()
    }
};

class GoodUdp extends Stream.Writable {
    constructor(endpoint, config) {

        config = config || {};
        const settings = Object.assign({}, internals.defaults, config);

        super({ objectMode: true, decodeStrings: false });
        this._settings = settings;
        this._endpoint = Url.parse(endpoint);
        this._data = [];
        this._udpClient = Dgram.createSocket(settings.udpType);

        // Standard users
        this.once('finish', () => {

            this._sendMessages(() => {

                this._udpClient.close();
            });
        });
    }
    _write(data, encoding, callback) {

        this._data.push(data);
        if (this._data.length >= this._settings.threshold) {
            this._sendMessages((err) => {

                // always clear the data so we don't buffer this forever if there is ever a failed POST
                this._data = [];
                return callback(err);
            });
        }
        else {
            setImmediate(callback);
        }
    }
    _sendMessages(callback) {

        const envelope = {
            host: this._settings.host,
            schema: this._settings.schema,
            timeStamp: Date.now(),
            events: this._data
        };

        let payload = Stringify(envelope);
        payload = new Buffer(payload);

        // Prevent this from user tampering
        this._udpClient.send(payload, 0, payload.length, this._endpoint.port, this._endpoint.hostname, callback);
    }
}

module.exports = GoodUdp;

