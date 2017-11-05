/*
* Master class
* */

const cluster = require('cluster');
const EventEmitter = require('events');
const util = require('util');

// const DEBUG = true;

function MasterClust()
{
    var self = this;

    EventEmitter.call(this);

    this.funcLib = {
        getFunctions: (callback) => {
            var func_arr = [];

            for (var i in self.funcLib) {
                func_arr.push(i);
            }

            callback(func_arr);
        }
    };
}

MasterClust.prototype.getWorker = function (pid)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`MasterClust.getWorker(${pid})`);
    }

    var worker = null;

    Object.keys(cluster.workers).forEach(id => {
        if (cluster.workers[id].process.pid == pid) {
            worker = cluster.workers[id];
        }
    });

    return worker;
};

MasterClust.prototype.countWorkers = function ()
{
    return Object.keys( cluster.workers ).length;
};


MasterClust.prototype.getWorkerID = function (pid)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`MasterClust.getWorker(${pid})`);
    }

    var result = null;

    Object.keys(cluster.workers).forEach( id => {
        if (cluster.workers[id].process.pid == pid) {
            result = id;
        }
    });

    return result;
};


MasterClust.prototype.addCallback = function(cbName, pid)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`MasterClust.addCallback(${cbName}, ${pid})`);
    }

    return function () {
        var worker = self.getWorker(pid);
        if (worker !== null) {

            var args = [];

            for (var i in arguments) {
                args.push(arguments[i]);
            }

            var worker_data = {
                cmd: cbName,
                args: args
            };

            worker.send(worker_data);
        }
    };
};


MasterClust.prototype.run = function ()
{
    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`MasterClust.run()`);
    }
};

MasterClust.prototype.messageHandler = function(msg)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`MasterClust.messageHandler()`);
    }

    if (msg.args && msg.args.length) {
        msg.args.forEach((arg, ind) => {
            if (typeof arg === 'string' && arg.match(/^__func_\d+/)) {
                msg.args[ind] = self.addCallback(arg, msg.pid);
            }
        });
    }

    if (typeof self.funcLib[msg.cmd] === 'function')
        self.funcLib[msg.cmd].apply(this, msg.args);
};


MasterClust.prototype.killWorker = function (pid)
{
    var id = this.getWorkerID(pid);

    if (id !== null) {
        cluster.workers[id].kill();
    }

    self.emit('killfork');
};


util.inherits(MasterClust, EventEmitter);

module.exports = MasterClust;
