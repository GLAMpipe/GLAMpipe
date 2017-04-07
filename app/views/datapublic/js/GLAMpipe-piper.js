
var project = {
	// create project
	"title":"que_authors_subjects_lang",

	collections: [

		// add collection for initial data
		{
			"nodeid": "collection_basic",
			"title": "kokoelma",
			"nodes": [
				// fetch data from dspace (tiedemuseon artikkelit)
				{
					"nodeid": "source_api_dspace",
					"params": {
						"dspace_url": "http://siljo.lib.jyu.fi:8080/rest"
					},
					"settings": {
						"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
						"metadata": "on"
					}
				},
				// detect language from abstracts
				{
					"nodeid": "process_field_detect_language",
					"params": {
						"in_field": "dc_description",
						"suffix": "_detected_lang"
					},
					"settings": {
						"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3",
						"metadata": "on"
					}
				}			
			]
		},
		// add collection for authors
		{
			"nodeid": "collection_basic",
			"title": "authors",
			"nodes": [
				// fetch grouped authors from collection "kokoelma"
				{
					"nodeid": "source_group",
					"params": {
						"in_field": "dc_creator",
						"source_collection": "kokoelma",
					},
					"settings": {}
				}			
			]
		},

		// add collection for subjects
		{
			"nodeid": "collection_basic",
			"title": "subjects",
			"nodes": [
				// fetch grouped authors from collection "kokoelma"
				{
					"nodeid": "source_group",
					"params": {
						"in_field": "dc_subject",
						"source_collection": "kokoelma",
					},
					"settings": {}
				}			
			]
		}
		
	]
}

var que = [
	{
		"nodeid": "",
		"node_uuid": "",
		"settings": {
			"dspace_handle": "c00c91f5-4dc2-4c77-9ba1-c0d24cd7eff3"
		}
	}
]

// we turn pipe json to an array of sequential POST requests that are send to GLAMpipe API

function createNodeRunQue (task_arr, project_id) {
	
	project_id = "580dda377aa4f70005c21b17";
	var que = [];
	
	// first we ask project from server
	$.getJSON(GP_url + "/get/project/" + project_id, function(data) {
		data.nodes.forEach(function(node, i) {
			
			// then we pair settings from project file and nodes from project info from server
			var runner = {};
			runner.url = "run/node/" + node._id;
			for(var key in task_arr[i+1].settings) {
				runner[key] = task_arr[i+1].settings[key];
			}
			que.push(runner);
		})
		
		console.log(que);
	})
	

}







var GP_url = '/proxy?url=http://localhost:3000'; 



