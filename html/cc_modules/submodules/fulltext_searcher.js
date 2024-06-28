var smod_fulltext_searcher_loaded=true;

class cls_smod_fulltext_searcher
{
    constructor(container,external_textbox=null,results_div=null,opts_div=null)
    {
        
        this.container=container;
        if (external_textbox==null && results_div==null)
        {
            this.options_box_visible=true;
            this.create_controls();
            this.submit_btn_label="Full text search";
        }
        else
        {
            this.input_textbox=external_textbox;
            this.results_div=results_div;
            this.results_info=div("",this.results_div);
            this.create_options_box(opts_div);
            this.submit_btn_label="Full text search (ENTER)";
            
        }
        this.input_textbox.addEventListener("keypress",this.on_keypress);
        document.addEventListener("navigated",this.browser_path_changed);
        document.addEventListener("perform_fulltext_search_request",this.fulltext_search_requested);
        this.onKeyPress_modification_key="";//hodnoty -nic-, ctrl, shift, alt, meta - dotaz se odešle po stisku enter v textovém poli, jen je-li zároveň stisknuta zadaná klávesa
        
        
        this.default_limit="1000";
        this.path_to_search_at="";
        this.offer_extendet_filters_=false;
        this.offer_extendet_filters(false);
        
    }

    obj_query_sent=
    {
        query_url:"",
        total_results:0
    }

