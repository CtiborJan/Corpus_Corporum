var object_viewer_loaded=true;
class cls_external_links_composer
{
    constructor(e)
    {
        this.element=e;
        var type,value,ref,text,source,label;
        type=e.getAttribute("type")||"";
        source=e.getAttribute("source")||"";
        value=e.getAttribute("value")||"";
        ref=e.getAttribute("ref")||"";
        text=String(e.innerHTML)||"";
        
        if (source.toLowerCase()=="viaf" && ref=="" && text=="" & value!="")
        {
            source="VIAF ID";
            ref="https://viaf.org/viaf/"+value;
            text=value;
        }
        else if  (source.toLowerCase()=="wikidata" && ref=="" && text=="" & value!="")
        {
            source="Wikidata ID";
            ref="https://wikidata.org/wiki/"+value
            text=value;
        }
        else if  (source.toLowerCase()=="dnb" && ref=="" && text=="" & value!="")
        {
            source="Deutsche Nationalbibliothek ID";
            ref="https://d-nb.info/gnd/"+value
            text=value;
        }
        else if  (source.toLowerCase()=="mirabile")
        {
            if (ref=="" && text=="" & value!="")
            {
                source="Mirabile ID (SISMEL Firenze)";
                text=value;
            }
            else if (ref!="")
            {
                source="Mirabile (SISMEL Firenze)";
                text=ref;
            }
        }
        
        if (ref!="")
        {
            this.ref=ref;
        }
        if (text!="")
        {
            this.anchor_text=text;
        }
        else if (value!="")
        {
            this.anchor_text=value;
        }
        else if (this.ref!="")
        {
            this.anchor_text=this.ref;
        }
            
        if (source!="")
            this.label=source+":";
            
    }
}
class cls_smod_object_viewer
{
    constructor(parent=null)
    {
        //the purpose of this submodule (or functional module) is to create simple html with informations about any object (corpus, author, work, text...)
        this.div=null;
        this.obj_type="";
        this.parent_obj=parent;
    }
    ns_resolver(prefix="")
    {
        return 'http://mlat.uzh.ch/2.0';
    }
    display_object_info(path,xml_data,accessibility="1")
    {
        this.div=document.createElement("div");
        if (path!="/")
        {
            var obj=xml_data.evaluate("cc:navigation/cc:last_step/cc:item",xml_data,this.ns_resolver);
            obj=obj.iterateNext();
            var summary=xml_data.evaluate("cc:navigation/cc:summary",xml_data,this.ns_resolver);
            summary=summary.iterateNext();
            
            
            this.obj_type=obj.getAttribute("type");
            this.name=obj.getElementsByTagName("name");
            this.name=this.name[0].textContent;
            this.div.innerHTML="<h2 class='obect_viewer_header'>"+this.name+" <span style='color:gray;font-size:12pt'>("+this.obj_type+")</h2>";
            
            if (accessibility=="1")
                this.append_fulltextsearch_box(this.div);
            
            if (this.obj_type=="corpus")
            {
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:description","");
                var cover_page=xml_data.evaluate("cc:navigation/cc:last_step/cc:item/cc:cover_page_url",xml_data,this.ns_resolver);
                cover_page=cover_page.iterateNext();
                if (cover_page!=null && cover_page!="")
                {
                    var cp_div=div("corpus_cover_page",this.div);
                    cp_div.innerHTML=cover_page.innerHTML;
                }
                
            }
            else if (this.obj_type=="author")
            {
                var author_info=xml_data.evaluate("cc:navigation/cc:last_step/cc:item/cc:profile",xml_data,this.ns_resolver);
                author_info=author_info.iterateNext();
                var author_info_box=document.createElement("info_profile_box");
                if (author_info!=null)
                    author_info_box.innerHTML=author_info.textContent;
                
                
               var cover_page=xml_data.evaluate("cc:navigation/cc:last_step/cc:item/cc:cover_page_url",xml_data,this.ns_resolver);
                cover_page=cover_page.iterateNext();
                
                var synonyms_box=document.createElement("info_box");
                synonyms_box.appendChild(document.createElement("info_label")).innerHTML="Alternative name forms (from DNB): ";
                var synonyms=xml_data.evaluate("cc:navigation/cc:last_step/cc:item/cc:name_data/cc:synonym",xml_data,this.ns_resolver);
                var synonym=null;
                var synonyms_count=0;
                while (synonym=synonyms.iterateNext())
                {
                    
                    var synonym_span=document.createElement("info_value");
                    synonyms_count++;
                    if (synonyms_count>10)
                        synonym_span.style.display="none";
                    synonym_span.innerHTML=synonym.textContent+";&nbsp; ";
                    synonyms_box.appendChild(synonym_span);
                    
                }
                if (synonyms_count>10)
                {
                    this.append_button(synonyms_box," show more",this.show_more_synonyms);
/*                    var show_more_synonyms=document.createElement("info_btn");
                    show_more_synonyms.addEventListener("click",this.show_more_synonyms);
                    show_more_synonyms.innerHTML=" show more";
                    synonyms_box.appendChild(show_more_synonyms);*/
                }
                
                
                span("",this.div,convert_date(xpei(xml_data,"cc:navigation/cc:last_step/cc:item/cc:time_data/cc:event")));
                
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:profile","Author profile:<br/>",);
                
                if (synonyms_count>0)
                    this.div.appendChild(synonyms_box);
                
                var externals;
                var external;
                //elc=external_link_composer
                externals=xpei(xml_data,"cc:navigation/cc:last_step/cc:item/cc:external");
                while(external=externals.iterateNext())
                {
                    var elc=new cls_external_links_composer(external);
                    var d=create_element("info_box","",this.div);
                    create_element("info_label","",d,elc.label+" ");
                    create_element("info_link","",d,"<a href='"+elc.ref+"' target='_blank'>"+elc.anchor_text+"</a>");
                }
               /* this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:viaf_id","VIAF ID: ","https://viaf.org/viaf/{}");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:dnb_id","Deutsche Nationalbibliothek ID: ","https://d-nb.info/gnd/{DNB (.*)}");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:dnb_life_data","Life dates according to Deutsche Nationalbibliothek: ");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:wikidata_id","Wikidata ID: ","https://www.wikidata.org/wiki/{}");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:mirabile_link","Link to Mirabile (SISMEL Firenze): ","{}");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_idno","CC idno: ");
                */
               this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_idno","CC idno: ");
               
            }
            else if (this.obj_type=="work")
            {
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:extra_informations/cc:author_name","Author:");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_id","CC ID:");
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_idno","CC idno: ");
                
            }
            else if (this.obj_type=="text")
            {
                this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_idno","CC idno: ");
                //this.append_simple_info_box(this.div,xml_data,"cc:navigation/cc:last_step/cc:item/cc:corpus/@cc:exp-referenced_item_name","Corpus: ");
                var corpus_name=xp(xml_data,"cc:navigation/cc:last_step/cc:item/cc:corpus/@exp-referenced_item_name");
                create_element("info_box","",this.div,"<info_label>Corpus: </info_label>"+corpus_name);
                
                var incipit=xp(xml_data,"cc:navigation/cc:incipit");
                var inc_length=(incipit.match(/[\s\n]/g) || []).length;
                if (inc_length>25)
                {
                    var incipit=incipit.split(/[\s\n]/);
                    incipit=incipit.slice(0, 25);
                    incipit=incipit.join(" ")+"...";
                }   
                create_element("info_box","",this.div,"<info_label>Incipit: </info_label>"+incipit);
                
                var xml_publ=div("",this.div,"<h3>XML publication info:</h3>");
                this.append_simple_info_box(xml_publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:xml_provenience/cc:source","Source:");
                this.append_simple_info_box(xml_publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:xml_provenience/cc:editor","Editor:");
                this.append_simple_info_box(xml_publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:xml_provenience/cc:note","Note:");
                if (xml_publ.childNodes.length==1)
                    xml_publ.remove();

                var publ=div("",this.div,"<h3>Source info:</h3>");
                    
                //this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:source_type","The type of source for the XML edition:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:edition_type","Type of edition:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:title","Title:");
                var b=this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:volume","vol.");
                var f_pag=xp(xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:pages/cc:first");
                var l_pag=xp(xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:pages/cc:last");
                if (b==null && (f_pag!="" || l_pag!=""))
                    b=this.append_simple_info_box(publ,xml_data,"","Pages:","",false);
                if (f_pag!="" && l_pag!="")
                    info_value("",b,"  "+f_pag+"-"+l_pag);
                else if (f_pag!="")
                    info_value("",b,"  "+f_pag);
                else if (l_pag!="")
                    info_value("",b,"  "+l_pag);
                
                
                

                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:editor","Editor:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:publisher","Publisher:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:publication_place","Place:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:date","Date of publication:");
                this.append_simple_info_box(publ,xml_data,"cc:navigation/cc:last_step/cc:item/cc:publication_data/cc:note","Note:","",true,["",null],"");
                
                
            }
            
            
            
            
            
            var stat=document.createElement("div");
            stat.appendChild(document.createElement("h3")).innerHTML="Statistics:";
            
            if (this.obj_type=="corpus")
            {
               
                
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:summary/cc:corpora","Subcorpora: ",false,true,["",null,"0"]);
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:summary/cc:authors","Authors: ");
            }
            if (this.obj_type=="corpus" || this.obj_type=="author")
            {
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:summary/cc:works","Works: ");
            }
            if (this.obj_type=="corpus" || this.obj_type=="author" || this.obj_type=="work")
            {
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:summary/cc:texts","Texts: ");
            }     
            if (this.obj_type=="corpus" || this.obj_type=="author")
            {
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:summary/cc:words","Words: ");
            }
            
            if (this.obj_type=="text")
            {
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:last_step/cc:item/cc:word_count","Words: ");
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:last_step/cc:item/cc:character_count_s","Characters: ");
                this.append_simple_info_box(stat,xml_data,"cc:navigation/cc:last_step/cc:item/cc:element_count","XML elements: ");

                
                //this.append_simple_info_box(this.div,xml_data, "cc:navigation/cc:last_step/cc:item/cc:metadata","Loaded in Corpus Corporum");
            }
            
            if (this.obj_type=="corpus" && cover_page!="")   
            {
                
            }
            
            this.div.appendChild(stat);
            if (this.obj_type=="text")
            {
                var created=xp(xml_data,"cc:navigation/cc:last_step/cc:item/cc:cc_metadata/cc:created");
                var date=created.match(/([0-9]+)/g);

                div("",this.div,"<br/>This text was (re)loaded into CC on "+date[2]+"/"+date[1]+"/"+date[0]);
            }
            
        }
        else
        {
        }
        
        return this.div;
    } 
    append_button=(element,caption,event_listener,font_size="100%",padding_horizontal="2px",padding_vertical="2px")=>
    {

        var btn=document.createElement("info_btn");
        btn.style.fontSize=font_size;
        btn.style.paddingLeft=padding_horizontal;
        btn.style.paddingRight=padding_horizontal;
        btn.style.paddingTop=padding_vertical;
        btn.style.paddingBottom=padding_vertical;
        btn.tabIndex="0";
        btn.addEventListener("click",event_listener);
        btn.addEventListener("keypress",event_listener);
        btn.innerHTML=caption;
        if (element!=null)
            element.appendChild(btn);
        else
            return btn;
        
    }
    append_fulltextsearch_box=(element)=>
    {
        var d=div("height_75",element);
        //d.style.alignItems="center";
        div("",d,"Perform full-text search in " +this.name);
        this.ft_txt=textbox("margin_auto",d);
        this.ft_txt.style.height="30px";
        this.ft_txt.style.top="0px";
        this.ft_txt.addEventListener("keypress",this.on_txt_fts_keypress);
        
    }
    on_txt_fts_keypress=(e)=>
    {//odešleme zprávu o tom, že chceme fultextové vyhledávání a (sub)modul k tomu určený nám ho provede
        if (e.keyCode==13)
        {
            var filters=[];
            filters["corpus_idno"]=[];
            filters["author_idno"]=[];
            filters["work_idno"]=[];
            
            var path=this.parent_obj.path.split("/");
            for (var i=path.length-1;i>=0;i--)
                if (path[i]=="")
                    path.splice(i,1);
            var path_type=this.parent_obj.path_type.split("/");
            for (var i=path_type.length-1;i>=0;i--)
                if (path_type[i]=="home" || path_type[i]=="")
                    path_type.splice(i,1);//protože "home" nemá ždné id, tak není v estě (path), všem v path_type "home" je.
            for (var i=0;i<path_type.length;i++)
            {
                if (path_type[i]=="corpus")
                    filters["corpus_idno"].push(path[i]);
                if (path_type[i]=="author")
                    filters["author_idno"].push(path[i]);
                if (path_type[i]=="work")
                    filters["work_idno"].push(path[i]);
            }
            
            var ev_fulltext_search_request=new CustomEvent('perform_fulltext_search_request',{
                    detail:{query:e.currentTarget.value,filters:filters}});
            dispatch_event(ev_fulltext_search_request);
        }
    }
    append_simple_info_box=(element,xml_data,value_xpath,label,href="",on_no_value_hide=true,no_value=["",null],separator_on_multiple_values=",")=>
    {
        var value_iterator=xml_data.evaluate(value_xpath,xml_data,this.ns_resolver);
        var value=null;
        var total_value="";
        var i=0;
        var box=document.createElement("info_box");
        if (label.endsWith(" ")==false)
            label=label+" ";
        box.appendChild(document.createElement("info_label")).innerHTML=label;
        while (value=value_iterator.iterateNext())
        {
            i+=1;
            if (i==1)
            {
                
            }
            if (value!=null)
                value=this.tei_to_html(value);
            
            if (i>1 && no_value.indexOf(value)==-1)
                value=separator_on_multiple_values+" "+value;
            
            total_value+=value;
            
        }
        if (href=="")
        {
            if (total_value.match(/^[0-9]{5,}$/))
                total_value=Intl.NumberFormat().format(Number(total_value));
            box.appendChild(document.createElement("info_value")).innerHTML=total_value;
        }
        else
        {
            if (href.indexOf("{}")!=-1)
                box.appendChild(document.createElement("info_link")).innerHTML="<a href='"+href.replace("{}",total_value)+"' target='_blank'>"+total_value+"<span class='smaller'> &#8594;</span></a>";
            else
            {
                var regex_str=href.match(/\{([^}]*)\}/)[1];
                var regex=new RegExp(regex_str);
                var href_value=regex.exec(value);
                if (href_value!=null)
                    href_value=href_value[1];
                href=href.replace("{"+regex_str+"}",href_value);
                box.appendChild(document.createElement("info_link")).innerHTML="<a href='"+href+"' target='_blank'>"+total_value+"<span class='smaller'> &#8594;</span></a>";
            }
        }
        if (no_value.indexOf(total_value)==-1 || on_no_value_hide==false)
            element.appendChild(box);
        
        return box;
    }
    show_more_synonyms=(e)=>
    {
        var p=e.target.parentNode;
        var synonyms=p.getElementsByTagName("info_value");
        if (e.target.innerHTML.indexOf("more")!=-1)
        {
            for (var i=0;i<synonyms.length;i++)
            {
                synonyms[i].style.display="initial";
            }
            e.target.innerHTML="show less";
        }
        else
        {
            for (var i=10;i<synonyms.length;i++)
            {
                synonyms[i].style.display="none";
            }
            e.target.innerHTML="show more";
        }
    }
    
    display_xml_struct(xml,c)
    {
        var process_element=function(el,container)
        {
            if (el.nodeName!="#text" && el.nodeName!="#comment")
            {
                
                if (el.nodeName=="a" || el.nodeName=="ref")
                {
                    var a=create_element("a","",container);
                    if (el.getAttribute("href")!="")
                        a.href=el.getAttribute("href")
                    else if (el.getAttribute("target")!="")
                        a.href=el.getAttribute("target")
                    a.target="_blank";
                }
                else if (el.nodeName!="b" && el.nodeName!="strong" && el.nodeName!="i" && el.nodeName!="em" && el.nodeName!="hi")
                {
                    var ed=div ("l_margin_10",container);
                    span("bold",ed,el.nodeName+": ");
                }                
                else
                    ed=container;
                
                for (var i=0;i<el.childNodes.length;i++)
                {                           
                    process_element(el.childNodes[i],ed);
                }
            }
            else if (el.nodeName=="#text")
                span("",container,el.textContent);
            else if (el.nodeName=="#comment")
                span("color_gray",container,"/*"+el.textContent+"*/");
            
        }
        process_element(xml,c);

        
    }
    tei_to_html(tei)
    {
        var one_element_to_html=function(el)
        {
            var rv="";
            var cancel=false;
            var tn=el.nodeName.toLowerCase();
            if (tn=="#text")
                rv=el.textContent;
            else if (tn=="ref")
            {
                var target=el.getAttribute("target");
                rv ='<a href="'+target+'" target="_blank" class="link">';
            }
            else if (tn=="hi")
            {
                var rend=el.getAttribute("rend");
                if (rend=="italic")
                    rv="<em>";
                if (rend=="bold")
                    rv="<strong>";
            }
            else if (tn=="p")
                rv="<p>";
            else if (tn=="div")
                rv="<div>";
            else
                rv="";


            if (cancel==false)
                for (var i=0;i<el.childNodes.length;i++)
                    rv+=one_element_to_html(el.childNodes[i]);

            var close_tag=rv.match(/^<([^ >]+)/);
            if (close_tag!=null)
                close_tag="</"+close_tag[1]+">";
            else
                close_tag="";
            return rv+close_tag;
        }
        return one_element_to_html(tei);
        
    }
    
}
