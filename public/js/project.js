


// place holder for node data
//var node = {"nodeid":"collection_basic","type":"collection","subtype":"basic","title":"väikkärit","usage":"","description":"Creates a new collection (table)","scripts":{"hello":"out.say('news', 'You added a collection node'); context.node.title = context.node.params.title","bye":"out.say('finish', 'Deleted collection node. Collection ' + context.node.params.collection + ' is deleted too. Bye!'); ","init":"var base_url = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos';var format = '&format=json&nojsoncallback=?';out.url = base_url + '&photoset_id=' + context.node.params.album + format + '&api_key=' + context.node.params.apikey;out.say('news', out.url); ","run":"out.value = ''","finish":"out.say('finish', 'Collection created'); "},"views":{"params":"<label>Collection title </label><input type=\"text\" name=\"title\" id=\"title\" required /><label>Data description </label><textarea name=\"description\" id=\"description\" ></textarea>","settings":"no settings"},"type_desc":"Collection node creates the data holder (collection) for your data. This is the first node to add.","_id":"5729d14e7d0a45a715a77c1c","input_node":"","project":"5729d1417d0a45a715a77c1b","params":{"title":"väikkärit","description":"","collection":"p50_jyuvitskirjat_c0_vikkrit"},"collection":"p50_jyuvitskirjat_c0_vikkrit","number":0,"x":"351","y":"0"}
var node = null;




var nodeList = function () {
	var self = this;



	this.collection = ko.observableArray(); 
	this.projectNodes = ko.observableArray(); 
	this.documents = ko.observableArray(); 

    // get project nodes
	this.loadProject = function (nodesModel) {

		$.getJSON("/get/nodes/" + self.currentProject, function(project) { 
			var data = project.nodes;
			if(typeof data !== "undefined") { 
				for(var i = 0; i< data.length; i++) {
					var d = data[i];
					self.projectNodes.push(data[i]);
                    
                    // set first collection as base collection
                    if(!node)
                        if(data[i].type == "collection")
                            node = data[i];
				}
			}
			$("#project_title").text(project.title);
			self.loadData(nodes);
		})
	}

    // get all nodes
	this.loadNodes = function (nodesModel) {
		$.getJSON("/get/nodes", function(data) { 
			for(var i = 0; i< data.length; i++) {
				var d = data[i];
				for(var j = 0; j < data[i].subtypes.length; j++) {
					for(var k = 0; k < data[i].subtypes[j].nodes.length; k++) {
						//data[i].subtypes[j].nodes[k].params = self.generateParams(data[i].subtypes[j].nodes[k]);
					}
				}
				
				self.collection.push(data[i]);
			}
		})
	}

	
	this.loadData = function () {
		$.getJSON("/get/collection/" + node.collection, function(data) { 
			for(var i = 0; i< data.length; i++) {
				//data[i].vcc = self.params.skip_value + i + 1;
				self.documents.push(data[i]);
			}
            //self.documents = ko.observableArray(data);
			//getCount();
		})
	}

	this.sort = function (data, event) {
		if(this.reverse) {
			this.params.sort = '&reverse=1&sort=' + event.target.id;
			this.reverse = false;
		} else {
			this.params.sort = '&sort=' + event.target.id;
			this.reverse = true;
		}
			
		this.collection([]);
		this.params.skip_value = 0;
		this.loadData();
	};

	this.nextPage = function() {
		this.params.skip_func(25);
		this.loadData();
	};

	this.prevPage = function() {
		this.params.skip_func(-25);
		this.loadData();
	};
		

}

$( document ).ready(function() {
	nodes = new nodeList();
	var path = window.location.pathname.split("/");
	nodes.currentProject = path[path.length - 1];
	ko.applyBindings(nodes);
	//nodes.loadNodes(nodes);
	nodes.loadProject(nodes);
	//nodes.loadData(nodes);
	


});



window.getTemplate = function (name) {
    var baseUrl = "/template/";

    var loaded = ko.observable(false);

    var template = document.getElementById('template-' + name);

    if (template) {
        loaded(true);
    } else {
        jQuery.get(baseUrl + name + '.html', function (data) {
            var scriptTag = $('<script type="text/html" id="template-' + name + '"></script>');
            scriptTag.html(data);
            console.log(data);
            $('head').append(scriptTag);
            loaded(true);
        });
    }

    return ko.computed(function () {
        if (loaded()) {
            return 'template-' + name;
        } else {
            return "template-empty";
        }
    })();
};
