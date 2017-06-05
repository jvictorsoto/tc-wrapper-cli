#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _tcWrapper = require('tc-wrapper');

var _tcWrapper2 = _interopRequireDefault(_tcWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('tc-wrapper-cli');

var operation = void 0;
var iface = void 0;

_commander2.default.version('1.0.0').arguments('<operation> <iface>').action(function (inOperation, inIface) {
  operation = inOperation;
  if (['del', 'get', 'set', 'add'].indexOf(operation) < 0) {
    throw new Error('Operation ' + operation + ' invalid! Choose between del, get, set & add.');
  }

  iface = inIface;
  if (_os2.default.networkInterfaces()[iface] === undefined) {
    throw new Error('Iface ' + iface + ' does not exists! Check your network interfaces.');
  }
}).usage('tccli <operation> <iface> [options]').option('-d --direction [direction]', 'outgoing', /(outgoing|incoming)/).option('-n --network [network]', '0.0.0.0/0', /(\d{1,3}\.){3}\d{1,3}\/\d{1,2}/).option('--srcPort [port]').option('--dstPort [port]').option('-p --protocol [protocol]', 'ip', /ip/).option('--delay [time]').option('--jitter [time]').option('--loss [percentage]').option('--corrupt [percentage]').option('--rate [bandwidth]').parse(process.argv);

var rule = ['network=' + _commander2.default.network];
if (_commander2.default.srcPort) {
  rule.push('srcPort=' + _commander2.default.srcPort);
}
if (_commander2.default.dstPort) {
  rule.push('dstPort=' + _commander2.default.dstPort);
}
rule.push('protocol=' + _commander2.default.protocol);

var ruleParsed = rule.join(',');
debug('Parsed rule: ' + ruleParsed);

var options = {
  delay: _commander2.default.delay,
  jitter: _commander2.default.jitter,
  loss: _commander2.default.loss,
  corrupt: _commander2.default.corrupt,
  rate: _commander2.default.rate
};
debug('Parsed options:\n' + JSON.stringify(options, null, 2));

if (['set', 'add'].indexOf(operation) > -1 && Object.keys(JSON.parse(JSON.stringify(options))).length === 0) {
  throw new Error('You have to set at least one rule option (delay, jitter, loss, corrupt and/or rate).');
}

var ruleParsedWithOptions = {};
ruleParsedWithOptions[_commander2.default.direction] = {};
ruleParsedWithOptions[_commander2.default.direction][ruleParsed] = options;
debug('Rule parsed with options:\n' + JSON.stringify(ruleParsedWithOptions, null, 2));

var tcWrapper = new _tcWrapper2.default(iface);

switch (operation) {
  case 'del':
    tcWrapper.del().then(function () {
      return console.log('Rules for ' + iface + ' deleted.\n');
    });
    break;
  case 'get':
    tcWrapper.get().then(function (rules) {
      return console.log('Rules for ' + iface + ':\n' + JSON.stringify(rules, null, 2));
    });
    break;
  case 'set':
    tcWrapper.set(ruleParsedWithOptions).then(function () {
      return console.log('Rule for ' + iface + ' set:\n' + JSON.stringify(ruleParsedWithOptions, null, 2));
    });
    break;
  case 'add':
    tcWrapper.get().then(function (rules) {
      debug('Old rules:\n' + JSON.stringify(rules, null, 2));
      Object.assign(rules[_commander2.default.direction], ruleParsedWithOptions[_commander2.default.direction]);
      debug('New rules:\n' + JSON.stringify(rules, null, 2));
      tcWrapper.set(rules).then(function () {
        return console.log('Rules for ' + iface + ' updated:\n' + JSON.stringify(rules, null, 2));
      });
    });
    break;
  default:
    // Should never happen, commander will catch it before
    throw new Error('Operation ' + operation + ' invalid! Choose between del, get, set & add.');
}