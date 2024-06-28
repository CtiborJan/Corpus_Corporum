var mod_dictionaries=true;

class  cls_mod_dictionaries extends cls_mod
{
    
    constructor(parent_slot)
    {
        super(parent_slot);
        
        this.display_only_my_slot=true;
        this.taskbar_color="black";
        this.taskbar_bckg_color=taskbar_btn_color;  
        this.module_name="Dictionaries";
        this.module_dscription="Modul allowing access to all dictionaries availible in CC";
        this.label="";
        
        this.container=div("height_100p flex_column",this.module_container,"");
        this.textbox_container=div("flex_row flex_wrap align_items_center",this.container);
        //var d=div("width_max_c margin_auto",this.header);
        this.input_box=textbox("width_500 font_166p height_50 text_align_center width_m_100p margin_auto",this.textbox_container,"",true,this.input_box_on_key_press);
        this.input_box.placeholder="Type a searchterm";
        var d2=div("width_100p relative",this.container);
        var d=div("width_max_c margin_auto",d2);
        this.btn_search_1=button("",d," &nbsp; Search for lemma (enter) &nbsp; ",true,this.dictionary_lookup);
        this.btn_search_2=button("",d," &nbsp; Search for inflected word (CTRL+enter) &nbsp; ",true,this.dictionary_lookup_2);
        //this.btn_search_3=button("",d," &nbsp; Full-text search &nbsp; ");
        //this.btn_search_3=button("",d," &nbsp; ? &nbsp; ");
        
        
        
        this.my_index=this.parent_slot.add_module(this)-1;
        //this.parent_slot.set_label("Browsing the database");
        var history_container1=div("relative height_min_25",this.container);
        this.history_container=div("absolute height_min_25 flex width_min_100p",history_container1);
        this.history_container.style.right="0px";
        this.history_container.style.zIndex=2;
        this.history_container.style.paddingLeft="30px";
        this.history_container.style.boxSizing="border-box";
        var history_icon=div("history_icon height_25 width_25 absolute bc_white",history_container1);
        history_icon.style.zIndex=3;
        this.dict_list_container=div("border_h2 relative",this.container);
        this.lat_dictionaries_list=div("flex_row flex_wrap align_items_center",this.dict_list_container);
        this.gr_dictionaries_list=div("flex_row flex_wrap align_items_center",this.dict_list_container);
        span("",div("flex_row flex_wrap align_items_center",this.dict_list_container),"<br/>(Drag boxes to change order of the dictionaries.)")
        
        this.btn_show_dict_list=button("absolute right top app_dict_show_list_lbl_hide",d2," ",true,this.show_hide_dictionaries);
        this.show_hide_dictionaries();
        this.group_results_by="dictionary";
        
        ajax(url+"php_modules/dictionaries.php?fn=list",this.get_dictionaries);
        
        this.results_part=div("border_h2_top flex_row flex_grow_1 overflow_auto",this.container);
        this.results_list=div("flex_grow_2 width_min_200 width_m_33p overflow_auto",this.results_part);
        this.entry_display=div("flex_grow_3 width_min_200 relative",this.results_part);
        
        this.display_ma=true;
        this.obj_vw=new cls_smod_object_viewer();


        this.history=
        {
            parent:this,
            searches:Array(),
            panel:this.history_container,
            add_search:function(search)
            {
                var old=null;
                for (var i=0;i<this.searches.length;i++)
                {
                    if (this.searches[i].q==search.q && this.searches[i].m==search.m)
                    {
                        this.searches[i].span.remove();
                        old=this.searches.splice(i,1);
                        break;
                    }
                }
                if (old==null)
                {
                    this.searches.push(search);
                    var italics="";
                    if (search.m=="lemmatised")
                        italics=" italic"
                    search.span=span("h_padding_5 pointer display_on_hover relative"+italics,this.panel,search.q);
                    search.span.dataset["mode"]=search.m;
                    search.span.dataset["query"]=search.q;
                    search.span.onclick=this.onClick.bind(this);
                    search.history_obj=this;
                }
                else
                {
                    this.searches.push(old[0]);
                    this.panel.appendChild(old[0].span);
                }
                
                
            },
            onClick:function(e)
            {
                /*if (e.stopPropagation()!=undefined)
                    e.stopPropagation();*/

                if (e.target.dataset["mode"]=="lemmatised")
                    this.parent.dictionary_lookup_2(e.target.dataset["query"],e.entry);
                else
                    this.parent.dictionary_lookup(e.target.dataset["query"],e.entry);
            }
        }
    }
    get_dictionaries=(e)=>
    {
        var get_lang_info=function(element)
        {
            var lang1=xpei(e.responseXML,"cc:language1",element);
            var arr_languages1=Array();
            var lang;
            while (lang=lang1.iterateNext())
                arr_languages1.push(lang.textContent);
            
            var lang2=xpei(e.responseXML,"cc:language2",element);
            var arr_languages2=Array();
            while (lang=lang2.iterateNext())
                arr_languages2.push(lang.textContent);
            
            return arr_languages1.join(", ")+" -> "+arr_languages2.join(", ");
        }
        var dicts=[];
        dicts[0]=xpei(e.responseXML,"/cc:dictionaries/cc:dictionary[cc:language1/@xml:lang='lat']");
        dicts[1]=xpei(e.responseXML,"/cc:dictionaries/cc:dictionary[cc:language1/@xml:lang='grc']");
        var dict;
        span("bold",this.lat_dictionaries_list,"Latin: ");
        span("bold",this.gr_dictionaries_list,"Greek: ");
        
        this.chb_dicts_to_use=Array();

        this.dragged=null;

        for (var i=0;i<2;i++)
        {
            if (i==0)
                var container=this.lat_dictionaries_list;
            else if (i==1)
                var container=this.gr_dictionaries_list;
           
            while (dict=dicts[i].iterateNext())
            {
                var me=this;
                var d=div("r_margin_10",container);
                var d_name=xp(e.responseXML,"cc:name",dict);
                var b=button("",d,d_name+" <span class='font_75p'>("+get_lang_info(dict)+")</span>",true,this.load_dictionary_info);
                if (i==0) 
                    b.dataset["lang"]="lat";
                else
                    b.dataset["lang"]="gr";
                //changing dictionaries order by dragging: >>>>>>>>>
                b.ondragstart=function(e){me.dragged=e.target;}; 
                b.ondragend=function(e){me.dragged=null;};
                b.ondrop=function(e)
                    {
                        e.preventDefault();
                        if (me.dragged!=null)
                        {
                            if (me.dragged.dataset["lang"]==e.currentTarget.dataset["lang"] && !(me.dragged===e.currentTarget))
                            {
                                var draggedChb=me.dragged.parentElement.getElementsByTagName("input")[0];
                                var targetChb=e.currentTarget.parentElement.getElementsByTagName("input")[0];
                                var draggedParent=me.dragged.parentNode;
                                var targetParent=e.currentTarget.parentNode;
                                me.dragged.parentNode.removeChild(me.dragged);
                                e.currentTarget.parentNode.removeChild(e.currentTarget);
                                draggedParent.insertBefore(e.currentTarget,draggedParent.firstElementChild);
                                targetParent.insertBefore(me.dragged,targetParent.firstElementChild);
                                
                                var draggedChb_checked=draggedChb.checked;
                                var draggedChb_dictname=draggedChb.dataset["name"];
                                draggedChb.checked=targetChb.checked;
                                draggedChb.dataset["name"]=targetChb.dataset["name"];
                                targetChb.checked=draggedChb_checked;
                                targetChb.dataset["name"]=draggedChb_dictname;
                            }
                        }
                    };
                b.ondragover=function(e){e.preventDefault();}//otherwise ondrop does not work
                b.draggable=true;
                //draging ends...
                var tmp=checkbox("inline-block",d,"<tr1><tr2 title='Select for search in'>L</tr2></tr1>",true);
                tmp.title="Select for search in";
                tmp.dataset["name"]=d_name;
                tmp.name="dicts_to_use";
                this.chb_dicts_to_use.push(tmp);
                
                
                b.dataset["dictionary"]=d_name;
            }
        }
        
    }
    show_hide_dictionaries=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.dict_list_container.classList.toggle("display_none");
        this.btn_show_dict_list.classList.toggle("app_dict_show_list_lbl_show");
        this.btn_show_dict_list.classList.toggle("app_dict_show_list_lbl_hide");
    }
    load_dictionary_about=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (this.opened_dictionary!="")
        {
            ajax(url+"php_modules/dictionaries.php?fn=get_about&dictionary="+this.opened_dictionary,this.on_about_received);
        }
    }
    on_about_received=(rv)=>
    {
        this.entry_display.innerHTML="";
        var div_about=div("height_100p overflow_auto",this.entry_display,"");
        var d1=div("padding_10 width_m_800",div_about,"");
        var teiH=div("padding_10 width_m_800",div_about,"");
        var name=xp(rv.responseXML,"/cc:about_dictionary/cc:fullname");
        if (name==undefined || name=="") 
            name=xp(rv.responseXML,"/cc:about_dictionary/cc:name")
        create_element("h2","",d1,name);
        
        create_element("h3","",teiH,"TEI header:");
        this.obj_vw.display_xml_struct(xpe(rv.responseXML,"/cc:about_dictionary/tei:teiHeader"),teiH);
        
        var front=xpe(rv.responseXML,"/cc:about_dictionary/tei:front");
        if (front!=undefined)
        {
            var teiFront=div("padding_10 width_m_800",div_about,"");
            create_element("h3","",teiFront,"TEI front section");
            div("",teiFront,front.innerHTML);
        }
        var back=xpe(rv.responseXML,"/cc:about_dictionary/tei:back");
        if (back!=undefined)
        {
            var teiBack=div("padding_10 width_m_800",div_about,"");
            create_element("h3","",teiBack,"TEI back section");
            div("",teiBack,back.innerHTML);
        }        
    }
    load_dictionary_info=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (typeof(e)!="string")
            e=e.currentTarget.dataset["dictionary"];
        ajax(url+"php_modules/dictionaries.php?fn=get_info&dictionary="+e,this.on_info_received);
    }
    load_dictionary_entries=(e)=>
    {
        B.sandglass.open(this.results_list);
        if (typeof(e)!="string")
        {
            var letters_list=e.currentTarget.parentElement.childNodes;
            for (var i=0;i<letters_list.length;i++)
                letters_list[i].classList.remove("bold");
            e.currentTarget.classList.add("bold");
            
            e=e.currentTarget.innerHTML
        }
        ajax(url+"php_modules/dictionaries.php?fn=get_dictionary_entries_by_letter&letter="+e+"&dictionary="+this.opened_dictionary,this.on_entries_received);
    }
    load_dictionary_entries2=(e)=>
    {
        B.sandglass.open(this.results_list);
        ajax(url+"php_modules/dictionaries.php?fn=get_info&dictionary="+this.opened_dictionary,this.on_info_received);
        ajax(url+"php_modules/dictionaries.php?fn=get_dictionary_entries_by_letter&letter="+e.currentTarget.innerHTML+"&dictionary="+this.opened_dictionary,this.on_entries_received);
    }
    get_lang=(q)=>
    {
        if (q.match(/^g:/)!=null)
            return "greek";
        else
            return "latin";
    }
    get_norm=(q)=>
    {
        return q.replace(/^g:/,"");   
    }
    load_entry=(e)=>
    {
        if (e.target.name=="div_entries") return 0;
        var entry;
        entry=e.target;
        if (entry.tagName!="E")
            entry=entry.parentNode;
        var entry_id=entry.dataset["entry_id"]; 
        entry=entry.firstElementChild;
        entry=entry.textContent;
        var lang=this.get_lang(entry);
        entry=this.get_norm(entry);
                
        
        ajax(url+"php_modules/dictionaries.php?fn=get_dictionary_entry&dictionary="+this.opened_dictionary+"&entry="+entry+"&entry_id="+entry_id+"&language="+lang,this.on_one_entry_received);
    }
    on_one_entry_received=(rv)=>
    {
        var entry=xpei(rv.responseXML,"/cc:dictionary_entry/*");
        this.entry_display.innerHTML="";
        var dictionary=xp(rv.responseXML,"/cc:dictionary_entry/@dictionary");
        var entry_text=xp(rv.responseXML,"/cc:dictionary_entry/@entry");
        var hom=xp(rv.responseXML,"/cc:dictionary_entry/@hom");
        this.create_info_bar(dictionary,hom+" " +entry_text);
        var entry_container=div("width_m_800 padding_10 margin_auto font_120p",this.create_div_entry_container(),"");
        var e;
        while (e=entry.iterateNext())
        {
            entry_container.innerHTML+="<div style='margin-bottom:20px'>"+e.outerHTML.replace(/<(\/?)head([ >])/g,"<$1xhead$2")+"</div>";
        }
        B.sandglass.close();
    }
    input_box_on_key_press=(e)=>
    {
        if (e.keyCode==13 || e.keyCode==10)
        {
            if (e.ctrlKey==true)
                this.dictionary_lookup_2(null);
            else if (e.ctrlKey==false)
                this.dictionary_lookup(null);
        }
    }
    get_dictionaries_to_use=(e)=>
    {
        /*
        var rv="";
        for (var i=0;i<this.chb_dicts_to_use.length;i++)
        {
            if (this.chb_dicts_to_use[i].checked==true)
                rv+=this.chb_dicts_to_use[i].dataset["name"]+",";
        }
        return rv;*/
        var rv="";
        var chboxes=document.getElementsByName("dicts_to_use");
        for (var i=0;i<chboxes.length;i++)
        {
            if (chboxes[i].checked==true)
                rv+=chboxes[i].dataset["name"]+",";
        }
        return rv;
    }
    dictionary_lookup_2=(e,open_entry)=>
    {
        if (!(kb_click(e))) return false;
        B.sandglass.open(this.results_list);
        if (typeof(e)=="string")
            var query=e;
        else
            var query=this.input_box.value;  
        var lang=this.get_lang(query);
        query=this.get_norm(query);
        this.open_entry=open_entry;
        ajax(url+"php_modules/dictionary_lookup.php?module=dictionary_viewer&lang="+lang+"&query="+query+"&dictionaries="+this.get_dictionaries_to_use(),this.on_lemmatised_search_results_received);
    }
    dictionary_lookup=(e,open_entry)=>
    {
        if (!(kb_click(e))) return false;
        B.sandglass.open(this.results_list);
        if (typeof(e)=="string")
            var query=e;
        else
            var query=this.input_box.value;  
        var lang=this.get_lang(query);
        query=this.get_norm(query);
        this.open_entry=open_entry;
        ajax(url+"php_modules/dictionary_lookup.php?module=dictionary_viewer&lang="+lang+"&query="+query+"&lemma="+query+"&dictionaries="+this.get_dictionaries_to_use(),this.on_entry_search_results_received);
    }
    on_info_received=(e)=>
    {
        this.results_list.innerHTML="";
        var d=div("height_100p width_100p flex_column",this.results_list);
        var dict_name=xp(e.responseXML,"/cc:dictionary/cc:name");
        var dict_lang1=xp(e.responseXML,"/cc:dictionary/cc:language1");
        var div_info=div("v_padding_5 height_max_c border_h2",d);
        var div_name=div("",div_info);
        span("font_133p bold h_margin_10",div_name,dict_name);
        button("",div_name," About this dictionary ",true,this.load_dictionary_about);
        var div_letters=div("flex_wrap",div_info);
        var letters=xpei(e.responseXML,"/cc:dictionary/cc:letters/cc:letter");
        var letter;
        while (letter=letters.iterateNext())
        {
            var l=div("font_120p strong pointer h_padding_10 color_b_h2",div_letters,letter.textContent);
            l.dataset["dictionary"]=dict_name;
            l.addEventListener("click",this.load_dictionary_entries);
        }
        this.div_entries=div("border_h2 h_padding_10 flex_grow_10 overflow_auto",d);
        this.opened_dictionary=dict_name;
        this.load_dictionary_about(null);
    }
    on_entries_received=(rv)=>
    {
        var entries=xpe(rv.responseXML,"/cc:dictionary/entries");
        this.div_entries.innerHTML="";
        div("bold",this.div_entries,xpe(rv.responseXML,"count(/cc:dictionary/entries/*)")+ " entries");
        this.div_entries.innerHTML+=entries.innerHTML;
        this.div_entries.name="div_entries";
        this.div_entries.addEventListener("click",this.load_entry);
        this.div_entries.scrollTop=0;
        B.sandglass.close();
    }
    on_entry_search_results_received=(rv)=>
    {
        this.on_results_received(rv,"entry");
    }
    on_lemmatised_search_results_received=(rv)=>
    {
        this.on_results_received(rv,"lemmatised");
    }
    on_results_received=(rv,mode="")=>
    {
        var me=this;
        me.results_list.innerHTML="";
        var xml=rv.responseXML;
        
        var dicts_used=xml.evaluate("/cc:dictionary_lookup_result/cc:dictionaries_used/cc:dictionary",xml,ns);
        var dict_used=null;
        var n=0;
        var info_div=div("padding_5",me.results_list,"");
        var query=xp(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:query");
        if (mode=="lemmatised")
            div("",info_div,"Dictionary lookup for word form <strong>'"+query+"'</strong>");
        else if (mode=="entry")
            div("",info_div,"Dictionary lookup for entry <strong>'"+query+"'</strong>");

        
        var c_lemmata=xp(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/@count");
        var f_lemmata="lemma";
        if (Number(c_lemmata)>1) f_lemmata="lemmata";
        var c_entries=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionary_entry)");
        var f_entries="entry";
        if (Number(c_entries)>1) f_entries="entries";
        var c_dictionaries=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionaries_used/cc:dictionary)")
        var f_dictionaries="dictionary";
        if (Number(c_dictionaries)>1) f_dictionaries="dictionaries";
        if (c_lemmata!=0)
            div("",info_div,"Found "+c_lemmata+" "+f_lemmata+" and "+c_entries+" "+f_entries+" in " +c_dictionaries +" "+f_dictionaries);
        else
            div("",info_div,"Found "+c_entries+" "+f_entries+" in " +c_dictionaries +" "+f_dictionaries);

        

        //adding new item in the history of searches
        var new_search=
        {//item for search history
            q:query,
            m:mode,
            span:null,
            entries_opened:Array(),
            entries_opened_div:null,
            history_obj:null,
            add_opened_entry:function(e)
            {
                for (var i=0;i<this.entries_opened.length;i++)
                    if (this.entries_opened[i].id==e.id && this.entries_opened[i].d==e.d)
                        return 0;
                this.entries_opened.push(e);
                if (this.entries_opened_div==null)
                    this.entries_opened_div=div("displayed_on_hover absolute opaque border_h2 width_max_c padding_3",this.span)
    
                var h="";
                if (e.h!="")
                    h=e.h+". ";
                e.div=div("",this.entries_opened_div,"<strong>"+h+e.l + "</strong> ("+e.d+")");
                e.div.onclick=this.opened_entry_clicked.bind(this);
                e.div.dataset["dictionary"]=e.d;
                e.div.dataset["entry_id"]=e.id;
            },
            opened_entry_clicked:function(e)
            {
                e.stopPropagation();
                var open_entry={dictionary:e.currentTarget.dataset["dictionary"],entry_id:e.currentTarget.dataset["entry_id"]};
                this.history_obj.onClick({target:this.span,entry:open_entry});
            }
        };

        if (Number(c_entries)>0)
            this.history.add_search(new_search);
        
        //morphological analysis
        var m_an=new cls_morphological_analysis();
        var perseus_c=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes)");
        var jussen_c=0;
        var total_ma_elements=xp_a(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes");
        total_ma_elements=m_an.count_items(total_ma_elements,"Perseus");
        var exists_ma=perseus_c+jussen_c;
        if (exists_ma>0)
        {//pokud vůbec nějakou MA máme...
            me.div_ma=div("border_h3 relative padding_3",me.results_list,"<strong>Morphological analysis:</strong>");
            me.btn_show_hide_ma=button("font_75p right absolute app_dict_show_MA_lbl_hide",me.div_ma,"",true,me.show_hide_ma);
            if (perseus_c>0)//only, if there is MA result from perseus table
            {                    
                me.div_perseus=div("padding_5",me.div_ma,"<strong>Perseus word form analysis:</strong><br/>");
                var morph_lemmata=xpei(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes");
                var morph_lemma;
                var m_codes=new Array();
                var c=0;
                //me.div_ma_not_shown=div("padding_5",me.div_ma,"",false);
                while (morph_lemma=morph_lemmata.iterateNext())
                {
                  /*  if (c<2)
                        var ac_d=me.div_perseus;
                    else
                        var ac_d=me.div_ma_not_shown;*/
                    span("font_75p",me.div_perseus,m_an.transform("Perseus",morph_lemma.attributes.getNamedItem("lemma").textContent,morph_lemma.attributes.getNamedItem("short_def").textContent,morph_lemma.textContent));
                    c++;
                }
                /*if (c>=2)
                    button("",me.div_perseus," Show more ");*/
            }
            if (me.display_ma==false)
                me.show_hide_ma(false);
        }
        if (me.group_results_by=="dictionary")
        {
            var div_entries=div("border_h3 padding_3",me.results_list,"<strong>Dictionary entries found:</strong><br/>");



            while (dict_used=dicts_used.iterateNext())
            {
                
                var dd=div("padding_3 margin_3",div_entries);
                span("font_133p bold",dd,dict_used.innerHTML);
                var entries=xml.evaluate("/cc:dictionary_lookup_result/cc:dictionary_entry[@dictionary_name='"+dict_used.innerHTML+"']",xml,ns);
                var entry=null;
                while(entry=entries.iterateNext())
                {
                    n++;
                    var hom_nr=entry.getAttribute("hom_nr");
                    if (hom_nr!=="")
                        hom_nr=hom_nr+". ";
                    var lemma=entry.getAttribute("entry");


                    var d=div ("border_h3 app_Dict_truncated_dictionary_entry font_120p",dd,hom_nr+entry.innerHTML.replace(/<(\/?)head([ >])/g,"<$1xhead$2"));
                    d.addEventListener("click",this.open_full_entry)
                    d.dataset["dictionary"]=dict_used.innerHTML;
                    var id;
                    if (entry.firstElementChild.attributes["id"]!=undefined)
                        id=entry.firstElementChild.attributes["id"].textContent;
                    else
                        id=entry.firstElementChild.firstElementChild.attributes["id"].textContent;

                    if (this.open_entry!=undefined)
                    {
                        if (this.open_entry.dictionary==d.dataset["dictionary"] 
                            && this.open_entry.entry_id==id)
                            {
                                this.open_full_entry({currentTarget:d})
                            }
                    }
                }
                
                
            }
            if (n==0)//ve výsledcích nic není...
                span ("inline-block",me.results_list,"&nbsp;No match found.");
        }
        B.sandglass.close();
    }
    show_hide_ma=(e)=>
    {
        
        if (e!=false )
        {
            if (!(kb_click(e))) return false;
            this.display_ma=!this.display_ma;
        }
        
        this.div_perseus.classList.toggle("display_none");
        this.btn_show_hide_ma.classList.toggle("app_dict_show_MA_lbl_show");
        this.btn_show_hide_ma.classList.toggle("app_dict_show_MA_lbl_hide");
    }
    open_full_entry=(e)=>
    {
        
        this.entry_display.innerHTML="";
        this.opened_dictionary=e.currentTarget.dataset["dictionary"];
        
        if (typeof(e.currentTarget.firstElementChild.attributes["cc:nlemma"])!="undefined")
        {
            var lemma_element=e.currentTarget.firstElementChild;
        }
        else//u LB:superentry
        {
            var lemma_element=e.currentTarget.firstElementChild.firstElementChild;       
        }

        var lemma=lemma_element.attributes["cc:nlemma"].textContent;
        this.create_info_bar(e.currentTarget.dataset["dictionary"],lemma);
        var id=lemma_element.id;
        var hom=lemma_element.attributes["cc:homonym"];
        if (hom!=null)
            hom=hom.textContent;
        else
            hom="";

        var entry_container=div("width_m_800 padding_10 margin_auto font_120p",this.create_div_entry_container(),e.currentTarget.innerHTML);
        if (this.history.searches.length>0)
        {
            var ls=this.history.searches[this.history.searches.length-1];
            ls.add_opened_entry({d:this.opened_dictionary,l:lemma,h:hom,id:id});

        }
        this.input_box.focus();
    }
    create_div_entry_container=()=>
    {
        var d=div("bottom top_45 absolute width_100p overflow_auto",this.entry_display);
        return d;
    }
    create_info_bar=(dict,entry,letter="")=>
    {
        var d=div("slot_module_default_title mod_browser_navigation_panel", this.entry_display);
        var s=span("navigation_panel_step",d,dict);
        s.addEventListener("click",this.load_dictionary_info);
        s.dataset["dictionary"]=this.opened_dictionary;
        span("navigation_panel_step",d,">");
        if (letter=="")
            letter=entry.match(/[^0-9 ]/);
        letter=letter[0].substr(0,1).toUpperCase();
        s=span("navigation_panel_step",d,letter);
        s.addEventListener("click",this.load_dictionary_entries2);
        span("navigation_panel_step",d,">");
        span("navigation_panel_step bold",d,entry);
    }
    
}
