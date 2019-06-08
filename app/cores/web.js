
var requestPromise = require('request-promise-native');

exports.postJSON= async function (options) {
	
	//node.sandbox.core.options.resolveWithFullResponse = true;
	var result = await requestPromise(options);
	return result;

}
