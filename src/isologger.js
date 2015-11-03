var levels = {
  notset: 'notset',
  debug: 'debug',
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error'
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
  if (Error.captureStackTrace) {
    var err = new Error();

    var originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = this._myPrepareStackTrace;
    Error.captureStackTrace(err, null);
    var stack = err.stack;
    Error.prepareStackTrace = originalPrepareStackTrace;

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
  this.outputs.forEach(function (arr) {
    var level = arr[0];
    var output = arr[1];
    if (shouldReceive(logEvent.level, level)) {
      if (typeof output === 'function') {
        output(logEvent);
      } else if (typeof output.consume === 'function') {
        output.consume(logEvent);
      }
    }
  });
};

function shouldReceive(eventLogLevel, outputLogLevel) {
  var eventNumeric = levelStringToNumeric[eventLogLevel];
  var outputNumeric = levelStringToNumeric[outputLogLevel];
  return (eventNumeric >= outputNumeric) || outputNumeric === levels.notset;
}

function ConsoleOutput() {
}
ConsoleOutput.prototype.consume = function consume(logEvent) {

  if (typeof console !== 'undefined') {
    var args = [];

    var func;
    switch (logEvent.level) {
      case levels.error:
        func = console.error; // eslint-disable-line no-console
        break;
      case levels.warn:
        func = console.warn; // eslint-disable-line no-console
        break;
      case levels.info:
        func = console.info; // eslint-disable-line no-console
        break;
      case levels.log:
        func = console.log; // eslint-disable-line no-console
        break;
      case levels.debug:
        func = console.debug; // eslint-disable-line no-console
        break;
      default:
        func = console.log; // eslint-disable-line no-console
        args.push(logEvent.level);
        break;
    }

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
