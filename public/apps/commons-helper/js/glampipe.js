function GLAMpipe(url) {
	var self = this;
	self.api_url = url + "/api/v1";
	self.token = "";

	// token is saved in variable, so login is valid only for session
	self.login = function(login) {
		var url = self.api_url + "/login";

		var d = {
			type: "POST",
			url: url,
			data: login,
			headers: {
				'Accept': 'application/json',
			}
		}

		return self.post(d).then(function(data) {
			self.token = "Bearer " + data.token;
			return data;
		});
	}


	self.post = function(data) {
		return new Promise((resolve, reject) => {
			$.ajax(data)
				.done(function(json) {
					console.log("POST status:" + json.status)
					if(json.status == "error") {
						reject(json.status);
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
}
