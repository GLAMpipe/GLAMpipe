
// we generate POST request options

out.method = "post";


// do not make request if project is invalid
var projects = ["yso-finna-fi", "yso-finna-en", "yso-finna-sv"];


var in_field_value = context.doc[context.node.params.in_field];

if(Array.isArray(in_field_value)) {
	out.pre_value = [];
	in_field_value.forEach(function(value, index) {
		
		var project = annifProject(index);
		
		// check that project is valid
		if(!projects.includes(project)) {
			out.pre_value.push({});
		} else {
			var options = createOptions(value, project);
			out.pre_value.push(options);
		}
	})

} else {

	var project = annifProject();
	
	// check that project is valid
	if(!projects.includes(project)) {
		out.pre_value = {};
		
	} else {
	
		out.pre_value = createOptions(in_field_value, project);
	}
}




function createOptions(text, project) {

	return {
		method: "POST",
		url:  "http://api.annif.org/v0/autoindex",
		headers: {Accept: "application/json"},
		form: {
			text: 		text, 
			project: 	project,
			maxhits: 	parseInt(context.node.settings.maxhits),
			threshold: 	parseFloat(context.node.settings.threshold)
		}
	}
}

function annifProject(index) {
	if(context.node.settings._dynamic_project) {
		if(typeof index !== "undefined")
			return "yso-finna-" + context.doc[context.node.settings._dynamic_project][index];
		else
			return "yso-finna-" + context.doc[context.node.settings._dynamic_project];
	} else {
		return context.node.settings._static_project;
	}
}

// limit text to certain number of lines
function limitText(str) {
	//return str.replace(/\r\n|\r|\n/g,"\n");
	
	var limited = [];
	var lines = str.split(/\r\n|\r|\n/);
	out.console.log("NODE: ANNIF input has " + lines.length + " lines");
	if(lines.length > context.node.settings.lines) {
		for(i = 0; i < context.node.settings.lines; i++) {
			var line = lines[i].trim();
			if(line && line.length > 5)
				limited.push(line);
		}
		return limited.join("\n");
		
	} else {
		return str;
	}
}


