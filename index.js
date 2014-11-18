/*!
 * watch-files - index.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('watch-files');
var ms = require('humanize-ms');
var Base = require('sdk-base');
var util = require('util');
var path = require('path');
var fs = require('fs');

/**
 * Module exports.
 */

module.exports = Watcher;

/**
 * Watcher constructor
 * @param {Object} opts
 */
function Watcher(opts) {
  if (!(this instanceof Watcher)) return new Watcher(opts);
  Base.call(this);
  this.interval = ms(opts.interval || '10s');
  this.files = {};
  this.timer = setInterval(this._watch.bind(this), this.interval);
}

util.inherits(Watcher, Base);

var proto = Watcher.prototype;

proto.add = function (file) {
  file = path.resolve(file);
  if (this.files[file]) return debug('file path %s exist', file);

  this.files[file] = null;
};

proto.remove = function (file) {
  file = path.resolve(file);
  if (this.files[file] === undefined) return debug('file path %s not exist', file);
  delete this.files[file];
};

proto._watch = function () {
  var watcher = this;
  Object.keys(watcher.files).forEach(function (file) {
    var mtime = watcher.files[file];
    debug('file %s mtime %s', file, mtime);

    fs.stat(file, function (err, stat) {
      if (err) {
        if (err.code === 'ENOENT') {
          // 404
          debug('file %s not exist', file);
          if (mtime) {
            watcher.files[file] = null;
            watcher.emit('change', {file: file, type: 'remove'});
            debug('file %s removed', file);
          }
        } else {
          // error
          debug('stat file error %s happend', err.message);
          watcher.emit('error', err);
        }
        return;
      }

      if (!mtime || stat.mtime > mtime) {
        // changed
        watcher.files[file] = stat.mtime;
        debug('file %s update %s', file, stat.mtime);
        watcher.emit('change', {file: file, type: 'change'});
      }
    });
  });
};
