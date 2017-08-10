
// we generate POST request options

out.method = "post";

// do not make request if project is invalid
var projects = ["yso-finna-fi", "yso-finna-en", "yso-finna-sv"];
if(!projects.includes(context.node.settings.project))
	context.skip = true;

var in_field_value = context.doc[context.node.params.in_field];

if(Array.isArray(in_field_value)) {
	out.pre_value = [];
	in_field_value.forEach(function(value) {
		var options = {
			url:  "http://api.annif.org/v0/autoindex",
			headers: {
				"accept": "application/json"
			},
			formData: {
				text: 		limitText(value),
				project: 	context.node.settings.project,
				maxhits: 	parseInt(context.node.settings.maxhits),
				threshold: 	parseInt(context.node.settings.threshold)
				}
		};
		out.pre_value.push(options);
	})

} else {
	out.pre_value = {
		url:  "http://api.annif.org/v0/autoindex",
		headers: {
			"accept": "application/json"
		},
		formData: {
			text: 		limitText(in_field_value), 
			project: 	context.node.settings.project,
			maxhits: 	parseInt(context.node.settings.maxhits),
			threshold: 	parseInt(context.node.settings.threshold)
			}
	};	
}

// limit text to certain number of lines
function limitText(str) {
	var limited = [];
	var lines = str.split(/\r\n|\r|\n/);
	out.console.log("NODE: ANNIF input has " + lines.length + " lines");
	if(lines.length > context.node.settings.lines) {
		for(i = 0; i < context.node.settings.lines; i++) {
			var line = lines[i].trim();
			if(line !== "")
				limited.push(line);
		}
		return limited.join("\n");
		
	} else {
		return str;
	}
}


