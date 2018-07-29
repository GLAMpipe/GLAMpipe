

var exports 	= module.exports = {};

exports.web = {

	"get": {
		"JSON": function() {
			console.log("web.get.JSON");
		}
	}

}


exports.file = {

	"CSV": {
		"read": function() {
			console.log("read CSV");
		}
	}

}


// WEB IMPORT
// sandbox.context.data = await dataRoutes['web.get.JSON'](query);

// WEB EXPORT
//var result = await dataRoutes['web.post.JSON'](query);
//next()