function GLAMpipePiper (url) {
	
	var self = this;
	self.url = url;
	self.pipe = null;
	self.projectId = null;
	self.runAfterCreated = false;
	self.collections = [];
	self.taskCounter = 0;
	
	
	this.createProject = function (project) {
		self.now = this.getDate();
		this.pipe = [];
		this.pipe = self.createTasks(project);
		self.insertProject(self.pipe[0]);
	}


	this.createAndRunProject = function (project) {
		self.now = this.getDate();
		self.runAfterCreated = true;  
		this.pipe = self.createTasks(project);
		self.insertProject(self.pipe[0]);
	}

	// create array of node creation API calls (POST)
	// first task is always creating the project (non-node task)
	this.createTasks = function (pipe) {
		var tasks = [];
		tasks.push({
			"url": "/create/project",
			"title":pipe.title
		});
		
		pipe.collections.forEach(function(collection, i) {
			tasks.push({
				"url":"/create/collection/node",
				"nodeid": "collection_basic",
				"title": collection.title
			});
			collection.nodes.forEach(function(node, i) {
				var task = {
					"url": "/create/node",
					"nodeid": node.nodeid,
					"params": node.params,
					"settings": node.settings
				}
				
				// params
				for(var key in node.params) {
					var paramName = "params[" + key + "]";
					//task[paramName] = node.params[key];
				}
				tasks.push(task);
			})
		})
		
		//console.log(tasks);
		return tasks;
	}

	
	this.insertProject = function (task) {
		
		
		//var mess = " " + Math.random().toString(36).substr(2, 5);
		self.title = self.now + " - " + task.title;
		
		var params = {
			"title": self.title
		}

		console.log('Creating project ' + self.title);
		
		var promise = $.post({
		  url: GP_url + task.url,
		  data: params
		});
		  
		promise.done(self.projectCreated);
		promise.fail(self.errorFunction);
		promise.always(self.alwaysFunction);

		
	}

	this.createNode = function (node) {

		var data= {};
		
		if(node.params)
			data.params = node.params;
		else
			data.params = {}

		if(node.settings)
			data.settings = node.settings;
			
		// add project id
		data.project = self.projectId;
		data.collection = self.currentCollection;
		data.nodeid = node.nodeid;
		if(node.title)
			data.params.title = node.title;

		// if node needs source_collection, then find it from created collections
		if(node.params && node.params.source_collection) {
			var orig = node.params.source_collection;
			self.collections.forEach(function(col, i) {
				if(col.title == node.params.source_collection)
					node.params.source_collection = col.collection;
			})
			if(orig == node.params.source_collection)
				alert("Could not find source collection for node " + node.nodeid + "\n Check 'title' and 'source_collection' fields")
		}

		console.log('Creating node ' + node.nodeid);

		var promise = $.post({
		  url: GP_url + node.url,
		  data: data
		});
		  
		promise.done(self.nodeCreated);
		promise.fail(self.errorFunction);
		promise.always(self.alwaysFunction);
	
	}

	this.runProject = function () {
		console.log('Running project ' + self.title);

		var promise = $.post({
		  url: GP_url + "/run/project/" + self.projectId
		});
		  
		promise.done(self.projectRun);
		promise.fail(self.errorFunction);
		promise.always(self.alwaysFunction);		
	}

	this.runNode = function (node, nodeid) {

		this.title = node.title;
		var settings = {};
	
		// add project id
		settings.settings = node.settings;
		settings.project = self.projectId;
		settings.collection = self.currentCollection;
		//settings.settings.title = node.title;
		settings.nodeid = node.nodeid;
		
		console.log('Running node ' + nodeid);

		var promise = $.post({
		  url: GP_url + "/run/node/" + nodeid,
		  data: node.settings
		});
		  
		promise.done(self.nodeRun);
		promise.fail(self.errorFunction);
		promise.always(self.alwaysFunction);
		
	}
	
	this.projectCreated = function (data) {
		console.log('Project created: ' + data.project._id);
		self.projectId = data.project._id;
		self.taskCounter++;
		self.createNode(self.pipe[self.taskCounter]);
	}

	this.projectRun = function (data) {
		alert("Project created and run started!")
	}

	this.nodeCreated = function (data) {
		console.log('Node created: ' );
		
		
		// if just created a collection then we set that to current collection 
		if(data.nodeid === "collection_basic") {
			self.collections.push(data);
			self.currentCollection = data.collection;
		}
		
		// continue node creation
		self.taskCounter++;
		if(self.taskCounter < self.pipe.length ) {
			self.createNode(self.pipe[self.taskCounter]);
			
		// we've created project, run project if requested
		} else {
			if(self.runAfterCreated)
				self.runProject();
			else
				alert("Project created!");
		}


	}

	this.getDate = function () {
		var date = new Date(Date.now());
		var y =  date.getUTCFullYear();
		var m =  date.getMonth() + 1;
		var d =  date.getDate();
		var h =  date.getHours();
		var mm =  date.getMinutes();
		var s =  date.getSeconds();
		
		return y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s;
	}

	this.nodeRunFinished = function (data) {
		console.log('RUNNED');
	}

	this.errorFunction = function (data) {
		console.log('error');
		console.log(data.responseText);
	}
	
	this.alwaysFunction = function (data) {
		console.log('alwaysFunction');
	}

	this.getCollectionData = function (options) {

		var url = self.url + options.collection.rest + options.collection.name;
		url += "?skip=" + options.collection.skip;
		url += "&sort=" + options.collection.sort;
		url += "&reverse=" + options.collection.reverse;
		url += "&limit=" + options.collection.limit;
		
		var article_count = 0;

		$.getJSON(url, function (data) {
			if(data.error)
				alert(data.error);
			else {
				
				var html = "<table>";
				data.data.forEach(function(item, i) {
					html += "<tr><td>" + item[options.field] + "</td>";
					html += "<td> " + item.count + "</td></tr>";
				}) 
				html += "</table>";
				console.log(data);
				$(options.div).append(html);
				
			}
		})
		
	} 
	
}




// first we create project

// then we create all collections

// then we add nodes to collections

//var l = new GLAMpipeProject();
//l.createProject('koe projekti');

//var piper = new GLAMpipePiper();
//piper.createProject(project);
//piper.createAndRunProject(project);

//createNodeRunQue(tasks);


//console.log(getDate());


