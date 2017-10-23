

var params = node.params
var dspace_url = node.params.dspace_url;
$("#source_web_dspace_url").text(params.dspace_url);

/*
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */
var Report = function() {
    var self = this;
    this.COLL_LIMIT = 500;
    this.COUNT_LIMIT = 500;
    this.ITEM_LIMIT = 100;

    //set default to work on demo.dspace.org
    this.ROOTPATH = "/xmlui/handle/"
    //this.ROOTPATH = "/jspui/handle/"
    //this.ROOTPATH = "/handle/"
    
    //disable this setting if Password Authentication is not supported
    this.makeAuthLink = function(){return false;};

    //Override this to return obj.id for DSpace 5 versions
    this.getId = function(obj) {
        return obj.uuid;
    }
    
    //Override this method is sortable.js has been included
    this.hasSorttable = function() {
        return false;
    }
    
    this.getDefaultParameters = function(){
        return {};
    }
    this.getCurrentParameters = function(){
        return {};
    }
    
    this.saveUrl = function() {
        this.myReportParameters.saveAsUrl(this.getCurrentParameters());
    }
    
    this.getLoginPayload = function() {
        //Placeholder to allow a customized report to prompt for email/password
        //If not enabled, the authenticaton callback will be called immediately
        var email = $("#restemail").val();
        var pass = $("#restpass").val();
        if (email == "" || pass == "") {
          return undefined;  
        } else if (email == null || pass == null) {
           return undefined;  
        } else {
           return {email: email, password: pass};      
        }
    }
    this.getLangSuffix = function(){
        return "";
    }
    this.myAuth = new Auth(this);
    this.myAuth.authStat();
    this.myAuth.callback = function(data) {
        //self.spinner.stop();
    }
    this.myHtmlUtil = new HtmlUtil();

    
    this.displayItems = function(itemsTitle, offset, limit, total, funcdec, funcinc) {
        var count = $("#itemtable tr.data").length;
        
        var last = offset + limit;
        var suff = "";
        
        if (total == null) {
            last = offset + count;
            suff = (count == limit) ? " of " + last + "+ " : " of " + last;
        } else if (limit == total) {
            //total may only be accurate to page size
            suff = " of " + total + "+ ";
        } else {
            last = (last > total) ? total : last;
            suff = " of " + total;
        }
        suff += " unfiltered; displaying " + count + " filtered" ;
        
        itemsTitle += " (" + (offset+1) + " - " + last + suff + ")";
        $("#prev,#next").attr("disabled",true);
        $("#itemdiv h3").text(itemsTitle);
        if (offset > 0) $("#prev").attr("disabled", false);
        $("#prev").off("click").on("click", funcdec);
        //in case of filters, always allow next
        
        if (total == null) {
            $("#next").attr("disabled", false);                
        } else if (offset + limit  < total) {
            $("#next").attr("disabled", false);            
        } else if (limit == total) {
            //total may only be accurate to one page
            $("#next").attr("disabled", false);            
        }
        $("#next").off("click").on("click", funcinc);
    }
    
    this.myReportParameters = undefined;
    this.myFilters = undefined;
    this.myMetadataFields = undefined;
    
    this.initMetadataFields = function() {
        this.myMetadataFields = new MetadataFields(self);
        this.myMetadataFields.load();        
    }
    
    this.baseInit = function() {
        this.myReportParameters = new ReportParameters(
                this.getDefaultParameters(),
                window.location.search.substr(1)
        );

        this.myFilters = new Filters(this.myReportParameters.params["filters"]);
        this.initMetadataFields();
        $("#metadatadiv").accordion({
            heightStyle: "content",
            collapsible: true,
            active: false,
            animate: false
        });
        $("#export").click(function(){
            self.export($("#itemtable tr"));
        });
        $("a.this-search").on("click",function(){
            self.saveUrl();
        });
        this.myFilters.createFilterTable(this.myReportParameters.params.filters);
        this.myAuth.init();
    }

    this.export = function(rows) {
        var itemdata = "data:text/csv;charset=utf-8,";
        rows.each(function(rownum, row){
            itemdata += (rownum == 0) ? "" : "\r\n";
            $(row).find("td,th").each(function(colnum, col){
                itemdata += self.exportCol(colnum, col);
            });
        });
        var encodedUri = encodeURI(itemdata);
        window.open(encodedUri);        
    }
    
    //this is meant to be overridden for each report
    this.exportCol = function(colnum, col) {
        var data = "";
        data += (colnum == 0) ? "" : ",";
        data += self.exportCell(col);
        return data;
    }
    
    this.exportCell = function(col) {
        data = "\"";
        $(col).contents().each(function(i, node){
            if ($(node).is("hr")) {
                data += "||";
            } else {
                data += $(node).text().replace(/\n/g," ").replace(/"/g,"\"\"");
                if ($(node).is("div:not(:last-child)")) {
                    data += "||";
                }
            }        
        });
        data += "\"";
        return data;
    }
    
    this.init = function() {
        this.baseInit();    
    }
    
}



