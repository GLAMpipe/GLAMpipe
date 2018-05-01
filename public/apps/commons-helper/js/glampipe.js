function GLAMpipe() {
	var self = this;
	self.api_url = "/api/v1";
	
	self.project = null;
	self.collection = null;
	self.token = "Bearer " + localStorage.getItem("token");

	// token is saved in variable, so login is valid only for session
	self.login = function(login, cb) {
		var url = self.api_url + "/login";

		var d = {
			type: "POST",
			url: url,
			data: login,
			headers: {
				'Accept': 'application/json',
			}
		}

		$.ajax(d)
			.done(function(data) {
				self.token = "Bearer " + data.token;
				window.localStorage.setItem("token", data.token);
				cb(data);

			})
			.fail(function() {
				cb(false)
			});

	}

	self.checkAuth = function(cb) {
		var d = {
			url: self.api_url + "/auth",
			type: "GET",
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		};
		$.ajax(d)
			.done(function(json) {
				console.log("POST status:" + json.status)
				cb(json)

			})
			.fail(function() {
				cb(false)
			});
	}


	self.logout = function() {
		var d = {
			url: self.api_url + "/logout",
			type: "POST",
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		};
		$.ajax(d)
			.done(function(json) {
				console.log("POST status:" + json.status)
				cb(true)

			})
			.fail(function() {
				cb(false)
			});
	}

	self.createProject = function(title) {
		console.log("GP: calling createProject");
		var d = {
			url: self.api_url + "/projects",
			type: "POST",
			data: {title: title},
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		};

		return self.post(d).then(function(data) {
			if(data.error) throw(data.error);
			self.project = data.project._id; // global project id 
			return data;
		})
	}


	self.createCollection = function(title) {

		var d = {
			url: self.api_url + "/projects/" + self.project + "/nodes/collection_basic?type=collection",
			type: "POST",
			data: {params:{title: title}},
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		};
		return self.post(d).then(function(data) {
			if(data.error) throw(data.error);
			console.log(data.collection)
			self.collection = data.collection;
			return data;
		})
	}


	self.createNode = function(node) {
		var url = self.api_url + "/projects/" + self.project + "/nodes/" + node.nodeid;
		var d = {
			url: url,
			type: "POST",
			data: {
				collection: self.collection, 
				params: node.params,
			},
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		};
		return self.post(d).then(function(data) {
			console.log(data);
			//if(data.error) throw(error_msg);
			return data;
		})
	}



	self.runNode = function(node) {
		var d = {
			url: self.api_url + "/nodes/" + node.id + "/run",
			type: "POST",
			dataType: "json",
			data: node.settings,
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		}
		return self.post(d).then(function(data) {
			if(data.error) throw("Failure in node run!");
			return data;
		})
	}

	self.saveNodeDescription = function(node) {
		var d = {
			url: self.api_url + "/nodes/" + node.id + "/settings/description",
			type: "POST",
			dataType: "json",
			data: {description:node.settings.node_description},
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		}
		return self.post(d).then(function(data) {
			if(data.error) throw("Failure in saving description");
			return data;
		})
	}


	self.post = function(data) {
		return new Promise((resolve, reject) => {
			$.ajax(data)
				.done(function(json) {
					console.log("POST status:" + json.status)
					if(json.status == "error") {
						reject(json.error);
					} else {
						resolve(json);
					}
				})
				.fail((xhr, status, err) => reject(status + err.message));
		});
	}


	self.runNodeSingle = function(node, doc_id, success, error) {
		var url = self.api_url + "/nodes/" + node.id + "/run/" + doc_id
		var d = {
			url: url,
			type: "POST",
			dataType: "json",
			data:  JSON.stringify(node.settings),
			contentType: "application/json",
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		}

		return self.post(d);
	}

	self.updateDoc = function(collection, doc_id, doc) {
		var url = self.api_url + "/collections/" + collection + "/docs/" + doc_id
		var d = {
			url: url,
			type: "POST",
			dataType: "json",
			data:  JSON.stringify(doc),
			contentType: "application/json",
			headers: {
				"Accept": 'application/json',
				"Authorization":self.token
			}
		}

		return self.post(d);
	}
	

	self.upload = function(cb) {
		var formData = getFormData();
		$.ajax({
		url: self.api_url + "/upload", // Url to which the request is send
		type: "POST",             // Type of request to be send, called as method
		data: formData, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
		contentType: false,       // The content type used when sending data to the server.
		cache: false,             
		processData:false,    
		headers: {
			"Accept": 'application/json',
			"Authorization":self.token
		},    
		success: function(data) {
			cb(data);
			$('#loading').hide();
			$("#message").html(data);
		}
		});
	}

}
