
var value = context.doc[context.node.settings.in_field];

// check if input is array
if(Array.isArray(value)) 
	value = value.join("");

// trim if wanted
if(typeof value === "string" && context.node.settings.trim)
	value = value.trim();


if(typeof value === "undefined" || value == "" || value == null)
	out.value = "no"
else
	out.value = "yes"
	

