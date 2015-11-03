var IsoLogger = require('..');

var logger = new IsoLogger.Logger({
  timestamps: true,
  lineNumbers: true
});

var consoleOutput = new IsoLogger.ConsoleOutput();

logger.addOutput('log', consoleOutput);

logger.info('hello');

logger.error(new Error()); // most consoles don't format this well

logger.warn('Warn about this array', [1, 2, 3]);
