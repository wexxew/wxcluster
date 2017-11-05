/*
* Worker class
* */

const cluster = require('cluster');
const EventEmitter = require('events');
const util = require('util');

// const DEBUG = true;

function WorkerClust()
{
    EventEmitter.call(this);

    this.runQueues = {};

    this.init();
}


WorkerClust.prototype.getRand = function ()
{
    return Math.round(Math.random() * 10000000000).toString();
};


WorkerClust.prototype.send = function (cmd, args)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`WorkerClust.send(); cmd = ${cmd}`);
    }

    args.forEach((arg, ind) => {
        if (typeof arg === 'function') {
            var f = arg;
            var fname = '__func_' + self.getRand();

            args[ind] = fname;

            self.runQueues[fname] = (args) => {
                f.apply(self, args);
            };
        }
    });


    var packet = {
        pid: process.pid,
        cmd: cmd,
        args: args
    };

    process.send( packet );
};


WorkerClust.prototype.createFunc = function (func_name)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`WorkerClust.createFunc(); func_name = ${func_name}`);
    }

    return function()
    {

        var args_arr = [];
        for (var i in arguments) {
            args_arr.push( arguments[i] );
        }

        self.send(func_name, args_arr, () => {});
    }
};


WorkerClust.prototype.getFunctions = function ()
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`WorkerClust.getFunctions()`);
    }

    self.send('getFunctions', [func_arr => {
        func_arr.forEach(func_name => {
            self[func_name] = self.createFunc(func_name);
        });

        self.emit('ready');
    }]);
};


WorkerClust.prototype.init = function ()
{
    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`WorkerClust.init()`);
    }

    process.on('message', this.clientMsgHandler.bind(this));

    this.getFunctions();
};

WorkerClust.prototype.clientMsgHandler = function (msg)
{
    var self = this;

    if ( typeof DEBUG !== 'undefined' && DEBUG ){
        console.log(`WorkerClust.clientMsgHandler()`);
    }

    if ( /__func_\d+/.test(msg.cmd) ) {
        if ( self.runQueues[msg.cmd] ) {

            self.runQueues[msg.cmd].apply(self, [msg.args]);
            delete self.runQueues[msg.cmd];
        }
    }
};

util.inherits(WorkerClust, EventEmitter);

module.exports = WorkerClust;

