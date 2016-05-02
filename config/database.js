

module.exports = {
	url : 'mongodb://localhost:27017/metapipe'
};


module.exports.initDBConnect = function () {

    // default to a 'localhost' configuration:
    var connection_string = '127.0.0.1:27017/metapipe';
    // if OPENSHIFT env variables are present, use the available connection info:
    if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
      connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
      process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
      process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
      process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
      process.env.OPENSHIFT_APP_NAME;
    }
    return connection_string;
}


