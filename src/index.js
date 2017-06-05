#!/usr/bin/env node

import commander from 'commander';
import os from 'os';
import TCWrapper from 'tc-wrapper';

const debug = require('debug')('tc-wrapper-cli');

let operation;
let iface;

commander
  .version('1.0.0')
  .arguments('<operation> <iface>')
  .action((inOperation, inIface) => {
    operation = inOperation;
    if (['del', 'get', 'set', 'add'].indexOf(operation) < 0) {
      throw new Error(`Operation ${operation} invalid! Choose between del, get, set & add.`);
    }

    iface = inIface;
    if (os.networkInterfaces()[iface] === undefined) {
      throw new Error(`Iface ${iface} does not exists! Check your network interfaces.`);
    }
  })
  .usage('tccli <operation> <iface> [options]')
  .option('-d --direction [direction]', 'outgoing', /(outgoing|incoming)/)
  .option('-n --network [network]', '0.0.0.0/0', /(\d{1,3}\.){3}\d{1,3}\/\d{1,2}/)
  .option('--srcPort [port]')
  .option('--dstPort [port]')
  .option('-p --protocol [protocol]', 'ip', /ip/)
  .option('--delay [time]')
  .option('--jitter [time]')
  .option('--loss [percentage]')
  .option('--corrupt [percentage]')
  .option('--rate [bandwidth]')
  .parse(process.argv);

const rule = [`network=${commander.network}`];
if (commander.srcPort) {
  rule.push(`srcPort=${commander.srcPort}`);
}
if (commander.dstPort) {
  rule.push(`dstPort=${commander.dstPort}`);
}
rule.push(`protocol=${commander.protocol}`);

const ruleParsed = rule.join(',');
debug(`Parsed rule: ${ruleParsed}`);

const options = {
  delay: commander.delay,
  jitter: commander.jitter,
  loss: commander.loss,
  corrupt: commander.corrupt,
  rate: commander.rate,
};
debug(`Parsed options:\n${JSON.stringify(options, null, 2)}`);

if (['set', 'add'].indexOf(operation) > -1 && Object.keys(JSON.parse(JSON.stringify(options))).length === 0) {
  throw new Error('You have to set at least one rule option (delay, jitter, loss, corrupt and/or rate).');
}

const ruleParsedWithOptions = {};
ruleParsedWithOptions[commander.direction] = {};
ruleParsedWithOptions[commander.direction][ruleParsed] = options;
debug(`Rule parsed with options:\n${JSON.stringify(ruleParsedWithOptions, null, 2)}`);

const tcWrapper = new TCWrapper(iface);

switch (operation) {
  case 'del':
    tcWrapper.del()
      .then(() => console.log(`Rules for ${iface} deleted.\n`));
    break;
  case 'get':
    tcWrapper.get()
      .then(rules => console.log(`Rules for ${iface}:\n${JSON.stringify(rules, null, 2)}`));
    break;
  case 'set':
    tcWrapper.set(ruleParsedWithOptions)
      .then(() => console.log(`Rule for ${iface} set:\n${JSON.stringify(ruleParsedWithOptions, null, 2)}`));
    break;
  case 'add':
    tcWrapper.get()
      .then((rules) => {
        debug(`Old rules:\n${JSON.stringify(rules, null, 2)}`);
        Object.assign(rules[commander.direction], ruleParsedWithOptions[commander.direction]);
        debug(`New rules:\n${JSON.stringify(rules, null, 2)}`);
        tcWrapper.set(rules)
          .then(() => console.log(`Rules for ${iface} updated:\n${JSON.stringify(rules, null, 2)}`));
      });
    break;
  default: // Should never happen, commander will catch it before
    throw new Error(`Operation ${operation} invalid! Choose between del, get, set & add.`);
}