var Auth = function(report) {
    this.report = report;
    this.TOKEN = undefined;
    this.callback = function(data) {
    };
    this.saveToken = function(data) {
        this.TOKEN = data;
    }
    this.init = function() {
        var loginPayload = report.getLoginPayload();
        if (loginPayload == undefined) {
            this.callback();
            return;
        }

        var self = this;
        $.ajax({
            url : g_apipath + "/proxy?url=" + dspace_url + "/login",
            contentType : "application/x-www-form-urlencoded",
            accepts : "application/json",
            type : "POST",
            data : loginPayload,
            success : function(data){
                self.saveToken(data);
               },
            error: function(xhr, status, errorThrown) {
                alert("Error in/rest/login "+ status+ " " + errorThrown);
            },
            complete: function(xhr, status) {
                self.authStat();
                self.callback();
            }
        });        
    }
    this.authStat = function() {
        var self = this;
        $.ajax({
            url : g_apipath + "/proxy?url=" + dspace_url + "/status",
            dataType : "json",
            error: function(xhr, status, errorThrown) {
                alert("Error in/rest/status "+ status+ " " + errorThrown);
            },
            success: function(data) {
              var user = "";
              if (data.email != undefined) {
                user = data.email;                  
              } else {
                user = "You are not logged in.  Some items may be excluded from reports.";
              }
              var anchor = $("<a/>").text(user);
              if (self.report.makeAuthLink()) {
                  anchor.attr("href","javascript:window.open('authenticate.html','Authenticate (Password Auth Only)','height=200,width=500')");
              }
              $("#currentUser").empty().append("<b>Current User: </b>").append(anchor);
            }
        });     
    }
    this.logout = function() {
        var self = this;
        $.ajax({
            url : g_apipath + "/proxy?url=" + dspace_url + "/logout",
            error: function(xhr, status, errorThrown) {
                alert("Error in/rest/logout "+ status+ " " + errorThrown);
            },
            complete: function(xhr, status) {
                self.authStat();
            }
        });     
    }
    this.getHeaders = function() {
        var HEADERS = {};
        if (this.TOKEN != null) {
            HEADERS['rest-dspace-token'] = this.TOKEN;
        }
        return HEADERS;
    }
}



var ReportParameters = function(defaultParams, prmstr) {
    this.params = defaultParams;

    if (prmstr == null) prmstr = "";
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        var field = tmparr[0];
        var val = decodeURIComponent(tmparr[1]);
        var pval = this.params[field];
              
        if ($.isArray(pval)) {
            pval[pval.length] = val;          
        } else {
            this.params[field] = val;
        }
    }
    $("#limit").val(this.params.limit);  
    $("#offset").val(this.params.offset);
    this.limit = this.params.limit;
    this.offset = this.params.offset;

    this.getOffset = function() {
        var offset = $("#offset").val();
        return $.isNumeric(offset) ? Number(offset) : this.offset;
    }

    this.getNextOffset = function() {
        return this.getOffset() + this.getLimit();
    }

    this.getPrevOffset = function() {
        var v = this.getOffset() - this.getLimit();
        return v < 0 ? 0 : v;
    }

    this.getLimit = function() {
        var limit = $("#limit").val();
        return $.isNumeric(limit) ? Number(limit) : this.limit;
    }

    this.updateOffset = function(increment) {
        var val = $("#offset").val();
        var lim = $("#limit").val();
        if ($.isNumeric(val) && $.isNumeric(lim)) {
            if (increment) {
                $("#offset").val(this.getNextOffset());                
            } else {
                $("#offset").val(this.getPrevOffset());                
            }
        }        
    }

    this.saveAsUrl = function(params) {
        var pstr = $.param(params).replace(/%5B%5D/g,"[]");
        window.location.search = pstr;
    }
}