    create_controls=()=>
    {
        this.wrapper=div("margin_10",this.container);
        this.title=div("",this.wrapper,"Full text search:",true);
        //this.input_textbox_container=div("",this.wrapper,"",display_textbox);
        this.input_textbox=textbox("textbox",this.wrapper,"",true,this.on_keypress,"Type phrase to find");
        //this.input_textbox_container.appendChild(this.input_textbox);   
        this.results_info=div("",this.wrapper);
        this.results_div=div("",this.wrapper);
        this.create_options_box(null);
    }
    offer_extendet_filters=(value=null)=>
    {//zobrazí/skryje možnost nastavit filtry pro corpusy, autory atd.
        if (value==null)
            return this.offer_extendet_filters_
        else
        {
            this.offer_extendet_filters_=value;
            if (value==true)
                this.ext_filters_div.style.display="block";
            else
            {
                this.remove_all_filters();
                this.ext_filters_div.style.display="none";
            }
        }
    }
    show_hide_options_box=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (this.options_box_visible==true)
        {
            this.options_box.style.display="none";
            this.options_box_visible=false;
            e.currentTarget.innerHTML=">>";
            e.currentTarget.title="Show options box";
        }
        else
        {
            this.options_box.style.display="block";
            this.options_box_visible=true;
            e.currentTarget.innerHTML="<<";
            e.currentTarget.title="Hide options box";
        }
    }
    create_options_box=(container=null)=>
    {/*Objekt si nemusí sám vytvářet základní ovládací prvky (tj. vstupní pole, tlačítko a div pro výsledky), nicméně předvolby si stále musí moci vytvořit sám.
       Proto je-li container null, použije se defaultní obalovač (this.wrapper), jinak se vytvoří na zadaném elementu.
        */
        if (container==null)
        {
            var title_div=div("",this.wrapper);
            title_div.innerHTML="<b>Options:</b>";
            this.filter_box_btn=button("small relative left_10",title_div,"<<",true,this.show_hide_options_box);
            this.options_box=div("border_h3",container);
            container=this.wrapper;
        }
        else
            this.options_box=container;
        
        var me=this;
        var create_collection_filter_box=function(cdiv,label)
        {
            var selected_items_div=div("selected_items_div",cdiv);
            var lbl=span("lbl inline",selected_items_div);
            lbl.innerHTML=label+" (0): ";
            lbl.dataset["label"]=label;
            var btn=button("h_padding_10",selected_items_div,"+",true,me.show_filter_textbox_btn_clicked);
            var txt=textbox("small textbox inline-block filter_textbox",cdiv,"",false);
            txt.addEventListener("focus",me.move_results_box);
            txt.addEventListener("keydown",me.filter_txtbox_keypressed);
            return txt;
        }
        div("",this.options_box,"<strong>Full-text search options:</strong>");
        this.chb_lemmatised=checkbox("",this.options_box,"Lemmatised search",false);
        this.chb_variants_orth=checkbox("",this.options_box,"Orthographical variants (i/j,u/v)",true);
        this.chb_variants_med=checkbox("",this.options_box,"Medieval variants",false);
        this.chb_verses_only=checkbox("",this.options_box,"Verse only",false);
        
        var rtbdiv=div("",this.options_box);
        this.rbt_all=radiobutton("",rtbdiv,"Search the whole database",true);
        this.rbt_all.name="rtb_search_field";
        this.rbt_actual=radiobutton("",rtbdiv,"Search current level only",false);
        this.rbt_actual.name="rtb_search_field";
        var sortbydiv=div("",this.options_box);
        this.rbt_sort_by_name=radiobutton("",sortbydiv,"Sort by author name",true);
        this.rbt_sort_by_name.name="rtb_sort_by";
        this.rbt_sort_by_name.addEventListener("change",this.submit_button_clicked);
        this.rbt_sort_by_year=radiobutton("",sortbydiv,"Sort by year",false);
        this.rbt_sort_by_year.name="rtb_sort_by";
        this.rbt_sort_by_year.addEventListener("change",this.submit_button_clicked);

        this.years_filter=div("",this.options_box);
        span("",this.years_filter,"Years from: ");
        var year1=textbox("width_75 small",this.years_filter);
        span("",this.years_filter," to: ");
        var year2=textbox("width_75 small",this.years_filter);
        this.years={year1:year1,year2:year2};
        this.ext_filters_div=div("",this.options_box);
        this.authors_filter=div("",this.ext_filters_div);
        var atxt=create_collection_filter_box(this.authors_filter,"Authors");
        
        this.works_filter=div("",this.ext_filters_div);
        var wtxt=create_collection_filter_box(this.works_filter,"Works");
        
        this.texts_filter=div("",this.ext_filters_div);
        var ttxt=create_collection_filter_box(this.texts_filter,"Texts");
        
        this.corpora_filter=div("",this.ext_filters_div);
        var ctxt=create_collection_filter_box(this.corpora_filter,"Corpora");
        
        
        this.filter_search_results=div("absolute border_h3 bc_h3",this.options_box);
        this.filter_search_results.addEventListener("keydown",this.filter_txtbox_keypressed);
        this.filter_search_results.tabIndex="0";//aby fungovalo onkeydown na divu
        
        this.dbsearcher=new cls_smod_simple_db_searcher(null,false,atxt,this.filter_search_results,"cc_authors");
        this.dbsearcher.add_external_input_textbox(wtxt,"cc_works");
        this.dbsearcher.add_external_input_textbox(ttxt,"cc_texts");
        this.dbsearcher.add_external_input_textbox(ctxt,"cc_corpora");
        
        this.dbsearcher.listen_to_search_result_selected(this.filter_search_result_selected);
        return this.options_box;
    }
    move_results_box=(e)=>
    {
        this.filter_search_results.style.top=e.target.offsetTop+e.target.offsetHeight+3;
        clean_element(this.filter_search_results);
    }
    
    browser_path_changed=(e)=>
    {
        this.remove_all_filters();
        if (e.detail.path_steps_obj!=null)
        {
            for (var i=0;i<e.detail.path_steps_obj.length;i++)
            {
                var cc_idno=e.detail.path_steps_obj[i].cc_idno;
                var type=e.detail.path_steps_obj[i].type;
                var title=e.detail.path_steps_obj[i].title;
                if (type=="corpus")
                    this.add_filter(this.corpora_filter,title,cc_idno);
                else if (type=="author")
                    this.add_filter(this.authors_filter,title,cc_idno);
                else if (type=="work")
                    this.add_filter(this.works_filter,title,cc_idno);
                else if (type=="text")
                    this.add_filter(this.texts_filter,title,cc_idno);
            }
        }
    }
    
    
    filter_txtbox_keypressed=(e)=>
    {
        if (e.keyCode==27)
        {
            clean_element(this.filter_search_results);
        }
    }
    show_filter_textbox_btn_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        var tboxes=this.options_box.getElementsByClassName("filter_textbox");
        for (var i=0;i<tboxes.length;i++)
            tboxes[i].style.display="none";
        var filterbox=e.currentTarget.parentNode.parentNode;
        var tbox=filterbox.getElementsByClassName("textbox")[0];
        
        tbox.style.display="inline-block";
        
    }
    
    remove_all_filters=()=>
    {
        this.remove_filters(this.authors_filter);
        this.remove_filters(this.works_filter);
        this.remove_filters(this.texts_filter);
        this.remove_filters(this.corpora_filter);
    }
    remove_filters=(collection)=>
    {
        var items=collection.getElementsByClassName("selected_item");//zjistíme si, které všechny položky už jsou vybrány
        for (var i=0;i<items.length;i++)//ověříme si, zda právě přidávaná už mezi vybranými není
        {
            items[i].removeEventListener("click",this.filter_selected_item_clicked);
            items[i].remove();
        }
    }
    add_filter=(collection,item_title,item_idno)=>
    {
        
        var items=collection.getElementsByClassName("selected_item");//zjistíme si, které všechny položky už jsou vybrány
        var items_container=collection.getElementsByClassName("selected_items_div")[0];
        var counter=items.length;
        var already_added=false;
        for (var i=0;i<counter;i++)//ověříme si, zda právě přidávaná už mezi vybranými není
            if (items[i].dataset["idno"]==item_idno)
            {
                already_added=true;
                break;
            }
        if (already_added==false)
        {
            var selected="";
            selected=info_value("selected_item h_padding_10 pointer border_h3 margin_3",items_container);
            selected.innerHTML=item_title;
            selected.title="Click to remove from selection";
            selected.dataset["idno"]=item_idno;
            selected.addEventListener("click",this.filter_selected_item_clicked);    
            //a aktualizujeme popisek výběru
            var lbl=collection.getElementsByClassName("lbl")[0];
            lbl.innerHTML=lbl.dataset["label"]+" ("+counter+"):";
        }
    }
  
    
    filter_search_result_selected=(e)=>
    {//obdrželi jsme od přidruženého objektu cls_smod_simple_db_searcher výsledek vyhledávání
        var selected="";
        var collection=null;
        if (e.detail.type=="author")//nejprve si zjistíme, jaký je obalující div pro všechny prvky konkrétní kolekce, do níž přidáváme (autoři, díla, korpusy)
            collection=this.authors_filter;
        else if (e.detail.type=="work")
            collection=this.works_filter;
        else if (e.detail.type=="text")
            collection=this.texts_filter;
        else if (e.detail.type=="corpus")
            collection=this.corpora_filter;   
        
        var items=collection.getElementsByClassName("selected_item");//zjistíme si, které všechny položky už jsou vybrány
        var items_container=collection.getElementsByClassName("selected_items_div")[0];
        var counter=items.length;
        var already_added=false;
        for (var i=0;i<counter;i++)//ověříme si, zda právě přidávaná už mezi vybranými není
            if (items[i].dataset["idno"]==e.detail.idno)
            {
                already_added=true;
                break;
            }
        if (already_added==false)
        {//a pokud není, přidáme ji
            counter++;
            selected=info_value("selected_item h_padding_10 pointer border_h3 margin_3",items_container);
            selected.innerHTML=e.detail.name;
            selected.title="Click to remove from selection";
            selected.dataset["idno"]=e.detail.idno;
            selected.addEventListener("click",this.filter_selected_item_clicked);    
            //a aktualizujeme popisek výběru
            var lbl=collection.getElementsByClassName("lbl")[0];
            lbl.innerHTML=lbl.dataset["label"]+" ("+counter+"):";
        }
        
    }
    filter_selected_item_clicked=(e)=>
    {
        e.target.removeEventListener("click",this.filter_selected_item_clicked);
        e.target.remove();
    }
    
    on_keypress=(e)=>
    {
        if (e.keyCode==13 && ((this.onKeyPress_modification_key=="" && e.ctrlKey==false && e.altKey==false && e.shiftKey==false && e.metaKey==false)
            || (e[this.onKeyPress_modification_key+"Key"]==true)))
        {
            this.submit_query(this.input_textbox.value,0,this.get_filters_array());
        }
    }
    submit_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.submit_query(this.input_textbox.value);
    }
    get_order_by=()=>
    {
     
        if (this.rbt_sort_by_year.checked==true)
           return "year asc";
        else
            return "author asc, work asc";
    }
    get_filters_array=()=>
    {//fce. submit query přijímá již "hotové" hodnoty (tj. nezjišťuje si je z html prvků), aby byla použitelná co nejšíře i třeba pro volání zvenku
     //tato fce. tedy vybere data z HTML, aby mohla být předána fci submit_query
        var get_selected=function(container)
        {
            var si=container.getElementsByClassName("selected_item");
            var selected=[];
            for (var i=0;i<si.length;i++)
            {
                selected.push(si[i].dataset["idno"]);
            }
            return selected;
        }
        var rv=[];
        rv["lemmatised"]=this.chb_lemmatised.checked;
        rv["verses_only"]=this.chb_verses_only.checked;
        if (this.rbt_actual.checked==true)
        {
            rv["author_idno"]=get_selected(this.authors_filter);
            rv["work_idno"]=get_selected(this.works_filter);
            rv["text_idno"]=get_selected(this.texts_filter);
            rv["corpus_idno"]=get_selected(this.corpora_filter);
        }
        rv["year1"]=[this.years.year1.value];
        rv["year2"]=[this.years.year2.value];
        
        rv["variants_orth"]=this.chb_variants_orth.checked;
        rv["variants_med"]=this.chb_variants_med.checked;

        return rv;
    }
    submit_query=(query,offset=0,filters=null,order_by=null)=>
    {
        var me=this;
        var xhttp=new XMLHttpRequest();
        xhttp.onreadystatechange=function()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                B.sandglass.close();
                me.results_received(this.responseXML,query,filters);
            }
        }
        var filter="";
        if (filters==null)
        {
            filters=this.get_filters_array()
        }
        if (order_by==null)
        {
            order_by=this.get_order_by()
        }
        for (var i in filters)
        {
            filter+="attr_filter_"+i+"=";
            if (Array.isArray(filters[i]))
            {
                for (var j=0;j<filters[i].length;j++)
                {
                    filter+=filters[i][j];
                    if (j<filters[i].length-1)
                        filter+=",";
                }
            }
            else //některé jsou jen boolanovské
                filter+=filters[i].toString();
            filter+="&";
        }
        B.sandglass.open(this.container);

        this.obj_query_sent.query_url=url+"php_modules/fulltext_search.php?&query="+query+"&offset="+offset+"&"+filter+"&limit="+this.default_limit+"&order_by="+order_by;

        xhttp.open("GET",this.obj_query_sent.query_url,true);
        xhttp.send(null);
    }
    fulltext_search_requested=(e)=>
    {//funkce, která umožní přijímat žádosti o FT vyhledávání zvenčí (např. z políčka pro FTS v object_vieweu)
        this.submit_query(e.detail.query,0,e.detail.filters);
    }
    btn_show_next_hits_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.submit_query(this.results_query,Number(this.results_offset)+Number(this.default_limit),this.get_filters_array());
    }
    btn_show_prev_hits_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.submit_query(this.results_query,Number(this.results_offset)-Number(this.default_limit),this.get_filters_array());
    }
    btn_download_results_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (this.obj_query_sent.query_url!="")
        {
            var download_query=this.obj_query_sent.query_url.replace(/&limit=[0-9]+/,"&limit="+this.obj_query_sent.total_results);
            download_query=download_query.replace(/&offset=[0-9]+/,"&offset=0");
            download_query+="&download=true";
            window.open(download_query,"_blank");
            //ajax(download_query,null);
        }
    }
    get_search_in_info=(xml)=>
    {//textová informace o tom, jakými filtry bylo vyhledávání omezeno
        var filters=xpe(xml,"cc:sphinx_search/cc:filters",null);
        var rv;
        if (filters==null)
            rv="the whole database";
        else if (filters.getAttribute("no_filters")=="true")
            rv="the whole database";
        else
        {
            var f = ["","","",""],i,j,item,coll;
            for (j=0;j<3;j++)
            {
                if (j==0) coll=xpei(xml,"cc:corpora/cc:corpus",filters);
                else if (j==1) coll=xpei(xml,"cc:authors/cc:author",filters);
                else if (j==2) coll=xpei(xml,"cc:works/cc:works",filters);
                while (item=coll.iterateNext())
                {
                    if (i>0)
                        f[j]+=", ";
                    f[j]+=item.textContent;
                    i++;
                }
            }
            var rv="";
            if (f[0]!="")
                f[0]="the corpus "+f[0];
            for (j=0;j<3;j++)
            {
                if (rv!="" && rv.match(/\&rarr; ^/)==null && f[j]!="")
                        rv=rv+" &rarr; ";
                rv=rv+f[j];
                
            }
        }
        return rv;
    }
    results_received=(xml,query=null)=>
    {
        this.filter_search_results.style.display="none";//pro jistotu, ať nám to nestraší
        this.results_div.innerHTML="";
        //pokud na stejné úrovni jako náš výsledkový div je ještě jiný výásledkový div, je to proto, že modul má více podmodulů a každý má svůj vlastní výsledkový div - ty ostatní tedy musíme skrýt
        //BUDE DO  BUDOUCNA VHODNÉ PŘEDĚLAT NA UDÁLOST!
        
        var sibling=null;
        sibling  = this.results_div.parentNode.firstChild;
        while (sibling)
        {
            if (sibling!=this.results_div && sibling.classList.contains("sm_results_div"))
            {
                sibling.dataset["scroll"]=sibling.parentNode.scrollTop;
                sibling.classList.add("display_none");    
            }
            sibling=sibling.nextSibling;
                
        }
        this.results_div.classList.remove("display_none");
        if (this.results_div.dataset["scroll"]!=null)
            this.results_div.parentNode.scrollTop=this.results_div.dataset["scroll"];
        else
            this.results_div.parentNode.scrollTop=0;
        
        var rb=this.results_div.parentNode.parentNode.getElementsByClassName("rbt_switch_results_fs");//aktivujeme případné přepínací políčko
        if (rb.length!=0)
            rb[0].control.checked=true;
        
        var results_count=Number(xp(xml,"cc:sphinx_search/cc:total",r));

        this.obj_query_sent.total_results=results_count;

        var offset=Number(xp(xml,"cc:sphinx_search/cc:offset",r));
        var limit=Number(xp(xml,"cc:sphinx_search/cc:limit",r));
        this.results_query=xp(xml,"cc:sphinx_search/cc:query",r);
        
        var search_in_info=this.get_search_in_info(xml);
        if (search_in_info!="")
            search_in_info=" in " +search_in_info;
        
        var showing_to =offset+limit;
        this.results_offset=offset;
        if (results_count<showing_to)
            showing_to=results_count;
        if (results_count>0)
        {
            var info_div=div("border_h3 padding_5",this.results_div)
            var line1=div("",info_div,"Search for <strong>'"+query+"'</strong> "+search_in_info)
            button ("relative left_10 h_padding_5",line1,"Download results as XML",true,this.btn_download_results_clicked);
            div("",info_div,"Showing results "+Number(offset+1)+" to " +showing_to + " <b> of total "+results_count+" hits:</b>");
        }
        else
            var info_div=div("border_h3 padding_5",this.results_div,"Search for <strong>'"+query+"'</strong> "+search_in_info+"<br/><strong>No results found.</strong></b>");
        

            
        if (offset>0)
        {
            button("relative left_10 h_padding_5",info_div,"Show previous " +this.default_limit+ " hits",true,this.btn_show_prev_hits_clicked);
        }
        if (showing_to<results_count)
        {
            var next_hits=Number(this.default_limit);
            if (next_hits+offset+limit>results_count)
                next_hits=results_count-(offset+next_hits);
            button("relative left_20 h_padding_5",info_div,"Show next " +next_hits+ " hits",true,this.btn_show_next_hits_clicked);
        }
        var res=xml.evaluate("cc:sphinx_search/cc:search_results/cc:search_result",xml,ns);
        var r=null;
        var prev_author_name="";
        var prev_work_name="";
        var i=1;
        while (r=res.iterateNext())
        {
            var pid_to_focus=xp(xml,"cc:pid",r);
            var result=div("",this.results_div);
            
            result.style.marginTop="5px";
            result.dataset["pid"]=pid_to_focus;
            var author_name=offset+i+".  "+xp(xml,"cc:author/cc:item/cc:name_data/cc:name",r);
            var work=span("bold a",result);
            var w=xp(xml,"cc:work/cc:item/cc:name_data/cc:name",r);
            var w_dateXML=xpei(xml,"cc:work/cc:item/cc:time_data/cc:event",r);
            var a_dateXML=xpei(xml,"cc:author/cc:item/cc:time_data/cc:event",r);
            var d_dateXML=xpei(xml,"cc:decisive_year",r);
            var w_date=convert_date(w_dateXML);
            var a_date=convert_date(a_dateXML);
            var d_date=convert_date(d_dateXML);
            if (w_date!="")
                w_date=" ("+w_date+")";
            if (a_date!="")
                a_date=" ("+ a_date+")"
            if (d_date!="" && d_date!="0")
            {
                w_date="";
                a_date="";
                d_date=" ("+ d_date+")"
            }
            else if (d_date=="0")
            {
                w_date="";
                a_date="";
                d_date=" (n. d.)"
            }
            var wname=span("",work);
            wname.innerHTML=author_name+a_date+", "+w+w_date+d_date+": ";
            
            var sections=xml.evaluate("cc:result/cc:meta/cc:heads/cc:head",r,ns);
            var s="";
            var sec=null;
            var wspan=null;
            
            
            while (sec=sections.iterateNext())
            {
                wspan=span("a bold",result);
                wspan.innerHTML=sec.textContent+",";
                wspan.dataset["pid"]=sec.getAttribute("pid");
                wspan.dataset["pid_to_focus"]=pid_to_focus;
                wspan.addEventListener("click",this.dispatch_load_text_request);
            }
            /*if (wspan == null)
	    {
                wspan=span("a bold",result);
                wspan.dataset["pid"]=pid_to_focus;
                wspan.addEventListener("click",this.dispatch_load_text_request);
            }*/
            if (wname!=null)
            {
                wname.addEventListener("click",this.dispatch_load_text_request);
                if (wspan!=null)
                {
                            if (wspan.dataset["pid_to_focus"]!=null)
                                    wname.dataset["pid"]=wspan.dataset["pid_to_focus"].match(/^[0-9]*/)[0];
                            wname.dataset["pid_to_focus"]=wspan.dataset["pid_to_focus"];
                }
                else
                    wname.dataset["pid"]=pid_to_focus.match(/(^[0-9]*)/)[0];
                wname.dataset["pid_to_focus"]=pid_to_focus;

            }
            if (wspan!=null) wspan.innerHTML=wspan.innerHTML.substr(0,wspan.innerHTML.length-1);//odstraníme čárku posledního spanu
            
            var text=div("",result);
            var html=xpe(xml,"cc:result/cc:text/cc:sentence",r);
            html=html.innerHTML.replaceAll(/<\/?cc:sentence[^>]*>/g,"");
            if (html.match('<cc:lb type="verse"/>')!=null)
            {
                html=html.replace(/<cc:lb type="verse"\/>/g,'<br/>');
                text.classList.add("search_result_verse")
            }
            //highligting the results:
            /*if (this.results_query.match(/^\".*\"$/)!=null)
                var single_words=[this.results_query.replaceAll('\"',"")];
            else
                var single_words=this.results_query.split(" ");
            */
            
            var single_words_it=xpei(xml,"cc:sphinx_search/cc:words/cc:word",null);
            var single_word;
            while (single_word=single_words_it.iterateNext())
            {
                single_word=single_word.textContent;
                var rgxp=new RegExp("\\b("+single_word.replace("?",".").replace("*",".*?")+")\\b","gi");
                html=html.replace(rgxp,'<span style="background-color:yellow">$1</span>');
            }
            text.innerHTML=html.substring(0,2000);
            if (html.length>2000)
                text.innerHTML+=" ..."
            i++;
        }
    }
    dispatch_load_text_request=(e)=>
    {
        var path_to_load=e.currentTarget.dataset["pid"];
        var path_to_focus=e.currentTarget.dataset["pid_to_focus"];
        var ev_load_text_request=new CustomEvent('load_text_request',{
                    detail:{path:path_to_load,path_to_focus:path_to_focus}});
        dispatch_event(ev_load_text_request);
    }
}
