const mongoist = require('mongoist');


// default 'localhost' configuration:
var connection_string = '127.0.0.1:27017/glampipe_rw';

// this allows linking of mongo container (kontena.yaml)
if(process.env.MONGO_PORT) {
	console.log(process.env.MONGO_NAME);
	connection_string = process.env.MONGO_PORT_27017_TCP_ADDR + ':' +
	process.env.MONGO_PORT_27017_TCP_PORT + '/' + 'glampipe_rw';
}

if (process.env.DOCKER)  {
	connection_string = "glampipe_mongo:27017/glampipe_rw"

}

//global.db_string = connection_string;
console.log("MongoDB connection: ", connection_string);


module.exports = mongoist(connection_string,{useNewUrlParser: true });