var Filters = function() {
    this.createFilterTable = function(filterList) {
        self = this;
        var paramFilterSel = filterList == null ? new Array() : filterList.split(",");
        var categories = new Array();
        self.addFilter("", categories, "General", "None", "De-select all filters", "none").click(
            function(){
                $("input.filter,input.all").attr("checked",false);
                $("#filter-reload").attr("disabled", false);
            }
        );
        self.addFilter("all", categories, "General", "All", "Show all filters", "all").click(
            function(){
                $("input.filter,input.none").attr("checked",false);
                $("#filter-reload").attr("disabled", false);
            }
        );
        
        $.getJSON(g_apipath + "/proxy?url=" + dspace_url + "/filters",
            function(data){
                $.each(data, function(index, filter){
                    var checkbox = self.addFilter(filter["filter-name"], categories, filter.category, filter.title, filter.description, "filter").click(
                        function(){
                            $("input.none,input.all").attr("checked",false);
                            $("#filter-reload").attr("disabled", false);
                        }
                    );
                    $.each(paramFilterSel, function(index, filtername){
                        if (filtername == filter["filter-name"]) {
                            checkbox.attr("checked", true);
                        }
                    });
                });
            }
        );
    }

    this.addFilter = function(val, categories, category, title, description, cname) {
        var catdiv = null;
        for(var i=0; i<categories.length; i++) {
            if (categories[i].name == category) {
                catdiv = categories[i].div;
                break;
            }
        }
        if (catdiv == null) {
            catdiv = $("<fieldset class='catdiv'/>");
            catdiv.append($("<legend>"+category+"</legend>"));
            $("#filterdiv").append(catdiv);
            categories[categories.length] = {name: category, div: catdiv};
        }
        var div = $("<div/>");
        var input = $("<input name='filters[]' type='checkbox'/>");
        input.attr("id",val);
        input.val(val);
        input.addClass(cname);
        div.append(input);
        var ftitle = (title == null) ? val : title;
        var label = $("<label>" + ftitle + "</label>");
        label.attr("title", description);
        div.append(label);
        catdiv.append(div);
        return input;
    }

    this.getFilterList = function() {
        var list="";
        $("input:checked[name='filters[]']").each(
            function(){
                if (list != "") {
                    list += ",";
                }
                list += $(this).val();
            }
        );
        if (list == "") {
            list = "none";
        }
        return list;
    }    
}



var MetadataFields = function(report) {
    this.metadataSchemas = undefined;
    var self = this;
    
    this.load = function(){
        $.ajax({
            url: g_apipath + "/proxy?url=" + dspace_url + "/registries/schema",
            dataType: "json",
            success: function(data){
                self.initFields(data, report);
            },
            error: function(xhr, status, errorThrown) {
                alert("Error in/rest/registries/schema "+ status+ " " + errorThrown);
            },
            complete: function(xhr, status) {
            }
        });        
    }
    
    this.initFields = function(data, report) {
        var params = report.myReportParameters.params;
        self.metadataSchemas = data;
        self.drawShowFields(params["show_fields[]"]);
    }
    
    this.getShowFields = function(){
        var val = $("#show-fields select").val();
        return val == null ? Array() : val;
    }

    this.drawShowFields = function(pfields) {
        if (pfields == null) return;
        var self = this;
        var sel = $("<select name='show_fields'/>").attr("multiple","true").attr("size","8").appendTo("#show-fields");
        $.each(this.metadataSchemas, function(index, schema){
            if (schema.prefix == 'eperson') {
                return;
            }
            $.each(schema.fields, function(findex, field) {
                var name = field.name;
                var opt = $("<option/>");
                opt.attr("value",name).text(name);
                for(var i=0; i<pfields.length; i++) {
                    if (pfields[i] == name) {
                        opt.attr("selected", true);
                    }
                }
                sel.append(opt);
            });
        });
    }
    
    this.initQueries = function(){};
}



