
// a mock collection "node"
var GLAMPipeCollection = function (gp, col, display) {
	var self = this;
	this.gp = gp;
	this.name = col.name;
	this.title = col.title;
	
	this.data = {"keys": [], "docs": [], "visible_keys": null};
	this.settings = {};
	this.maxArrayLenghtDisplay = 5;
	this.initialVisibleKeysLength = 5; // by default how many fields are shown

	this.dataDisplayDiv = "data-workspace data data-display";
	this.dataControlsDiv = "data-workspace data data-controls";
	this.baseAPI = gp.baseAPI;
	
	this.source = {type: "collection"};
	this.source.views = {}
	this.source.scripts = {}
	this.source.collection = col.name;
	
	this.display = display; // default data renderer


	// create html table for data display
	this.loadAndRenderData = function () {

		self.loadCollectionKeys(function() {
			self.loadCollectionData({}, function() {
				self.display.render();
			});
		})
	}

	this.getConfig = function() {return null}

	this.loadCollectionData = function (params, cb) {
		if(Object.keys(params).length === 0) {
			$.getJSON(self.baseAPI + "/collections/" + self.name + "/docs", function (docs) {
				self.data.docs = docs.data;
				cb();
			})
		} else {
			$.getJSON(self.baseAPI + "/collections/" + self.name + "/docs/" + params.skip() + params.sort() + params.fields_func() + "&" + params.search(), function (docs) {
				self.data.docs = docs.data;
				cb();
			});
		}
	}

	this.loadCollectionKeys = function (cb) {
		$.getJSON(self.baseAPI + "/collections/" + self.name + "/fields", function(data) {
			self.data.keys = data.keys;
			cb();
		})
	}



	this.nl2br = function (str, is_xhtml) {
		var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
	}

}
