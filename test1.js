const cluster = require('cluster');
const MasterClust = require('./index').MasterClust
const WorkerClust = require('./index').WorkerClust

if ( cluster.isMaster ) {
	console.log('Master process')

	let mClust = new MasterClust

	mClust.funcLib['test'] = function(a, b, callback){
		callback(null, a+b)
	}

	mClust.run()

	let worker = cluster.fork()
	worker.on('message', mClust.messageHandler.bind(mClust))

} else {
	console.log('Worker process')

	let wClust = new WorkerClust

	wClust.on('ready', () => {
        console.log(`Worker PID=${process.pid}`)
        wClust.test(1,5, (err, res)=>{
        	if (err) throw err

        	console.log(`test() results: ` + res)
        	process.exit(0)
        })
    })
}