var HtmlUtil = function() {
    this.addTr = function(tbl) {
        var tr = $("<tr/>");
        tbl.append(tr);
        return tr;
    }

    this.addTd = function(tr, val) {
        var td = $("<td/>");
        if (val != null) {
            td.append(val);
        }
        tr.append(td);
        return td;
    }

    this.addTh = function(tr, val) {
        var th = $("<th/>");
        if (val != null) {
            th.append(val);
        }
        tr.append(th);
        return th;
    }


    this.addTdAnchor = function(tr, val, href) {
        return this.addTd(tr, this.getAnchor(val, href));
    }

    this.getAnchor = function(val, href) {
        var a = $("<a/>");
        a.append(val);
        a.attr("href", href);
        a.attr("target", "_blank");
        return a;
    }

    this.createOpt = function(name, val) {
        var opt = $("<option/>");
        opt.attr("value", val).text(name);
        return opt;
    }

    this.addOpt = function(sel, name, val) {
        var opt = this.createOpt(name, val);
        sel.append(opt);
        return opt;
    }

    this.addDisabledOpt = function(sel, name, val) {
        var opt = this.createOpt(name, val).attr("disabled",true);
        sel.append(opt);
        return opt;
    }

    this.makeTotalCol = function(th) {
        th.append($("<hr><span class='num'>-</span>"));
    }

    this.totalCol = function(index){
        var total = 0;
        $("#table tr.data").each(function(){
            var val = $($(this).find("td")[index]).text();
            if ($.isNumeric(val)) {
                total += Number(val);
            }
        });
        $($("#table tr.header th")[index]).find("span.num").text(total);
    }

}



var CommunitySelector = function(report, parent, paramCollSel) {
    var self = this;
    $("#collSel,#collSel option").remove();
    var collSel = $("<select/>").attr("id","collSel").attr("name","collSel").attr("multiple", true).attr("size",15);
    parent.append(collSel);
    report.myHtmlUtil.addOpt(collSel, "Whole Repository", "");
    
    $.ajax({
        url: g_apipath + "/proxy?url=" + dspace_url + "/hierarchy",
        dataType: "json",
        headers: report.myAuth.getHeaders(),
        success: function(data){
            var collSel = $("#collSel");
            if (data.community != null) {
                $.each(data.community, function(index, comm){
                    self.addCommLabel(collSel, comm, 0, paramCollSel);
                });
            }
        },
        error: function(xhr, status, errorThrown) {
            alert("Error in/rest/communities "+ status+ " " + errorThrown);
        },
        complete: function(xhr, status) {
        }
    });    

    this.addCommLabel = function(collSel, comm, indent, paramCollSel) {
        var prefix = "";
        for(var i=0; i<indent; i++) {
            prefix += "--";
        }
        report.myHtmlUtil.addDisabledOpt(collSel, prefix + comm.name, comm.id);
        if (comm.collection != null) {
            $.each(comm.collection, function(index, coll) {
                var opt = report.myHtmlUtil.addOpt(collSel, prefix + "--" + coll.name, coll.id);
                $.each(paramCollSel, function(index, collid){
                    if (collid == coll.id) {
                        opt.attr("selected", true);
                    }
                });
            });        
        }
        if (comm.community != null) {
            $.each(comm.community, function(index, scomm) {
                self.addCommLabel(collSel, scomm, indent + 1, paramCollSel);
            });        
        }
    }
}



