var mod_browser=true; 

class  cls_mod_browser extends cls_mod
{
    
    constructor(parent_slot,path="/")
    {
        super(parent_slot);
        this.taskbar_text="B";//what will be shown in the square in the "taskbar"
        this.taskbar_color="black"; //color of this letter
        this.taskbar_bckg_color=taskbar_btn_color; //background color of this square
        this.module_name="Browser"; //full name 
        this.module_description="Browse the database of Corpus Corporum"; //will be shown when mouse over the taskbar button for this module
        this.label="";
        
        this.path=path;
        this.path_2="";
        
         
        
        this.div_navigation_panel=div("mod_browser_navigation_panel slot_module_default_title",this.module_container);//upmost strip indicating, what is the currently opened position
        var div_inner_container=div("mod_browser_info_and_lst_div",this.module_container);//div containing all the rest of module elements
        
        this.div_simple_db_searcher=div("",div_inner_container);//div containing box for simple search module (upper textbox for searching the object of the DB)
        this.div_info=div("mod_browser_info_div",div_inner_container)
        this.div_small_nav_container=div("mod_browser_small_nav_container",div_inner_container);
        this.div_list_container=div("mod_browser_list_container",div_inner_container);

        
        
        this.simple_db_searcher=new cls_smod_simple_db_searcher(this.div_simple_db_searcher);
        
        
        this.object_viewer=new cls_smod_object_viewer(this);
        
       
         
        
        
        this.list_name=parent_slot.name+"_"+this.my_index+"_lst0";
        this.lst=new list_control(this.list_name,this.div_list_container,false,false,true);
        this.lst.list_items_padded=true;
        this.navigate(path);
        this.lst.pointer=true;
        this.xml_data=null;
        this.my_index=this.parent_slot.add_module(this)-1;
        this.dlm=Array();//dynamically loaded modules
        
        document.addEventListener("navigate_request",this.navigation_requested);
        
        //this.parent_slot.set_label("Browsing the database");
    }
    
