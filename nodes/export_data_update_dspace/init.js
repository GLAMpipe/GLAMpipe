
// check that required settings are set
if(!context.node.settings.update_field) {
	out.init_error = "You did not set field for new value!";
} else if(!context.node.settings.uuid_field) {
	out.init_error = "You did not set field for item UUID!";
	
} else {
	context.counter = 0; 
	out.say("progress", "Starting to update..."); 
}