/*
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */
var QueryReport = function() {
    Report.call(this);
    
    //If sortable.js is included, uncomment the following
    //this.hasSorttable = function(){return true;}
    
    this.getDefaultParameters = function(){
        return {
            "collSel[]"     : [],
            "query_field[]" : [],
            "query_op[]"    : [],
            "query_val[]"   : [],
            "show_fields[]" : [],
            "offset"        : 0,          
        };
    }
    this.getCurrentParameters = function(){
        var params = {
            "query_field[]" : [],
            "query_op[]"    : [],
            "query_val[]"   : [],
            "collSel[]"     : ($("#collSel").val() == null) ? [""] : $("#collSel").val(),
            "expand"        : "parentCollection,metadata,bitstreams",
            filters         : this.myFilters.getFilterList(),
            "show_fields[]" : this.myMetadataFields.getShowFields(),
        };
        $("select.query-tool,input.query-tool").each(function() {
            var paramArr = params[$(this).attr("name")];
            paramArr[paramArr.length] = $(this).val();
        });
        return params;
    }
    var self = this;

    this.init = function() {
        this.baseInit();    
    }
    
    this.initMetadataFields = function() {
        this.myMetadataFields = new QueryableMetadataFields(self);
        this.myMetadataFields.load();        
    }
    this.myAuth.callback = function(data) {
        var communitySelector = new CommunitySelector(self, $("#collSelector"), self.myReportParameters.params["collSel[]"]);
        //$(".query-button").click(function(){self.runQuery();})
        $(".query-button").click(function(){self.showQuery();})
    }

    this.showQuery = function () {
        var params =  this.getCurrentParameters() ;
        var str = "?";
        for(var key in params) {
             if(params[key].constructor.name == "Array") {
                for(var i = 0; i < params[key].length; i++)
                   str += "&" + key + "=" + params[key][i];
             } else {
                str += "&" + key + "=" + params[key];
             }	
        }
        // replace first & with ?
        //console.log(str);
        $("#source_api_dspace_query").val(str);
        
    }

    this.runQuery = function() {
        this.showQuery();
        //this.spinner.spin($("body")[0]);
        $("button").attr("disabled", true);
        $.ajax({
            url: g_apipath + "/proxy?url=" + dspace_url + "/filtered-items", 
            data: this.getCurrentParameters(), 
            dataType: "json",
            headers: self.myAuth.getHeaders(),
            success: function(data){
                data.metadata = $("#show-fields select").val();
                self.drawItemFilterTable(data);
                //self.spinner.stop();
                  $("button").not("#next,#prev").attr("disabled", false);
            },
            error: function(xhr, status, errorThrown) {
                alert("Error in/rest/filtered-items "+ status+ " " + errorThrown);
            },
            complete: function(xhr, status, errorThrown) {
                //self.spinner.stop();
                  $("button").not("#next,#prev").attr("disabled", false);
            }
        });
    }
    
    this.drawItemFilterTable = function(data) {
        $("#itemtable").replaceWith($('<table id="itemtable" class="sortable"></table>'));
        var itbl = $("#itemtable");
        var tr = self.myHtmlUtil.addTr(itbl).addClass("header");
        self.myHtmlUtil.addTh(tr, "Num").addClass("num").addClass("sorttable_numeric");
        self.myHtmlUtil.addTh(tr, "id");
        self.myHtmlUtil.addTh(tr, "collection");
        self.myHtmlUtil.addTh(tr, "Item Handle");
        self.myHtmlUtil.addTh(tr, "dc.title" + self.getLangSuffix());
        
        var mdCols = [];
        if (data.metadata) {
            $.each(data.metadata, function(index, field) {
                if (field != "") {
                    self.myHtmlUtil.addTh(tr,field + self.getLangSuffix()).addClass("returnFields");
                    mdCols[mdCols.length] = field;            
                }
            });            
        }
        
        $.each(data.items, function(index, item){
            var tr = self.myHtmlUtil.addTr(itbl);
            tr.addClass(index % 2 == 0 ? "odd data" : "even data");
            self.myHtmlUtil.addTd(tr, self.myReportParameters.getOffset()+index+1).addClass("num");
            self.myHtmlUtil.addTd(tr, self.getId(item));
            if (item.parentCollection == null) {
                self.myHtmlUtil.addTd(tr, "--");            
            } else {
                self.myHtmlUtil.addTdAnchor(tr, item.parentCollection.name, self.ROOTPATH + item.parentCollection.handle);
            }
            self.myHtmlUtil.addTdAnchor(tr, item.handle, self.ROOTPATH + item.handle);
            self.myHtmlUtil.addTd(tr, item.name);
            
            for(var i=0; i<mdCols.length; i++) {
                var key =  mdCols[i];
                var td = self.myHtmlUtil.addTd(tr, "");
                $.each(item.metadata, function(colindex, metadata) {
                    if (metadata.key == key) {
                        if (metadata.value != null) {
                            var div = $("<div>"+metadata.value+"</div>");
                            td.append(div);
                        }
                    }
                });
            }
        });
        
        this.displayItems(data["query-annotation"],
            this.myReportParameters.getOffset(),
            this.myReportParameters.getLimit(),
            data["unfiltered-item-count"],
            function(){
                self.myReportParameters.updateOffset(false);
                self.runQuery();
            }, 
            function(){
                self.myReportParameters.updateOffset(true);
                self.runQuery();
            }
        );
        
        if (this.hasSorttable()) {
            sorttable.makeSortable(itbl[0]);            
        }
        $("#metadatadiv").accordion("option", "active", $("#metadatadiv > h3").length - 1); 
    }
    
    //Ignore the first column containing a row number and the item handle, get handle for the collection
    this.exportCol = function(colnum, col) {
        var data = "";
        if (colnum == 0) return "";
        if (colnum == 3) return "";
        data += (colnum == 1) ? "" : ",";
        
        if (colnum == 2) {
            var anchor = $(col).find("a");
            var href = anchor.is("a") ? anchor.attr("href").replace(self.ROOTPATH,"") : $(col).text();
            data += "\"" + href + "\"";
        } else {
            data += self.exportCell(col);        }
        return data;
    }
}
QueryReport.prototype = Object.create(Report.prototype);


