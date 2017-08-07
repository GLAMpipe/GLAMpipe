

html = "<div class='box'><h2>I worked hard</h2>"; 
html += "<a href=/api/v1/nodes/" +node.source._id + "/files/" + node.source.params.file + ">download result</a></div>";

return html;
