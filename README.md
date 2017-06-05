# tc-wrapper-cli

Simple command line interpreter (cli) for [tc-wrapper](https://github.com/jvictorsoto/tc-wrapper) library.

## Installation

This module is installed via npm:

```
npm install -g tccli
```

## Usage

The cli has three major commands ```del```, ```get``` and ```set```, for deleting, fetching and setting tc rules.

There is also an ```add``` command to make easier add more rules to existing ones, this command will running get, del and set under the hood as tc-wrapper lib dont support add.

**Allowed targeting**

Currently tc-wrapper only supports ip traffic, and can match by network, src and dst ports.

**Allowed modificators**

* **rate**: Bandwith limitation, htb algorith will be used, tbf is not supported (yet).
* **delay**: Round trip time of packets, will be added as **additional** time.
* **jitter**: Delay variation normal-distributed.
* **loss**: Packet loss, in percentage.
* **corrupt**: Packet corruption, in percentage.


### Clean all rules for *eth0*

``` sh
tccli del eth0
```

### Get all rules for *eth0*

``` sh
tccli get eth0
```

Output will be a JSON output similar to this:

```json
{
  "outgoing": {
    "network=0.0.0.0/0,protocol=ip": {
      "delay": "1.0ms",
      "jitter": "0.5%",
      "loss": "3%",
      "corrupt": "2%",
      "rate": "10Mbit"
    }
  },
  "incoming": {
    "network=192.168.1.1/32,protocol=ip": {
      "loss": "9%",
     },
     "network=10.10.10.0/28,srcPort=80,protocol=ip": {
       "rate": "100Mbit",
     }
  }
}

```

### Increase packet time by 20 ms

``` sh
tccli set eth0 --delay 20ms
```

By default all rules will be aplied to *outgoing* packets, so last command is the same as:

``` sh
tccli set eth0 --delay 20ms --direction outgoing
```

### Limit incoming bandwith of *eth0* to 20 Mbit

``` sh
tccli set eth0 --rate 20Mbit --direction incoming
```

### Limit output bandwith of *eth0* to 100 Mbit and loss 20% of packets

``` sh
tccli set eth0 --rate 100Mbit --loss 20%
```

```set``` operation will overwrite any rule of eth0, if you want to keep other rules you have to use ```add``` command.


### Apply several rules with *add*

``` sh
tccli set eth0 --rate 100Mbit --loss 20%
```

``` sh
tccli add eth0 --network 192.168.1.1/32 --corrupt 2%
```

``` sh
tccli add eth0 --network 10.10.10.0/28 --srcPort 80 --corrupt 2% --direction incoming
```

## Enable debug of module

This module uses [debug](https://www.npmjs.com/package/debug) for debugging, you can enable debug messages of all modules with:

```
DEBUG=tc-wrapper-cli*
```

Keep in mind that tc-wrapper library also uses debug module, so you can enable both cli and lib debug messages using:
```
DEBUG=tc-wrapper*
```

## Run tests

```
npm test
```

## License (MIT)

In case you never heard about the [MIT license](http://en.wikipedia.org/wiki/MIT_license).

See the [LICENSE file](LICENSE) for details.