
module.exports.initDBConnect = function () {

	// default to a 'localhost' configuration:
	var connection_string = '127.0.0.1:27017/meta';
	
	// if OPENSHIFT env variables are present, use the available connection info:
	if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
		connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
	}

	// if MONGO env variables are present (i.e. mongo is running in docker), use them:
	if(process.env.MONGO_PORT_27017_TCP_ADDR) {
		console.log(process.env.MONGO_NAME);
		connection_string = process.env.MONGO_PORT_27017_TCP_ADDR + ':' +
		process.env.MONGO_PORT_27017_TCP_PORT + '/' +
		'metapipe';
	}
	
	console.log("MongoDB connection: ", connection_string);

	return connection_string;
}


