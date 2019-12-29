const mongoist = require('mongoist');

function getDBString() {
	// default 'localhost' configuration:
	var connection_string = '127.0.0.1:27017/';

	// this allows linking of mongo container (kontena.yaml)
	if(process.env.MONGO_PORT) {
		console.log(process.env.MONGO_NAME);
		connection_string = process.env.MONGO_PORT_27017_TCP_ADDR + ':' +
		process.env.MONGO_PORT_27017_TCP_PORT + '/';
	}

	if (process.env.DOCKER)  {
		connection_string = "glampipe_mongo:27017/"

	}
	return connection_string;
}


function init(database) {
	var connection_string = getDBString();
	console.log("MongoDB connection: ", connection_string + database);
	global.db_string = connection_string + database;
	return mongoist(connection_string + database,{useNewUrlParser: true })
}

module.exports = {init: init}
//module.exports = mongoist(connection_string,{useNewUrlParser: true });
