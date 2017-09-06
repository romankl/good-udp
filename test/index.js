'use strict';
//Load modules

const Dgram = require('dgram');
const Stream = require('stream');
const Code = require('code');
const GoodUdp = require('..');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

// Declare internals

const internals = {
    isSorted(elements) {

        let i = 0;

        while (i < elements.length && elements[i + 1]) {

            if (elements[i].timestamp > elements[i + 1].timestamp) {
                return false;
            }
            ++i;
        }
        return true;
    },
    getUri(server) {

        const address = server.address();
        return `udp://${address.address}:${address.port}`;
    },
    readStream() {

        const result = new Stream.Readable({ objectMode: true });
        result._read = () => {};
        return result;
    },
    makeServer: function (handler) {

        const server = Dgram.createSocket('udp4');

        server.info = {
            uri: 'udp://127.0.0.1:33333'
        };

        server.on('message', (message, remote) => {

            handler(message, remote);
        });

        server.start = function (callback) {

            server.bind(33333, '127.0.0.1');
            callback();
        };

        server.stop = function (callback) {

            server.close();
            callback();
        };

        return server;
    }
};

// Test shortcuts

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('GoodUdp', () => {

    it('properly creates the stream without options', (done) => {

        new GoodUdp('udp://127.0.0.1:33333');
        done();
    });

    it('honors the threshold setting and sends the event in a batch', (done) => {

        const stream = internals.readStream();
        let hitCount = 0;
        const server = internals.makeServer((message, remote) => {

            hitCount++;
            const payload = JSON.parse(message.toString());
            const events = payload.events;

            expect(payload.schema).to.equal('good-udp');
            expect(events).to.have.length(3);

            if (hitCount === 1) {
                expect(events[0].id).to.equal(0);
            }

            if (hitCount === 2) {
                expect(events[0].id).to.equal(3);
                server.stop(() => {

                    done();
                });
            }
        });

        server.start(() => {

            const reporter = new GoodUdp(server.info.uri, {
                udpType: 'udp4',
                threshold: 3
            });

            stream.pipe(reporter);

            for (let i = 0; i < 6; ++i) {

                stream.push({ id: i });
            }
        });
    });

    it('sends each event individually if threshold is 0', (done) => {

        const stream = internals.readStream();
        let hitCount = 0;
        const server = internals.makeServer((message, remote) => {

            hitCount++;
            const payload = JSON.parse(message.toString());
            const events = payload.events;

            expect(payload.schema).to.equal('good-udp');
            expect(events).to.have.length(1);

            if (hitCount === 1) {
                expect(events[0].id).to.equal(0);
            }

            if (hitCount === 2) {
                expect(events[0].id).to.equal(1);
                server.stop(() => {

                    done();
                });
            }
        });

        server.start(() => {

            const reporter = new GoodUdp(server.info.uri, {
                udpType: 'udp4',
                threshold: 0
            });

            stream.pipe(reporter);

            for (let i = 0; i < 2; ++i) {

                stream.push({ id: i });
            }
        });
    });

    it('handles circular object references safely', { plan: 4 }, (done) => {

        const stream = internals.readStream();
        let hitCount = 0;
        const server = internals.makeServer((message, remote) => {

            hitCount++;
            const payload = JSON.parse(message.toString());
            const events = payload.events;

            expect(payload.schema).to.equal('good-udp');
            expect(events).to.have.length(1);

            if (hitCount === 1) {
                expect(events[0].id).to.equal(0);
                expect(events[0]._data).to.equal('[Circular]');
                server.stop(() => {

                    done();
                });
            }
        });

        server.start(() => {

            const reporter = new GoodUdp(server.info.uri, {
                udpType: 'udp4',
                threshold: 0
            });

            stream.pipe(reporter);


            const data = {
                event: 'log',
                timestamp: Date.now(),
                id: 0
            };

            data._data = data;

            stream.push(data);
        });

    });


    it('makes a last attempt to send any remaining log entries on "finish"', (done) => {

        let reporter;

        const stream = internals.readStream();
        let hitCount = 0;
        const server = internals.makeServer((message, remote) => {

            hitCount++;
            const payload = JSON.parse(message.toString());
            const events = payload.events;

            expect(payload.schema).to.equal('good-udp');
            expect(events).to.have.length(2);

            if (hitCount === 1) {
                expect(events[0].id).to.equal(0);
                server.stop(() => {

                    // checks that the client is closed
                    expect(reporter.writable).to.be.false();
                    done();
                });
            }
        });

        server.start(() => {

            reporter = new GoodUdp(server.info.uri);

            expect(reporter.writable).to.be.true()
            stream.pipe(reporter);

            stream.push({
                event: 'log',
                timestamp: Date.now(),
                id: 0
            });
            stream.push({
                event: 'log',
                timestamp: Date.now(),
                id: 1
            });
            stream.push(null);
        });
    });
});
