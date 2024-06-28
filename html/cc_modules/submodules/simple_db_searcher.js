var simple_db_searcher_loaded=true;
class cls_smod_simple_db_searcher
{
    constructor(container,create_controls=true,input_textbox=null,results_div=null,input_type="author")
    {
        this.timer_id=null;
        
        if (create_controls==true)//nástroj může vytvořit vlastní tlačítka, anebo taky jen sloužit jako 
            //prostředník pro komunikaci nějakého jiného modulu, který si vytvoří tlačítka vlastní, s databází a poskytovat své vyhledávací služby
        {
            this.mode="normal";
            this.div1=document.createElement("div");
            this.div1.classList.add("mod_dbs_div");

            /*this.div2=document.createElement("div");
            this.div2.classList.add("mod_dbs_div");
            
            this.div3=document.createElement("div");
            this.div3.classList.add("mod_dbs_div");*/
            
            
            this.lbl_authors=span("", this.div1,"Start typing an author or work name (at least 3 letters), <span>an author identificator (VIAF, Wikidata, Mirabile, DNB)</span> or browse the Patrologia Latina (e.&nbsp;g. PL&nbsp;211&nbsp;37A):<br/>");
            //this.lbl_authors.getElementsByTagName("span")[0].title="N. B.: Not all authors in our databae may have all identificators filled 
            this.txt_authors=textbox("width_350",this.div1);
            this.txt_authors.addEventListener("input",this.on_txt_input);
            this.txt_authors.dataset["subject"]="all";
            
            
            /*this.lbl_works=document.createElement("div");
            this.lbl_works.innerHTML="or part of a work title: (type at least 3 letters) <br/>or type e. g. PL 211 37A to browse the Patrologia Latina";
            this.lbl_works.style.margin="auto";
            this.div2.appendChild(this.lbl_works);
            this.txt_works=document.createElement("input");
            this.txt_works.type="text";
            this.txt_works.classList.add("textbox");
            this.txt_works.addEventListener("input",this.on_txt_input);
            this.txt_works.dataset["subject"]="cc_works";
            this.div2.appendChild(this.txt_works);*/
            
            this.upper_div=document.createElement("div");
            this.upper_div.classList.add("mod_dbs_upper_div");
            this.results_div=document.createElement("div");
            this.results_div.classList.add("mod_dbs_bottom_div");
            
            this.container=document.createElement("div");
            //this.container.classList.add("full_div");
            
            /*this.collapse_btn=document.createElement("info_btn");
            this.collapse_btn.classList.add("mod_dbs_x_btn");
            this.collapse_btn.addEventListener("click",this.collapse);*/
            /*var lbl=document.createElement("div");
            lbl.innerHTML="&nbsp";
            this.div3.appendChild(lbl);*/
            //this.div3.appendChild(this.collapse_btn);
            
            this.container.appendChild(this.upper_div);
            this.container.appendChild(this.results_div);
            this.upper_div.appendChild(this.div1);
            //this.upper_div.appendChild(this.div2);
            //this.upper_div.appendChild(this.div3);
            
            this.button_when_collapsed=document.createElement("info_btn");
            this.button_when_collapsed.classList.add("mod_dbs_collapsed_btn");
            this.button_when_collapsed.addEventListener("click",this.show);
        
            
            this.show();
            
            
            this.outer_container=container;
            this.outer_container.appendChild(this.button_when_collapsed);
            this.outer_container.appendChild(this.container);
        }
        else
        {//ovládací prvky už vytvořil někdo jiný: nám jen řekne, jaké textové pole bude sloužit pro vstup a jaký div pro výstup výsledků. 
         //Modul tak slouží jen jako rozhraní pro komunikaci s databází.
            if (input_textbox!=null)
            {
                this.txt=input_textbox;
                this.txt.dataset["subject"]=input_type;
                this.txt.addEventListener("input",this.on_txt_input);
            }
            this.results_div=results_div;
        }
        
        this.last_query_submitted="";
        
    }
    add_external_input_textbox=(text_box,text_box_subject)=>
    {//aby mohlo více vhyledávacích externích (tj. nikoliv tímto objektem vytvořených) okének využívat jednu instanci této třídy, 
     //lze je touto funkcí připojit. O tom, co se skrz ně má vyhledávat, informují tyto textboxy v parametru subject. Ten, pokud ho políčko nastaven nemá, bud mu nastaven.
        if (text_box.dataset["subject"]!=text_box_subject)
            text_box.dataset["subject"]=text_box_subject;
        text_box.addEventListener("input",this.on_txt_input);
    }
    listen_to_search_result_selected=(fn)=>
    {//pokud využíváme objekt z vnějšku, tímto se jednoduše připojíme k poslouchání události, když dorazí výsledky
        this.mode="external_use";
        this.results_div.addEventListener("search_result_selected",fn);
    }
    on_txt_input=(e)=>
    {
        if (this.timer_id!=null)
            window.clearTimeout(this.timer_id);
        this.timer_id=window.setTimeout(this.submit_simple_query_timer,250);
        this.simple_query_input={q:e.target.value,s:e.target.dataset["subject"]};//nemůžeme brát hodnotu this.txt, protože můžeme mít připojené různá další políčka,viz předchozí fci
    }
    submit_simple_query_timer=(e)=>
    {
        window.clearTimeout(this.timer_id);
        this.submit_simple_query(this.simple_query_input.q,this.simple_query_input.s);
    }
    submit_simple_query=(q,s)=>
    {
        if (q.length>2)
        {
            
            var me=this;
            var xhttp=new XMLHttpRequest();
            xhttp.onreadystatechange=function()
            {
                if (this.readyState == 4 && this.status == 200)
                {       
                    var query=xp(this.responseXML,"cc:xq_results/@query");
                    if (query!=me.last_query_submitted)
                        return 0;
                    clean_element(me.results_div);
                    var element=document.createElement("span");
                    element.innerHTML="<strong>"+xp(this.responseXML,"cc:xq_results/@total")+" items found for query '" + query+"': </strong><br/>"
                    me.results_div.appendChild(element);
                    var collections=this.responseXML.evaluate("//cc:collection",this.responseXML,ns);
                    var collection=null;
                    var search_subject=xp(this.responseXML,"cc:xq_results/@subject");
                    var result_collection_divs={length:0};
                    while (collection=collections.iterateNext())
                    {
                        var coll_name=xp(this.responseXML,"@name",collection);
                        var results_found=xp(this.responseXML,"count(cc:xq_result)",collection);
                      
                        if (Number(results_found)>0)
                        {
                            var coll_div=div("");
                            result_collection_divs[coll_name]=coll_div;
                            result_collection_divs.length++;
                            var subject="";
                            element=span("pointer");
                            if (coll_name=="cc_authors")
                            {
                                element.innerHTML="<strong>Authors ("+results_found+"): </strong>";
                                var subject="author";
                            }
                            else if (coll_name=="cc_works")
                            {
                                element.innerHTML="<strong>Works ("+results_found+"): </strong>";
                                subject="work";
                            }
                            else if (coll_name=="cc_texts")
                            {
                                element.innerHTML="<strong>Texts ("+results_found+"): </strong>";
                                subject="text";
                            }
                            else if (coll_name=="cc_corpora")
                            {
                                element.innerHTML="<strong>Corpora ("+results_found+"): </strong>";
                                subject="corpus";
                            }
                            
                            if (coll_name=="temporary")
                            {
                                element.innerHTML+=" (temporary)";
                            }
                            var btn=button("mod_dbs_lst_btn",element,"",true,me.show_results_as_list);
                            //element.addEventListener("click",me.show_results_as_list);
                            btn.title="Click to show results as list";
                            
                            coll_div.appendChild(element);
                        }
                        var results=this.responseXML.evaluate("cc:xq_result",collection,ns);
                        var result;
                        var i=1;
                        while (result=results.iterateNext())
                        {
                            if (search_subject=="PL")
                            {//při hledání v patrologii je výstup dost jiný, v řádcích s přidanou informací, kde v PL se text nachází. A kliknutí rovnou otevře text
                                me.mode="load_text";
                                element=document.createElement("div");
                                var t_name=info_value("",element,"");
                                var pl_volume=xp(this.responseXML,"cc:PL/cc:volume",result);
                                var pl_first=xp(this.responseXML,"cc:PL/cc:first_column",result);
                                var pl_last=xp(this.responseXML,"cc:PL/cc:last_column",result);
                                var name=xp(this.responseXML,"cc:name",result);
                                t_name.innerHTML=name+
                                "; PL "+pl_volume+", "+pl_first+"-"+pl_last;
                                t_name.dataset["id"]=xp(this.responseXML,"cc:cc_idno",result);
                                span("h_padding_10",element," ");
                                var precise_PLs=this.responseXML.evaluate("cc:precise_pid",result,ns);
                                var precise_PL;
                                var i=0;
                                while (precise_PL=precise_PLs.iterateNext())
                                {
                                    var precise_pos=info_value("h_padding_5",element);
                                    precise_pos.innerHTML=precise_PL.getAttribute("PL");
                                    precise_pos.dataset["id"]=xp(this.responseXML,"cc:cc_idno",result);
                                    precise_pos.dataset["focus"]=xp(this.responseXML,"cc:nearest_pid",precise_PL);
                                    if (i==0)
                                        t_name.dataset["focus"]=precise_pos.dataset["focus"];
                                    i++;
                                }
                                
                            }
                            else
                            {
                                element=span("search_result");
                                
                                
                                var name=xp(this.responseXML,"cc:name",result);
                                var hit_name=xp(this.responseXML,"cc:hits/cc:external[1]/@source|cc:hits/cc:synonym[1]",result);
                                if (hit_name!=undefined &&hit_name!=name)
                                    hit_name=" ("+hit_name.trim()+")";
                                else if (hit_name==name || hit_name==undefined)
                                    hit_name="";
                                
                                var shown_text="";
                                if (subject=="work" || subject=="text")
                                {
                                    var author_name=xp(this.responseXML,"cc:author_name",result);
                                    if (author_name!=undefined && author_name!="")
                                        author_name=" ("+author_name+")";
                                    shown_text=name+author_name;
                                }
                                else
                                    shown_text=name+hit_name;
                                shown_text=shown_text.replace(new RegExp("("+query+")","i"),"<strong>$1</strong>");
                                if (i<results_found)
                                    shown_text+="; &nbsp;";
                                
                                element.innerHTML+="<info_value data-id='"+xp(this.responseXML,"cc:cc_idno",result)+"'>"+shown_text+"</info_value>";
                                
                                
                                
                            }
                            element.dataset["id"]=xp(this.responseXML,"cc:cc_idno",result);
                            element.dataset["type"]=subject;
                            element.addEventListener("click",me.item_selected);
                            element.style.cursor="pointer";
                            coll_div.appendChild(element);
                            
                            i++;
                        }
                    }
                    if (result_collection_divs.cc_corpora!=undefined)
                        me.results_div.appendChild(result_collection_divs.cc_corpora);
                    if (result_collection_divs.cc_authors!=undefined)
                        me.results_div.appendChild(result_collection_divs.cc_authors);
                    if (result_collection_divs.cc_works!=undefined)
                        me.results_div.appendChild(result_collection_divs.cc_works);
                    if (result_collection_divs.cc_texts!=undefined)
                        me.results_div.appendChild(result_collection_divs.cc_texts);
                    if (typeof(B) != "undefined")
                        B.sandglass.close();
                    
                }
            }
            if (q.match(/^\?/))
            {
                q=q.substring(1);
                s="all";
            }
            q=q.trim();
            if (typeof(B) != "undefined")
                B.sandglass.open(this.upper_div);
            this.last_query_submitted=q;
            xhttp.open("GET",url+"php_modules/db_search.php?mode=0&query_text="+q+"&subject="+s,true);
            xhttp.send(null);
        }
        else
        {
            clean_element(this.results_div);
        }
    }
    show_results_as_list=(e)=>
    {
        var srs=e.currentTarget.parentNode.parentNode.getElementsByClassName("search_result");
        for (var i=0;i<srs.length;i++)
            srs[i].classList.toggle("block");
    }
    item_selected=(e)=>
    {
        if (!(kb_click(e))) return false;
        e.stopPropagation();
        if (this.mode=="normal")
            this.request_navigation(e);
        else if (this.mode=="load_text")
        {
            this.request_navigation(e);
            this.dispatch_load_text_request(e.currentTarget.dataset["id"],e.currentTarget.dataset["focus"]);
        }
        else
        {
            var e=new CustomEvent("search_result_selected",{detail:
                {idno:e.currentTarget.dataset["id"],
                type:e.currentTarget.dataset["type"],
                name:e.currentTarget.innerHTML,
                db_search_module:this
                }});
            this.results_div.dispatchEvent(e);
        }
            
    }
    dispatch_load_text_request=(path,path_to_focus="")=>
    {
        var ev_load_text_request=new CustomEvent('load_text_request',{
                    detail:{path:path,path_to_focus:path_to_focus}});
        dispatch_event(ev_load_text_request);
    }
    request_navigation=(e)=>
    {
        if (!(kb_click(e))) return false;
        var e=new CustomEvent("navigate_request",{detail:{path:e.currentTarget.dataset["id"]}});
        dispatch_event(e);
    }
    collapse=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.container.style.display="none";
        this.button_when_collapsed.style.display="block";
    }
    show=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.container.style.display="block";
        this.button_when_collapsed.style.display="none";
    }
}
