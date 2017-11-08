
if(context.node.settings.mode === "update")
	out.say("finish", "Added " + context.vars.update_counter + " records!");
else
	out.say("finish", "Fetched " + context.vars.record_counter + " records!");
 
