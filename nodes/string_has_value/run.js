
var value = context.doc[context.node.params.in_field];

// check if input is array
if(Array.isArray(value)) 
	value = value.join("");

// trim if wanted
if(typeof value === "string" && context.node.settings.trim)
	value = value.trim();

// check for "0"
if(typeof value === "string") {
	var num = parseInt(value);
	if(num === 0)
		value = null;
}

if(Array.isArray(value))
	if(!value.length)
		value = null;

if(typeof value === "undefined" || value == "" || value == null || value == 0)
	out.value = "no"
else
	out.value = "yes"
	

