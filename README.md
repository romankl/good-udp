# good-udp

Udp broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/hapijs/good-udp.svg?branch=master)](https://travis-ci.org/hapijs/good-udp) ![Current Version](https://img.shields.io/npm/v/good-udp.svg)

Lead Maintainer: [Vladimir de Turckheim](https://github.com/vdeturckheim)

## Usage

`good-udp` is a write stream use to send event to remote endpoints in batches. It makes a request with a JSON payload to the supplied `endpoint`. It will make a final request to the endpoint to flush the rest of the data on "finish".

### Note
`good-udp` will never close the udp client.

## Good Udp
### GoodUdp (endpoint, config)

creates a new GoodUdp object with the following arguments
- `endpoint` - full path to remote server to transmit logs.
- `config` - configuration object
	- `[threshold]` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
	- `[udpType]` - a string with the type of udp you want to use. Valid options are udp4 or udp6. Defaults to `'udp4'`.

When `stream` emits an "end" event, `goodudp` will transmit any events remaining it it's internal buffer to attempt to prevent data loss.

### Schema
Each request will match the following schema. Every event will be wrapped inside the `events` key and grouped by the event type and ordered by the timestamp. The payload that is sent to the `endpoint` has the following schema:

```json
{
  "host":"servername.home",
  "schema":"good-upd",
  "timeStamp":1412710565121,
  "events":[
      {
        "event":"request",
        "timestamp":1413464014739,
        ...
      },
      {
        "event":"request",
        "timestamp":1414221317758,
        ...
      },
      {
        "event":"request",
        "timestamp":1415088216608,
        ...
      }
      {
        "event":"log",
        "timestamp":1415180913160,
        ...
      },
      {
        "event":"log",
        "timestamp":1422493874390,
        ...
      }
  ]
}
```