var QueryableMetadataFields = function(report) {
    MetadataFields.call(this, report);
    var self = this;
    
    this.initFields = function(data, report) {
        self.metadataSchemas = data;
        var params = report.myReportParameters.params;
        var fields = params["query_field[]"];
        var ops = params["query_op[]"];
        var vals = params["query_val[]"];
        if (fields && ops && vals) {
            if (fields.length == 0) {
                self.drawFilterQuery("*","exists","");
            } else {
                for(var i=0; i<fields.length; i++) {
                    var op = ops.length > i ? ops[i] : "";
                    var val = vals.length > i ? vals[i] : "";
                    self.drawFilterQuery(fields[i],op,val);
                } 
            }                
        }
        self.drawShowFields(params["show_fields[]"]);
        self.initQueries();        
        //report.spinner.stop();
        $(".query-button").attr("disabled", false);
    }
    
    this.initQueries = function() {
        $("#predefselect")
          .append($("<option value='new'>New Query</option>"))
          .append($("<option value='q1'>Has No Title</option>"))
          .append($("<option value='q2'>Has No dc.identifier.uri</option>"))
          .append($("<option value='q3'>Has compound subject</option>"))
          .append($("<option value='q4'>Has compound dc.contributor.author</option>"))
          .append($("<option value='q5'>Has compound dc.creator</option>"))
          .append($("<option value='q6'>Has URL in dc.description</option>"))
          .append($("<option value='q7'>Has full text in dc.description.provenance</option>"))
          .append($("<option value='q8'>Has non-full text in dc.description.provenance</option>"))
          .append($("<option value='q9'>Has empty metadata</option>"))
          .append($("<option value='q10'>Has unbreaking metadata in description</option>"))
          .append($("<option value='q12'>Has XML entity in metadata</option>"))
          .append($("<option value='q13'>Has non-ascii character in metadata</option>"))
          .on("change",function(){
              $("div.metadata").remove();
              var val = $("#predefselect").val();
              if (val ==  'new') {
                  self.drawFilterQuery("","","");            
              } else if (val ==  'q1') {
                  self.drawFilterQuery("dc.title","doesnt_exist","");                        
              } else if (val ==  'q2') {
                  self.drawFilterQuery("dc.identifier.uri","doesnt_exist","");                        
              } else if (val ==  'q3') {
                  self.drawFilterQuery("dc.subject.*","like","%;%");                        
              } else if (val ==  'q4') {
                  self.drawFilterQuery("dc.contributor.author","like","% and %");                        
              } else if (val ==  'q5') {
                  self.drawFilterQuery("dc.creator","like","% and %");                        
              } else if (val ==  'q6') {
                  self.drawFilterQuery("dc.description","matches","^.*(http://|https://|mailto:).*$");                        
              } else if (val ==  'q7') {
                  self.drawFilterQuery("dc.description.provenance","matches","^.*No\\. of bitstreams(.|\\r|\\n|\\r\\n)*\\.(PDF|pdf|DOC|doc|PPT|ppt|DOCX|docx|PPTX|pptx).*$");                        
              } else if (val ==  'q8') {
                  self.drawFilterQuery("dc.description.provenance","doesnt_match","^.*No\\. of bitstreams(.|\\r|\\n|\\r\\n)*\\.(PDF|pdf|DOC|doc|PPT|ppt|DOCX|docx|PPTX|pptx).*$");                        
              } else if (val ==  'q9') {
                  self.drawFilterQuery("*","matches","^\\s*$");                        
              } else if (val ==  'q10') {
                  self.drawFilterQuery("dc.description.*","matches","^.*[^\\s]{50,}.*$");                        
              } else if (val ==  'q12') {
                  self.drawFilterQuery("*","matches","^.*&#.*$");                        
              } else if (val ==  'q13') {
                  self.drawFilterQuery("*","matches","^.*[^[:ascii:]].*$");                        
              }
          });
    }

    this.drawFilterQuery = function(pField, pOp, pVal) {
        var div = $("<div class='metadata'/>").appendTo("#queries");
        var sel = $("<select class='query-tool' name='query_field[]'/>");
        var opt = $("<option value='*'>Any Field</option>");
        sel.append(opt);
        $.each(self.metadataSchemas, function(index, schema){
            if (schema.prefix == 'eperson') {
                return;
            }
            $.each(schema.fields, function(findex, field) {
                var name = field.name;
                var parts = name.match(/^([^\.]+)\.([^\.]+)\.([^\.]+)$/);
                if (parts == null) {
                    var wildname = name + ".*";
                    var opt = $("<option/>");
                    opt.attr("value",wildname).text(wildname);
                    sel.append(opt);                
                }
                var opt = $("<option/>");
                opt.attr("value",name).text(name);
                sel.append(opt);
            });
        });
        sel.val(pField);
        div.append(sel);
        var opsel = $("<select class='query-tool' name='query_op[]'/>");
        $("<option>exists</option>").val("exists").appendTo(opsel);
        $("<option>does not exist</option>").val("doesnt_exist").appendTo(opsel);
        $("<option selected>equals</option>").val("equals").appendTo(opsel);
        $("<option>does not equal</option>").val("not_equals").appendTo(opsel);
        $("<option>like</option>").val("like").appendTo(opsel);
        $("<option>not like</option>").val("not_like").appendTo(opsel);
        $("<option>contains</option>").val("contains").appendTo(opsel);
        $("<option>does not contain</option>").val("doesnt_contain").appendTo(opsel);
        $("<option>matches</option>").val("matches").appendTo(opsel);
        $("<option>does not match</option>").val("doesnt_match").appendTo(opsel);
        opsel.val(pOp);
        opsel.change(function(){
            self.valField($(this));
        });
        div.append(opsel);
        var input = $("<input class='query-tool' name='query_val[]'/>");
        div.append(input);
        input.val(pVal);
        self.valField(opsel);
        $("<button class='field_plus'>+</button>").appendTo(div).click(function(){
            self.drawFilterQuery();
            self.queryButtons();
        });
        $("<button class='field_minus'>-</button>").appendTo(div).click(function(){
            $(this).parent("div.metadata").remove();
            self.queryButtons();
        });
        self.queryButtons();
    }

    this.valField = function(valop) {
        var val = valop.val();
        var disableval = (val == "exists" || val == "not_exists");
        var valinput = valop.parent("div.metadata").find("input[name='query_val[]']");
        valinput.attr("readonly",disableval);
        if (disableval) {
            valinput.val("");        
        }
    }

    this.queryButtons = function() {
        $("button.field_plus").attr("disabled",true);
        $("button.field_plus:last").attr("disabled",false);
        $("button.field_minus").attr("disabled",false);
        if ($("button.field_minus").length == 1) {
            $("button.field_minus").attr("disabled",true);                
        }
    }
}

QueryableMetadataFields.prototype = Object.create(MetadataFields.prototype);

var myReport=new QueryReport();
myReport.init();




