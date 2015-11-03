(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.IsoLogger = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var levels = {
  notset: 'notset',
  debug: 'debug',
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error'
};

var levelNumericToString = {
  0: 'notset',
  10: 'debug',
  15: 'log',
  20: 'info',
  30: 'warn',
  40: 'error'
};

var levelStringToNumeric = {
  notset: 0,
  debug: 10,
  log: 15,
  info: 20,
  warn: 30,
  error: 40
};

function LogEvent(level, args) {
  this.level = level;
  this.args = args;
  this.functionName = null;
  this.fileName = null;
  this.lineNumber = null;
  this.columnNumber = null;
  this.timestamp = null;
}

LogEvent.prototype.attachCallStackFrame = function attachCallStackFrame(callStackFrame) {
  if (callStackFrame) {
    if (callStackFrame.getFunctionName) {
      this.functionName = callStackFrame.getFunctionName();
    }
    if (callStackFrame.getFileName) {
      this.fileName = callStackFrame.getFileName();
    }
    if (callStackFrame.getLineNumber) {
      this.lineNumber = callStackFrame.getLineNumber();
    }
    if (callStackFrame.getColumnNumber) {
      this.columnNumber = callStackFrame.getColumnNumber();
    }
  }
};
LogEvent.prototype.getTimestamp = function getTimestamp() {
  this.timestamp = Date.now();
};

function Logger(opts) {
  this.lineNumbers = opts.lineNumbers || false;
  this.timestamps = opts.timestamps || false;

  this.outputs = [];
}

Logger.prototype.addOutput = function (level, output) {
  console.log('add ouput', level, output);
  this.outputs.push([level, output]);
};
Logger.prototype._createLogEvent = function (level, args, callSite) {
  var event = new LogEvent(level, args);

  if (callSite) {
    event.attachCallStackFrame(callSite);
  }

  if (this.timestamps) {
    event.getTimestamp();
  }

  this.produce(event);
};
Logger.prototype._myPrepareStackTrace = function (_, stack) {
  // don't format it, just return raw CallSite objects
  return stack;
};
Logger.prototype._getCallerCallSite = function () {
  console.log('try to get frame', Error.captureStackTrace, Error.prepareStackTrace );
  if (Error.captureStackTrace) {
    var err = new Error();

    var originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = this._myPrepareStackTrace;
    Error.captureStackTrace(err, null);
    var stack = err.stack;
    Error.prepareStackTrace = originalPrepareStackTrace;

    console.log('got frame');

    // we want the caller's caller
    return stack[2];
  }
};
Logger.prototype.debug = function () {
  var stackFrame = this.lineNumbers ? this._getCallerCallSite() : null;
  this._createLogEvent(levels.debug, arguments, stackFrame)
};
Logger.prototype.log = function () {
  var stackFrame = this.lineNumbers ? this._getCallerCallSite() : null;
  this._createLogEvent(levels.log, arguments, stackFrame)
};
Logger.prototype.info = function () {
  var stackFrame = this.lineNumbers ? this._getCallerCallSite() : null;
  this._createLogEvent(levels.info, arguments, stackFrame)
};
Logger.prototype.warn = function () {
  var stackFrame = this.lineNumbers ? this._getCallerCallSite() : null;
  this._createLogEvent(levels.warn, arguments, stackFrame)
};
Logger.prototype.error = function () {
  var stackFrame = this.lineNumbers ? this._getCallerCallSite() : null;
  this._createLogEvent(levels.error, arguments, stackFrame)
};

Logger.prototype.produce = function (logEvent) {
  console.log('produce');
  this.outputs.forEach(function (arr) {
    var level = arr[0];
    var output = arr[1];
    console.log('got output with', level);
    if (shouldReceive(logEvent.level, level)) {
      if (typeof output === 'function') {
        output(logEvent);
      } else if (typeof output.consume === 'function') {
        output.consume(logEvent);
      }
    } else {
      console.log('should not receive');
    }
  });
};

function shouldReceive(eventLogLevel, outputLogLevel) {
  var eventNumeric = levelStringToNumeric[eventLogLevel];
  var outputNumeric = levelStringToNumeric[outputLogLevel];
  console.log(eventNumeric, outputNumeric);
  return (eventNumeric >= outputNumeric) || outputNumeric === levels.notset;
}

function ConsoleOutput () {
}
ConsoleOutput.prototype.consume = function consume(logEvent) {

  if (typeof console !== 'undefined') {
    var args = [];

    var func;
    switch (logEvent.level) {
      case levels.error:
        func = console.error;
        break;
      case levels.warn:
        func = console.warn;
        break;
      case levels.info:
        func = console.info;
        break;
      case levels.log:
        func = console.log;
        break;
      case levels.debug:
        func = console.debug;
        break;
      default:
        func = console.log;
        args.push(logEvent.level);
        break;
    }

    console.log('timestamp', logEvent.timestamp);
    if (logEvent.timestamp) {
      args.push(logEvent.timestamp);
    }

    if (logEvent.functionName || logEvent.fileName) {
      var locationString = '';

      if (logEvent.functionName) {
        locationString += logEvent.functionName;
      }

      if (logEvent.fileName) {
        if (locationString) {
          locationString += ' ';
        }
        locationString += logEvent.fileName;
        if (logEvent.lineNumber) {
          locationString += '::' + logEvent.lineNumber;
          if (logEvent.columnNumber) {
            locationString += '::' + logEvent.columnNumber;
          }
        }
      }

      if (locationString) {
        args.push(locationString);
      }
    }

    args.push.apply(args, logEvent.args);

    if (func) {
      func.apply(console, args);
    }
  }
};

module.exports = {
  levels: levels,
  Logger: Logger,
  ConsoleOutput: ConsoleOutput
};

},{}]},{},[1])(1)
});


//# sourceMappingURL=isologger.js.map