    ns_resolver()
    {
        return 'http://mlat.uzh.ch/2.0';
    }
    navigate(path,list_obj=null,virtual=false)
    {
        
        var url_obj=new URL(window.location.href);
        var params=url_obj.searchParams;
        params.set("path",path);
        history.replaceState(null, null,  "?"+params.toString().replaceAll("%2F","/"));
        //history.pushState(null,null,window.location);
        
        if (list_obj==null)
        {
            list_obj=this.lst;
        }
        var lsidno=path.match(/\/([^/]*)$/);
        if (lsidno!=null)
            this.last_step_idno=lsidno[1];
        
        
        var me=this;
        
        
        
        var process_data=function(data)
        {
            
            if (virtual==false)
            {
                me.xml_data=data;
                me.virtual_created=false;
                me.last_object=data;
            }
            else
            {
                me.xml_data_2=data;
                me.path_2=path;
                me.last_object=data;
            }
            
            var ns_resolver = function resolver() {
                    return 'http://mlat.uzh.ch/2.0';
                }
                
            me.accessible=xp(data,"cc:navigation/cc:last_step/@accessible");

            var psteps=xpei(data,"cc:navigation/cc:path_steps/cc:path_step");
            var pstep="";
            me.path_type="";//charakteristika zobrazené cesty: home/corpus/autor, /home/autor atd.
            me.path="";//upravíme cestu podle skutečný obdržených dat: může se stát, že ji máme třeba ve formě "tabelle:xxx" atd., což nechceme
            if (psteps!=null)
                while (pstep=psteps.iterateNext())
                {
                    me.path=pstep.getAttribute("full_path");
                    me.path_type+="/"+pstep.getAttribute("type");
                }
                
            var dtype=data.evaluate("cc:navigation/cc:path_steps/cc:path_step[last()]/@type",data,ns_resolver);
            if (dtype!=null)
            {
                dtype=dtype.iterateNext();
                if (dtype!=null)
                    dtype=dtype.textContent;
                else
                    dtype="home";
            }
            
            if (virtual==false)
            {
                var schema=me.list_schemata(me.path_type);
                
                //list_obj.add_metadata("path",path);
                list_obj.process_data(data,schema,false,me.lst_item_clicked,me.lst_dropdown_opened,["path"],[me.path],me.row_postprocessing_fn);
                list_obj.tbl.addEventListener("in_list_button_clicked",me.in_list_button_clicked);
            //list_obj.metadata["type"]=dtype;
            //lst.tbl.addEventListener("item_clicked",test_item_clicked);
            //lst.tbl.addEventListener("dropdown_opened",test_event_handling);

            }
            
            if ((list_obj.name==me.list_name || list_obj.name=="/") && virtual==false)//můžeme otvírat i "rozbalovací" seznamy - v takovém případě ale v navigaci zůstáváme na steném místě (a ten seznam se v takovém případě jmenuje jinak!)
            {
                
                me.path=path;
                me.create_navigation_bar();
                me.create_info();
                
                me.dispatch_navigated_request();
                
            }
            else if (virtual==true)
            {
                me.create_info(true);
            }
            
            var access_denied=xp(data,"cc:navigation/cc:access_denied");
            if (access_denied!="")
                span("mod_browser_access_denied_info",me.div_info,access_denied);
            
            //zde do stránky vložíme případné dynamicky vkládané moduly
            
            
            var modules_to_add=me.xml_data.evaluate("cc:navigation/cc:last_step/cc:item/cc:module_to_add",me.xml_data,ns_resolver);
            var module=null;
            me.dlm=Array();
            while (module=modules_to_add.iterateNext())
            {
                var mpath=module.getElementsByTagName("file");
                var cls_name=module.getElementsByTagName("class_name")
                if (cls_name.length>0)
                    cls_name=cls_name[0].textContent;
                document.addEventListener("script_loaded",me.dynamically_added_module_loaded);
                load_script(mpath[0].textContent,cls_name);
                
            }
            
            B.sandglass.close();
            
            
        }
        
        B.sandglass.open(this.parent_slot.inner_div);
        
        list_obj.get_data_from_server(url+"php_modules/navigate.php?load="+path,process_data);
        
    }
    row_postprocessing_fn=(columns,xml_data,row_xml_data,row_html)=>
    {
        var text_count_present=false;
        for (var i=0;i<columns.length;i++)
            if (columns[i].name=="cc:texts_count")
            {
                text_count_present=true;
                break;
            }
        if (text_count_present==true)
        {
            var texts=0;
            var td=row_html.getElementsByTagName("td");
            var texts_td=td[i+1];//+1 protože první je vždy sloupec na dropdown, který ale v columns nijak definován není
            if (texts_td!=null)
                texts=Number(texts_td.textContent.replaceAll(/\s/g,""));
            var accessible_texts=Number(xp(xml_data,"cc:accessible_texts_count",row_xml_data));
            if (accessible_texts!=texts  && accessible_texts!=undefined)
            {
                texts_td.childNodes[0].innerHTML=accessible_texts+" ("+texts+")";
                texts_td.childNodes[0].title="Access to some texts is limited due to possible copyright restrictions.";
                if (accessible_texts==0)
                    row_html.classList.add("color_lightgray");
            }
        }
        
    }
    dynamically_added_module_loaded=(e)=>
    {
        var anchor=this.module_container.getElementsByTagName("added_module_anchor");
            if (anchor.length==0)
                anchor=this.div_info.lastChild;
            else
                anchor=anchor[0];
        var cls_name=e.detail.class_name;
        
        var constr=eval(cls_name);
        var new_object=new constr();
        new_object.add_me_to_page(anchor);
    }
    in_list_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (e.detail.action_id=="open_text_of_work")//kliknutí na tlačítko "open text directly" v seznamu, kde máme vylistovaná díla
        {/*nemůže otevřít jen tak nějaký text, který k tomu dílu najdeme: musíme otevřít ten text, který je v konkrétní "virtuální kolekci" na adrese, kde zrovna jsme
            Tj., pokud máme od nějakého díla více textů v různých korpusech, musíme otevřít ten text, který patří do korpusu, který zrovna máme otevřený (pokud máme)
        */ 
            var me=this;
            var work_idno=e.detail.list_obj.selection.get("cc:idno",e.detail.row_index)[0]["cc:idno"];
            var process_data=function(data)
            {
                var texts=data.evaluate("cc:navigation/cc:contents/cc:text/cc:idno",data,ns);
                if (texts!=null)
                    texts=texts.iterateNext();//vezmeme první text, který najdeme (většinou jich asi stejně víc nebude)
                if (texts!=null)
                    texts=texts.textContent;
                me.dispatch_load_text_request(texts);
            }
            
            this.lst.get_data_from_server(url+"php_modules/navigate.php?load="+e.detail.list_obj.metadata["path"]+"/"+work_idno,process_data); //využijeme lst objekt,aby nám získal data, v nichž uvidíme texty onoh díla na právě otevřené adrese
            
            
        }
        else if (e.detail.action_id=="open_text_directly")
        {
            var text_idno=e.detail.list_obj.selection.get("cc:idno",e.detail.row_index)[0]["cc:idno"];
            this.dispatch_load_text_request(text_idno);
        }
        
    }
    navigation_requested=(e)=>
    {
        this.navigate(e.detail.path,null);
        this.parent_slot.activate_module(this.my_index);
    }
    create_navigation_bar()
    {
        this.div_navigation_panel.innerHTML="";
        this.div_small_nav_container.innerHTML="";
        var ns_resolver = function resolver() {return 'http://mlat.uzh.ch/2.0';}
        var steps=this.xml_data.evaluate("cc:navigation/cc:path_steps/cc:path_step",this.xml_data,ns_resolver);
        if (steps!=null)
        {
            
            var html="";
            var step=null;
            var steps_obj=Array();
            while (step=steps.iterateNext())
            {
                var step_obj={title:step.textContent,path:step.getAttribute("full_path"),cc_idno:step.getAttribute("idno"),type:step.getAttribute("type")};
                steps_obj.push(step_obj);
            };
            for (var i=0;i<steps_obj.length;i++)
            {
                if (steps_obj[i].title=="home")
                    steps_obj[i].title="Cc";
                
                
                var path_step_span=document.createElement("span");
                var small_nav_div=document.createElement("div");
                
                path_step_span.classList.add("navigation_panel_step");
                if (i==90 || i==steps_obj.length-1)
                    path_step_span.classList.add("navigation_panel_step_first_and_last");
                
                path_step_span.dataset["path"]=steps_obj[i].path;
                small_nav_div.dataset["path"]=steps_obj[i].path;
                
                path_step_span.textContent=steps_obj[i].title;
                small_nav_div.textContent=steps_obj[i].title;
                small_nav_div.title=steps_obj[i].title;
                
                
                path_step_span.addEventListener("click",this.navigation_step_clicked);
                small_nav_div.addEventListener("click",this.navigation_step_clicked);
                
                small_nav_div.classList.add("small_nav_div");
                small_nav_div.style.marginLeft=(15*i)+"px";
                this.div_navigation_panel.appendChild(path_step_span);
                this.div_small_nav_container.appendChild(small_nav_div);
                this.div_small_nav_container.appendChild(document.createElement("div")).innerHTML="<span></span>";
                if (i<steps_obj.length-1)
                {
                    var separator_span=document.createElement("span");
                    separator_span.classList.add("navigation_panel_step");
                    separator_span.textContent=">";
                    this.div_navigation_panel.appendChild(separator_span);
                }
                this.steps_obj=steps_obj;//dále s nimi budeme pracovat (posílat je jako detail události navigated)
                
            };
            this.label=this.div_navigation_panel.textContent;
        }
    }
    navigation_step_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        var path=e.target.dataset["path"];
        this.navigate(path,null);
    }
    ns_resolver() {return 'http://mlat.uzh.ch/2.0';}
    
    
    create_text_buttons=(parent_to_attach_to)=>
    {
        
        if (this.accessible==1)
        //if (xp(this.last_object,"cc:navigation/cc:last_step/@accessible")=="1")
        {
            if (xp(this.last_object,"cc:navigation/cc:last_step/cc:item/cc:xml_file_downloadable")!="false")
            {
                this.download_POS_xml_button=this.object_viewer.append_button(null,"Download lemmatised XML",this.download_POS_xml_button_clicked,"100%","4px","4px");
                parent_to_attach_to.firstChild.insertAdjacentElement("afterend",this.download_POS_xml_button);

                this.download_xml_button=this.object_viewer.append_button(null,"Download XML",this.download_xml_button_clicked,"100%","4px","4px");
                parent_to_attach_to.firstChild.insertAdjacentElement("afterend",this.download_xml_button);
                var data_path=xp(this.last_object,"cc:navigation/cc:last_step/cc:item/cc:data_path");
                if (data_path!="" && data_path!=undefined)
                {
                    this.download_xml_and_data_button=this.object_viewer.append_button(null,"Download XML and images (as zip)",this.download_xml_and_data_button,"100%","4px","4px");
                    parent_to_attach_to.firstChild.insertAdjacentElement("afterend",this.download_xml_and_data_button);
                }
            }
            this.open_text_button=this.object_viewer.append_button(null,"Open text",this.open_text_button_clicked,"100%","14px","4px");
            parent_to_attach_to.firstChild.insertAdjacentElement("afterend",this.open_text_button);
            var d=div("t_margin_30",parent_to_attach_to);
            this.show_tei_header_button=this.object_viewer.append_button(null,"Show TEI header",this.show_tei_header_button_clicked,"100%","4px","4px");
            d.appendChild(this.show_tei_header_button);
        }
        else
        {
            if (parent_to_attach_to!=null)
            {
                var info_span=span("color_red",null,"Due to possible copyright restrictions the full text is only made visible within University of Zurich's IP range. We apologise for the inconvenience.");
                parent_to_attach_to.firstChild.insertAdjacentElement("afterend",info_span);
            }
        }
    }
        
    create_info(virtual=false)
    {
        
        
        if (virtual==false)
        {
            B.sandglass.close();
            this.div_info.innerHTML="";
            this.div_info.appendChild(this.object_viewer.display_object_info(this.path,this.xml_data,this.accessible));
            
            var list_title=document.createElement("h3");
            
            var path_steps=this.xml_data.evaluate("cc:navigation/cc:path_steps/cc:path_step",this.xml_data,this.ns_resolver);
            var ps=null;
            var path_step=[];
            this.path_steps=path_step;
            var path_steps_str="";
            while (ps=path_steps.iterateNext())
            {
                path_step.push(ps);
                if (path_steps_str=="")
                    path_steps_str+=ps.textContent;
                else
                    path_steps_str+=", "+ps.textContent;
            }
            
            
            
            this.div_info.appendChild(list_title);
            
            if (this.object_viewer.obj_type=="author")
            {
                this.show_all_of_author_button=this.object_viewer.append_button(null,"Show all works by this author in CC",this.show_all_of_author_clicked,"100%","4px","4px");
                this.div_info.appendChild(this.show_all_of_author_button);
            }
            if (this.object_viewer.obj_type=="text" || this.object_viewer.obj_type=="text_section")
            {
                this.create_text_buttons(this.div_info.firstChild);
            }
            if (this.object_viewer.obj_type=="work")
            {//pokud je k dílu patří jen jeden text, otevřeme info i o něm, abychom předešli matoucímu množství kroků v proklikání se k textu
                var n_texts=xp(this.xml_data,"count(/cc:navigation/cc:contents/cc:text)");
                if (Number(n_texts)==1)
                {
                    var text_idno=xp(this.xml_data,"/cc:navigation/cc:contents/cc:text/cc:idno/text()");
                    
                    //list_title.innerHTML=" There is one text of this work in "+path_steps_str;
                    this.navigate(this.path+"/"+text_idno,null,true)
                }
                else
                    list_title.innerHTML=" Texts:";
            }
            
            if (this.path!="/" && this.path!="home")
                this.div_info.scrollIntoView();
        }
        else if (this.virtual_created!=true)
        {//jenom informace o textu při otevření díla, které pod sebou má jeden text
            this.virtual_created=true;
            var info_subdiv=div("l_margin_30 bClr_b6",this.div_info);
            
            
            info_subdiv.appendChild(this.object_viewer.display_object_info(this.path_2,this.xml_data_2,this.accessible));
            this.div_info.appendChild(info_subdiv);
            this.create_text_buttons(info_subdiv.firstChild);
        }
        
    }
    
    lst_dropdown_opened=(e)=>
    {
        if (e.detail.first_time==true)
        {
            var s=e.detail.list_obj.selection.get("all",e.detail.item_index);
            var path=e.detail.list_obj.metadata["path"];
            var slash="";
            if (path.endsWith("/")==false)
                slash="/";
            var idno=e.detail.list_obj.metadata["path"]+slash+s[0]["cc:idno"];
            

            var new_lst=new list_control(e.detail.list_obj.name+"_"+idno,e.detail.target_td_div,false,false,false);
            new_lst.list_items_padded=true;
            new_lst.add_metadata("path",idno);
            
            this.navigate(idno,new_lst);
        }
    }
    lst_item_clicked=(e)=>
    {
        if (e.type=="keypress" && !(e.keyCode ==13 || e.keyCode==32)) return false;
        if (e.detail.list_obj.metadata["content_type"]!="text_section")
        {
            var slash;
            if (e.detail.list_obj.metadata["path"]=="/")//nepoužívá se this.path, protože pokud otvíráme z vysouvacího seznamu, potřebujeme path toho seznamu - jinak nám budou chybět nějaké mezikroky
                slash="";
            else
                slash="/";
            //if (e.detail.list_obj.
            var path=e.detail.list_obj.metadata["path"];
            if (path==null)
                path="";
            this.navigate(path+slash+e.detail.list_obj.selection.get(Array("cc:idno"))[0]["cc:idno"]);
        }
        else
            this.dispatch_load_text_request(e.detail.list_obj.selection.get(Array("cc:idno"))[0]["cc:idno"]);
    }
    open_text_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        e.stopPropagation();
        var text_to_open_idno=this.get_path_step();
        this.dispatch_load_text_request(text_to_open_idno);
    }

    download_xml_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        e.stopPropagation();
        var text_to_open_idno=this.get_path_step();
        
        window.open(url+"php_modules/download.php?type=file-xml&idno="+text_to_open_idno);

    }

    download_POS_xml_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        e.stopPropagation();
        var cc_idno=this.get_path_step();
        
        //ajax("url+"php_modules/download.php?type=file-pos-xml&idno="+text_to_open_idno");
        window.open(url+"php_modules/download.php?type=file-pos-xml&idno="+cc_idno);

    }
    download_xml_and_data_button=(e)=>
    {
        if (!(kb_click(e))) return false;
        e.stopPropagation();
        var text_to_open_idno=this.get_path_step();
        window.location=url+"php_modules/download.php?type=archive-xml-and-data&idno="+text_to_open_idno    
    }
    show_all_of_author_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.navigate("/"+this.last_step_idno);
    }
    show_tei_header_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        var me=this;
        this.show_tei_header_button.remove();
        var xhttp=new XMLHttpRequest();
        var teiheader=this.div_info.getElementsByClassName("teiHeader");
        if (teiheader.length>0) 
            return 0;
        xhttp.onreadystatechange=function()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                var xml=this.responseXML;
                var d=div("l_margin_30 border_h3 teiHeader",null);
                var process_element=function(el,parent)
                {
                    
                    if (el.nodeName!="#text" && el.nodeName!="#comment")
                    {
                        var ed;
                        if (el.nodeName=="a" || el.nodeName=="ref")
                        {
                            ed=create_element("a","link",parent);
                            if (el.getAttribute("href")!=null)
                                var ref=el.getAttribute("href");
                            else if (el.getAttribute("target")!=null)
                                var ref=el.getAttribute("target")
                            ed.target="_blank";
                            ed.href=ref;
                            ed.title=ref;
                        }
                        else if (el.nodeName=="p")
                        {
                            ed=create_element("p","",parent);
                        }
                        else if (el.nodeName!="b" && el.nodeName!="strong" && el.nodeName!="i" && el.nodeName!="em" && el.nodeName!="hi")
                        {
                            ed=div ("l_margin_10 width_max_c",parent);
                            ed.style.maxWidth="calc(100% - 15px)";
                            span("bold",ed,el.nodeName+": ");
                            var ref_attr="";
                            ref_attr=el.getAttribute("ref");
                            if (ref_attr=="")
                                ref_attr=el.getAttribute("target");
                            if (ref_attr!="" && ref_attr!=null)
                            {
                                ed=create_element("a","link",ed);
                                ed.href=ref_attr;
                                ed.target="_blank";
                                ed.title=ref_attr;
                            }
                        }
                        else
                            ed=parent;
                        for (var i=0;i<el.childNodes.length;i++)
                        {                           
                            process_element(el.childNodes[i],ed);
                        }
                    }
                    else if (el.nodeName=="#text")
                        span("",parent,el.textContent);
                    else if (el.nodeName=="#comment")
                        span("color_gray",parent,"/*"+el.textContent+"*/");
                    
                }
                var escape_xml=function(string)
                {
                    return string.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                        .replace(/&lt;/g, '<strong>&lt;')
                        .replace(/&gt/g, '&gt;</strong>')
                        .replace(/\n/g,"<br/>");
                }
                
                process_element(xml.childNodes[0],d);
                //d.innerHTML=escape_xml(xml.childNodes[0].innerHTML);
                create_element("h3","l_margin_30",me.div_info,"TEI Header");
                me.div_info.appendChild(d);
            }
        }
        if (this.path_2!="")
            var cc_idno=this.path_2.match(/\/([^/]*)$/);
        else
            var cc_idno=this.path.match(/\/?([^/]*)$/);
        cc_idno=cc_idno[1];
        xhttp.open("GET",url+"php_modules/fetch_tei_header.php?cc_idno="+cc_idno,true);
        xhttp.send(null);
    }
    dispatch_load_text_request=(path,path_to_focus="")=>
    {
        var ev_load_text_request=new CustomEvent('load_text_request',{
                    detail:{path:path,path_to_focus:path_to_focus}});
        document.dispatchEvent(ev_load_text_request);
    }
    dispatch_navigated_request=()=>
    {
        var ev_navigated=new CustomEvent('navigated',{
                    detail:{path:this.path,xml_data:this.xml_data,path_steps_obj:this.steps_obj}});
        dispatch_event(ev_navigated);
    }
    
    get_path_step(pos=-1)
    {
        if (this.path_2=="")//path_2 je cesta k textu, pokud jsme jen na úrovni díla, ale to má jen jeden text, který rovnou nahrajeme
            var steps=this.path.split("/");
        else
            var steps=this.path_2.split("/");
        
        if (steps[steps.length-1]=="")
            steps.pop();
        
        if (pos>=0)
            return steps[pos];
        else
            return steps[steps.length+pos];
    }
        
    
    
    list_schemata(object_type)
    {
         /*
        * schema:
        * row: Xpath datových položek, které mejí sloužit jako výchozí uzly pro zpracování jednotlivých řádků
        *      @dropdown: zda mají řádky nabízet možnost rozbalovacího seznamu
        *          může být true, false anebo xpath výraz v podobě:
        *          test:--testovaný XPath výraz -- ::(eq|=|gt|lt|get|let) hodnota pro porovnání). 
        *      @expand_sole_item: (v kombinaci s předchozím): zda se má po nahrání seznam automaticky rozbalit,
        *          pokud obsahuje jen jednu položku
        *      @title:html title ("létající" popisek)
        * column: Xpath, relativní vůči objektu row, určující, kde se mají hledat data pro sloupe (buňku)
        *      @highlight: způsob zvýraznění: uppercase, strong, italic, center, right; může jich být více, oddělených čárkou
        *      @label: viditelný popisek sloupce
        *      @width: šířka sloupce
        *      @hidden: zda je sloupec zobrazen, nebo skryt
        *      @on_empty: co se má zobrazit, pokud je příslušná datová položka prázdným řetězcem
        */
        if (object_type=="/home")
            return "<schema><row dropdown='true' title='Corpus'>{cc:navigation/cc:contents/cc:corpus}</row>\n\
            <column highlight='' label='Nr.' width='' on_empty='[...]'>{cc:nr}</column>\n\
            <column highlight='' label='Name' width='33%' on_empty='[...]' sum='Total:'>{cc:name}</column>\n\
            <column label='Authors' highlight='right' width='7%' format_nr='true' sum='true'>{cc:authors_count}</column>\n\
            <column label='First' highlight='right' width='7%' format_year='true'>{cc:date_range/cc:first_author_year}</column>\n\
            <column label='Last' highlight='right' width='7%' format_year='true'>{cc:date_range/cc:last_author_year}</column>\n\
            <column label='Works' highlight='right' width='7%' format_nr='true' sum='true'>{cc:works_count}</column>\n\
            <column label='Texts' highlight='right' width='7%' format_nr='true' sum='true'>{cc:texts_count}</column>\n\
            <column label='Words' highlight='right' width='10%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column label='Source' highlight='right' width='' cancel_click='true'><a href='{cc:source_web_page}' title='{cc:source_web_page}' target='_blank'>{cc:source}</a></column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <metadata name='content_type' xpath='false'>corpus</metadata>\n\
            </schema>"
        else if (object_type.match(/corpus$/))
            return "<schema><row dropdown='true' title='Author'>{cc:navigation/cc:contents/*}</row>\n\
            <column highlight='' label='Name' width='59%' on_empty='[...]'>{cc:name}</column>\n\
            <column label='Works' highlight='right' width='10%' format_nr='true' sum='true'>{cc:works_count}</column>\n\
            <column label='Texts' highlight='right' width='10%' format_nr='true' sum='true'>{cc:texts_count}</column>\n\
            <column label='Words' highlight='right' width='10%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column label='Year' highlight='right' width='10%' format_year='true'>{cc:year}</column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <metadata name='content_type' xpath='false'>author</metadata>\n\
            </schema>"
        else if (object_type.match(/corpus\/author$/))
            return "<schema><row dropdown='true' title='Work'>{cc:navigation/cc:contents/cc:work}</row>\n\
            <column highlight='' label='Work name' width='70%' on_empty='[...]'>{cc:name}<button data-action_id='open_text_of_work'>Open text directly</button></column>\n\
            <column label='Texts' highlight='right' width='14%' format_nr='true' sum='true'>{cc:texts_count}</column>\n\
            <column label='Words' highlight='right' width='15%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <metadata name='content_type' xpath='false'>work</metadata>\n\
            </schema>"
        else if (object_type.match(/author$/))
            return "<schema><row dropdown='true' title='Work'>{cc:navigation/cc:contents/cc:work}</row>\n\
            <column highlight='' label='Work name' width='60%' on_empty='[...]'>{cc:name}<button data-action_id='open_text_of_work'>Open text directly</button></column>\n\
            <column highlight='' label='Texts' width='5%' on_empty=''>{@text_count}</column>\n\
            <column highlight='' label='Words' width='10%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column highlight='' label='Corpora' width='25%' on_empty='[...]'>{cc:corpora/cc:corpus/cc:name}</column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <metadata name='content_type' xpath='false'>work</metadata>\n\
            </schema>"
        else if (object_type=="/home/author/work")
            return "<schema><row dropdown='true' expand_on_sole_item='true' title='Edition'>{cc:navigation/cc:contents/cc:text}</row>\n\
            <column highlight='' label='Text name' width='85%' on_empty='[...]'>{cc:name}<button data-action_id='open_text_of_work'>Open text directly</button></column>\n\
            <column label='Words' highlight='right' width='14%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <column hidden='true' label='type'>{@type}</column>\n\
            <metadata name='content_type' xpath='false'>text</metadata>\n\
            </schema>"    
        else if (object_type.match(/work$/))
            return "<schema><row dropdown='true' expand_on_sole_item='true' title='Edition'>{cc:navigation/cc:contents/cc:text}</row>\n\
            <column highlight='' label='Text name' width='65%' on_empty='[...]'>{cc:name}<button data-action_id='open_text_of_work'>Open text directly</button></column>\n\
            <column label='Corpus' highlight='right' width='24%'>{cc:corpus_name}</column>\n\
            <column label='Words' highlight='right' width='14%' format_nr='true' sum='true'>{cc:words_count}</column>\n\
            <column hidden='true'>{cc:idno}</column>\n\
            <column hidden='true' label='type'>{@type}</column>\n\
            <metadata name='content_type' xpath='false'>text</metadata>\n\
            </schema>"
        else if (object_type.match(/text$/) || object_type.match(/text_section$/))
            return "<schema><row title='Section of text' dropdown='test:count(cc:contents) ::gt 0' on_empty='open text'>{cc:navigation/cc:contents/cc:table_of_contents/cc:contents[@depth='1']}</row>\n\
            <column highlight='' label='..' width='100%' on_empty='[...]'>{cc:head}</column>\n\
            <column hidden='true' name='cc:idno'>{@pid}</column>\n\
            <column hidden='true' label='type'>{@type}</column>\n\
            <metadata name='content_type' xpath='false'>text_section</metadata>\n\
            </schema>"
    }
}
