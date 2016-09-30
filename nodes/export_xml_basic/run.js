

function escape (val) { 
   if( typeof val == "string") { 
       var s = val.replace(/</g, "&alt;"); 
       return s.replace(/&/g, "&amp;"); 
   } else if ( typeof val == "number") {
       return val; 
   }
}
var str = "";
var record_tag = context.node.settings.root;
var tag_open = " <" + record_tag + ">\\n";
var tag_close = " </" + record_tag + ">\\n";
for(f in context.doc) {
   var tag = context.node.settings["_mapkey_" + f];
   if(tag != "") {
       if (context.doc[f] !== null && context.doc[f].constructor.name === "Array") {
           for (var i = 0; i < context.doc[f].length; i++ ) { 
               str += "    <"+tag+">" + escape(context.doc[f][i]) + "</"+tag+">\\n";
           }
       } else {  
           str += "    <"+tag+">" + escape(context.doc[f]) + "</"+tag+">\\n"
       }
   }
};



if(parseInt(context.count) % 100 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);

out.value = tag_open + str + tag_close;
