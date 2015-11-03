# IsoLogger

# Usage Example

```JavaScript

// supports being required or as a standalone script tag
var IsoLogger = require('isologger');
var IsoLoggerWeb = require('isologger-web');

// setup
var logger = new IsoLogger.Logger({
    lineNumbers: true, // don't use in production, only supports V8
    timestamps: true
});
logger.addOutput('debug', new IsoLogger.ConsoleOutput());
logger.addOutput('error', new IsoLoggerWeb.AjaxJQueryOutput());

// usage
logger.info('hello');
logger.error(new Error('My Message'));
logger.warn('Warn about this array', [1, 2, 3]);
logger.log({a: 1});
```

