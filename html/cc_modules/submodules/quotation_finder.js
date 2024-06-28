
var cls_smod_quotation_finder=true; 
class  cls_mod_quotation_finder_TextViewerVis
{  //module for visualizing the results of text reuse analyses in the TextViewer (as paratext and/or in the text itself)
    constructor(parent_module,paratext_organizer=null)
    {        
        this.name="Quotation analysis";
        this.using_paratext=true;
        this._parent=parent_module;
        this.analysis=[];
        this._document=null;
        this.paratext_organizer_set(paratext_organizer);
        
        this.visualization_settings=
        {
            visualize_in_paratext:true,
            visualize_in_text:true
        };


        this.programs=[];
        
        
        var program_cc=
        {
            name:"cc",
            method:"ngram",
            n:3,
            k:1,
            near:2,
            strict_order:false,
            exclude_most_frequent:50,
            adjustable:["n","k","strict_order",
                {
                    "vname":"exclude_most_frequent",
                    "caption":"Exclude most frequent words (set 0-200)",
                    "tip":"Helps eliminate hits consisting of very frequent words."
                }
            ],
            check_values:function()
            {
                if (typeof this.n !="number")
                    this.n=3;
                else if (this.n<3)
                    this.n=3;
                else if (this.n>10)
                    this.n=10;
            }
        };
        this.programs.push(program_cc);
        this.settings=
        {
            pid_to_analyze:"",
            DOM_object:null,
            program:"cc",
            program_settings:this.programs[0],
            works_to_exclude:"",
            texts_to_exclude:"",
            authors_to_exclude:"",
            corpora_to_exclude:"",
            json()
            {
                return JSON.stringify(this);
            }
        };
        
        
    }
    open_toolbox=(segment)=>
    {
        
    }
    menu_item_clicked=(e)=>
    {//detail=menu_item object, from which we can get the _document and the _context
        var pid=e.target.dataset["pid"];
        var segment=document.getElementById(pid);
        this.analyse_segment(segment);
    }
    analyse_segment=(segment)=>
    {
        if (typeof segment=="object")
        {
            this.settings.pid_to_analyze=segment.id;
            this.settings.DOM_object=segment;
            //zjistit, jestli už analýza pro tento segment neexistuje
            var exists_analysis=false;

            if (exists_analysis==false)
            {
                for (var i=0;i<this.analysis.length;i++)
                {
                    
                }
                var new_an=new cls_QF_analysis(this.settings,true,this,this.paratext_obj.create_paratext_block());
                this.analysis.push(new_an);

                new_an.addEventListener("on_sentence_analysis_received",this.sentence_analysis_received);
                new_an.addEventListener("on_analysis_toggled",this.toggle_analysis);
            }
        }
    }
    text_viewer_context_menu_created=(e)=>
    {//bylo otevřeno kontextové menu v prohlížeči... přidáme doň svou položku
        //alert("O");
        var cm=e.detail;
        this._document=cm._document;
        var settings_panel=div("",null);
        var d=div("",settings_panel);
        //create_element("button","",div("",settings_panel),"Settings");
        var btn=create_element("button","",d,"Analyze this segment");
        var settings_btn=create_element("button","",d,"&#x2699;");
        settings_btn.onclick=this.open_settings_window;
        btn.dataset["pid"]=cm._context.id;
        btn.onclick=this.menu_item_clicked;
        cm.create_item("TR","Text-reuse analysis",null,settings_panel);
        
        
    }
    open_settings_window=(e)=>
    {
        var me=this;
        var w=window.open(url+"blankpage.html","","height=300,width=500,menubar=no,location=no,titlebar=no,toolbar=no");
        w.document.body.onload=function(e)
        {
            w.title="Corpus Corporum: Quotation Finder Settings";
            var b=e.target.body;
            div("",b,"Quotation finder settings");
            
            span("",b,"Select programme to use: ");
            var select_box=create_element("select","",b);
            for (var i=0;i<me.programs.length;i++)
            {
                create_element("option","",select_box,me.programs[i].name);
            }
            div("",b,"Choose values for k-skip-ngrams: ");
            var list_adjustable_values=function(p)
            {
                for (var i=0;i<p.adjustable.length;i++)
                {
                    var a=p.adjustable[i];
                    var vname="";
                    var caption="";
                    var tip="";
                    if (typeof a=="object")
                    {
                        vname=a.vname;
                        caption=a.caption;
                        tip=a.tip;
                    }
                    else
                    {
                        vname=a;
                        caption=a;
                        tip="";
                    }
                    var d=div("l_margin_10",b,caption+": ");
                    d.title=tip;
                    var ctrl;
                    if (typeof p[vname] == "boolean")
                    {
                        var rb=radiobutton2("",d,"yes",(p[vname]==true),"rb_"+vname+"_true",a,null,"value")
                        rb.value=1;
                        rb=radiobutton2("",d,"no",(p[vname]==false),"rb_"+vname+"_false",vname,null,"value")
                        rb.value=0;

                    }
                    else                    
                    {
                        var tb=create_element("input","value",d);
                        tb.type="text";
                        tb.name=vname;
                        tb.value=p[vname];
                    }
                    
                }
            }
            list_adjustable_values(me.programs[0]);

            var save=function(e)
            {
                var settings=[];
                var values=b.getElementsByClassName("value");
                for (var i=0;i<values.length;i++)
                {
                    if (values[i].type!="radio" || values[i].checked==true)
                    {
                    //    settings.push({"name":values[i].dataset["name"],"value":values[i].value});
                        if (typeof me.programs[0][values[i].name] == "number")
                            me.programs[0][values[i].name]=Number(values[i].value);
                        else if (typeof me.programs[0][values[i].name] == "boolean")
                            me.programs[0][values[i].name]=Boolean(values[i].value);
                        else 
                            me.programs[0][values[i].name]=values[i].value;
                    }
                }
                me.programs[0].check_values();
                w.close();
            }

            var btn=create_element("button","",b,"Apply");
            btn.onclick=save;

        }

    }
    settings_saved=(e)=>
    {
        alert("settings saved");S
    }
    attach_to_module=(parent_module,paratext_organizer=null)=>
    {
        if (parent_module.module_name=="Text viewer")
        {
            parent_module.events.addEventListener("context_menu_created",this.text_viewer_context_menu_created);
            if (paratext_organizer!=null)
                this.paratext_organizer_set(paratext_organizer);
        }
        
    }
    paratext_organizer_set=(paratext_organizer)=>
    {
        this.paratext_organizer=paratext_organizer;
        //this.paratext_organizer.addEventListener();
    }
    paratext_initialize=(mode)=>
    {

    }
    paratext_adjust=(e)=>
    {

    }

    visualize_in_textviewer=(analysis)=>
    {
        
    }
    paratext_obj=
    {
        _parent:this,
        blocks:Array(),
        active:null,
        create_paratext_block()
        {
            //tady se musí najít příslušná pozice mezi jinými potenciálně už existujícími bloky
            this.blocks.push(div("paratext_item",this._parent.paratext_organizer.div));
            
            this.active=this.blocks[this.blocks.length-1];
            return this.blocks[this.blocks.length-1];
        }
        
    }
    toggle_analysis=(e)=>
    {
        var a=e.detail.analysis;
        if (e.detail.visible==false)
        {
            var wrds=a.settings.DOM_object.getElementsByClassName(a.analysis_id);
            for (var i=wrds.length-1;i>=0;i--)
            {
                wrds[i].style.borderBottom="0px";
                wrds[i].dataset["tr_cluster"]="";
                wrds[i].classList.remove("pointer");
                wrds[i].classList.remove(a.analysis_id);
                
            }
            a.cl_colors_to_use=[...a.cl_colors_red];
        }
        else if (e.detail.visible==true)
        {
            for (var i=0;i<a.sentences.length;i++)
                this.visualize_sentence_in_text(a.sentences[i],a.analysis_id);
        }
    }

    

    visualize=(analyis,as_paratext=true,in_text=true)=>
    {
        if (as_paratext==true)
            this.visualize_as_paratext(analyis);
        if (in_text==true)
            this.visualize_in_text(analyis);
    }
    visualize_as_paratext=(analysis)=>
    {

    }
    sentence_analysis_received=(e)=>
    {
        if (this.visualization_settings.visualize_in_paratext==true)
        {
            this.visualize_sentence_as_paratext(e.detail.sentence,e.detail.analysis_id);
        }
        if (this.visualization_settings.visualize_in_text==true)
        {
            this.visualize_sentence_in_text(e.detail.sentence,e.detail.analysis_id);
        }
    }

    visualize_one_hit=(index,hit,container)=>
    {//for use both in paratext, as well as in intext-boxes
        var h_div=div("l_margin_20",container);
        var y=hit.year;
        if (y=="10000" || y=="" || y=="0")
            y="<em>datation missing</em>"
        else
        {
            if (Number(y)<0)
                y=Math.abs(Number(y))+ " BC";
            else
            {
                if (Number(y)<500)
                    y=y+ " AD";
            }
        }
        var Wy=this._document.doc.meta.decisive_year;
        var chron_rel="";
        var chron_info="";        
        if (Wy==0 || Wy==10000 || hit.year==0 || hit.year==10000)
        {//if we don't know the main or compared text datation, we can't say much...
            chron_rel="chron_unknown";
            chron_info="The relative datation of this document to the main document can't be established."
        }
        else
        {
            if (Wy==hit.year)
            {
                chron_rel="chron_unknown";
            chron_info="This document and the main text from (approximately) the same period." 
            }
            else if (Wy>hit.year)//reuse: hit in cluster is older than main text
            {
                chron_rel="chron_older";
                chron_info="This document is older than the main text."
            }

            else if (Wy<hit.year) //source   
            {
                chron_rel="chron_newer";
                chron_info="This document is newer than the main text."
            }
            
        }

        var chron_indicator=div("small_inline_circle "+chron_rel,h_div);
        chron_indicator.title=chron_info;
        var a=create_element("a","",h_div,(index+1)+".: " + hit.work);
        span("",a," ("+y+")").title="Datation";
        a.href="https://mlat.uzh.ch/browser?text="+hit.pid;
        a.target="_blank";
        var s=div("pointer l_margin_10 text_overflow_elipsis",h_div,hit.sentence);
        s.title="Click to view the whole text."
        var cl=hit.cluster;
        var expand_sentence=function(e)
        {   
            var d=e.target;
            d.title="";
            d.classList.remove("pointer");
            d.classList.remove("text_overflow_elipsis");
            d.style.whiteSpace="normal";
            /* highlighting */
            var cl_text=this.cluster.xml.getElementsByTagName("matching_substring")[0].textContent.replaceAll("-","").trim();
            var cl_words=cl_text.split(" ");
            var rgx=new RegExp("(\\b"+cl_words.join("\\b|\\b")+"\\b)");
            var content_array=d.textContent.split(rgx);
            for (var i=0;i<content_array.length;i++)
            {
                if (cl_words.indexOf(content_array[i])>-1)
                    content_array[i]="<span style='background-color:yellow'>"+content_array[i]+"</span>";
                else
                    content_array[i]="<span>"+content_array[i]+"</span>";
            }
            d.innerHTML=content_array.join("");

        }
        s.onclick=expand_sentence.bind(hit);
        
    }

    visualize_sentence_as_paratext=(sentence,analysis_id)=>
    {
        var container=this.paratext_obj.active.getElementsByClassName("sentences_container")[0];
        if (sentence.clusters.length>0)
        {
            var d=div("text_overflow_elipsis relative",container);
            d.onmouseover=this.highlight_sentence;

            var plus=span("bold pointer h_margin_10",d," + ");
            plus.onclick=function(e){e.target.parentNode.getElementsByClassName("clusters_div")[0].classList.toggle("display_none");};
            span("bold",d,sentence.sentence_text)
            var clusters_div=div("clusters_div l_margin_30 display_none",d);
            for (var i=0;i<sentence.clusters.length;i++)
            {
                var c=sentence.clusters[i].xml;
                var c_div=div("",clusters_div);
                c_div.dataset["cluster_index"]=i;
                plus=span("bold pointer h_margin_10",c_div," + ");
                var me=this;
                var display_cluster_texts=function(e)
                {
                    var cl=e.detail.cluster;
                    var c_div=cl.__TxVw_viz_paratext_container;
                    var hits_div=c_div.getElementsByClassName("hits_div")[0];
                    for (var i=0;i<cl.hits.length;i++)
                    {
                        me.visualize_one_hit(i,cl.hits[i],hits_div)
                        
                    }
                }

                plus.onclick=function(e)
                {//nahrajeme texty nalezené v clusteru
                    var cl=sentence.clusters[(e.target.parentNode.dataset["cluster_index"])];
                    
                    e.target.parentNode.getElementsByClassName("hits_div")[0].classList.toggle("display_none");
                    if (cl.texts_loaded==false)
                    {
                        //musíme si ke clustrům přidat odkaz na div, ve kterém se tady v paratextu mají zobrazit!
                        cl.__TxVw_viz_paratext_container=e.target.parentNode;

                        cl.load_texts();
                        //což je asynchronní, tedy musíme použít událost
                        cl._sentence.addEventListener("on_cluster_texts_loaded",display_cluster_texts);
                    }
                    else
                    {
                        cl.__TxVw_viz_paratext_container=e.target.parentNode;
                        display_cluster_texts({detail:{cluster:cl}}); 
                    }
                };
                
                var t=xp(sentence.responseXML,"cc:matching_substring",c);
                var rgx=/(-+ -)/g;
                t=t.replaceAll(rgx,"");
                span("",c_div,"Cluster: "+t);
                var hits_div=div("hits_div display_none h_margin_30",c_div);
                
                
                //this.highlight_cluster({text:t,start:s,end:e,cluster_index:i});
            }
        }
        else
        {
            var d=div("color_lightgray text_overflow_elipsis relative",container);
            var plus=span("bold pointer h_margin_10 hidden",d," + ");
            span("",d,"sentence (no hits): "+sentence.sentence_text)
        }
    }
    
    
    visualize_sentence_in_text=(sentence,analysis_id)=>
    {
        if (sentence.clusters.length>0)
        {
            for (var i=0;i<sentence.clusters.length;i++)
            {
                var c=sentence.clusters[i];
                var s=c.xml.getAttribute("start");
                var e=c.xml.getAttribute("end");
                var t=xp(c._sentence.responseXML,"cc:matching_substring",c.xml);
                var rgx=/(-+)/g;
                t=t.replaceAll(rgx,"");

                var cl=this._document.obj_context_selection.select_part_of_sentence(
                    {start_index:s,end_index:e,text:t},sentence.pid,sentence.segment);
                
                var cl_color=Math.floor(Math.random()*sentence.cl_colors_to_use.length);
    
                for (var j=0;j<cl.length;j++)
                {
                    var border_width="2";
                    var cluster_info=cl[j].dataset["tr_cluster"];
                    if (cluster_info!=null && cluster_info!="")
                    {
                        border_width="4";
                        cluster_info+=" "+i;
                    }
                    else
                        cluster_info=i;
                    
                    cl[j].classList.add("pointer");
                    cl[j].classList.add(analysis_id);
                    cl[j].dataset["tr_cluster"]=cluster_info;
                    cl[j].style.borderBottom=border_width+"px solid "+sentence.cl_colors_to_use[cl_color];
                    c.color=sentence.cl_colors_to_use[cl_color];
                    var me=this;
                    cl[j].onclick=function(e)
                    {
                        if (e.target===e.currentTarget)
                        {
                            var s=parent(this,"","sentence");
                            var w=s.getElementsByTagName("w");
                            w=w[w.length-1];
                            var b=me._document.obj_intext_boxes.open(w,{points_to:this,class_name:"cluster_info"});
                            me.generate_intext_box(b,this);
                            b.addEventListener("on_close_box",me.on_close_box);
                        }
                    };
                     
                }
                sentence.cl_colors_to_use.splice(cl_color,1);
                if (sentence.cl_colors_to_use.length==0)
                    sentence.cl_colors_to_use=[...sentence.cl_colors_availible];
            }
        }
        
    }
    on_close_box=(e)=>
    {
        var previously_hgl=e.target.__sentence.segment.getElementsByClassName("cluster_highlighted");
        for (var i=0;i<previously_hgl.length;i++)
        {
            previously_hgl[i].style.backgroundColor="";
            previously_hgl[i].classList.remove("cluster_highlighted");
            i--;
        }
    }

    highlight_cluster(cluster,index="")
    {
        var s=cluster._sentence;

        

        var seg=s.segment;
        var sentence_elements=seg.getElementsByTagName("sentence");

        var previously_hgl=seg.getElementsByClassName("cluster_highlighted");
        for (var i=0;i<previously_hgl.length;i++)
        {
            previously_hgl[i].style.backgroundColor="";
            previously_hgl[i].classList.remove("cluster_highlighted");
            i--;
        }

        for (var i=0;i<sentence_elements.length;i++)
        {
            if (sentence_elements[i].dataset["pid"]==s.pid)
            {
                var w=sentence_elements[i].getElementsByTagName("w");
                for (var j=0;j<w.length;j++)
                {
                    var words_clusters=w[j].dataset["tr_cluster"];
                    if (words_clusters!=null)
                    {
                        words_clusters=words_clusters.split(" ");
                        if (words_clusters.indexOf(String(index))!=-1)
                        {
                            var orig_c=window.getComputedStyle(w[j]).borderBottomColor;
                            orig_c=orig_c.match(/[0-9]+/g);
                            var new_c=mix_colors(orig_c,[255,255,255],0.8);
                            w[j].style.backgroundColor="rgb("+new_c.r+","+new_c.g+","+new_c.b+")";
                            w[j].classList.add("cluster_highlighted");
                        }
                    }
                }
                break;
            }
        }

    }

    find_analysis_for_pid(sentence_pid)
    {
        
        var segment_pid=sentence_pid.match("^[^,]*")[0];
        for (var i=0;i<this.analysis.length;i++)
        {
            if (this.analysis[i].pid==segment_pid)
            {
                var a=this.analysis[i];
                for (var j=0;j<a.sentences.length;j++)
                {
                    if (a.sentences[j].pid==sentence_pid)
                    {
                        return a.sentences[j];
                    }
                }
            }
        }
    }

    generate_intext_box(box,word)
    {
        
        //we must find the corresponding analysis and sentence from the pids!
        var sentence_element=parent(word,"","sentence");
        var sentence_pid=sentence_element.dataset["pid"];
        var s=this.find_analysis_for_pid(sentence_pid);
        var clusters=word.dataset["tr_cluster"].split(" ");

        var me=this;
        var c=box.content;

        box.__sentence=s;
        
        var show_cluster=function(e)
        {
            if (typeof(e)=="number")
                cl_index=e;
            else
                var cl_index=Number(e.target.dataset["cluster"]);
            
            var cl_containers=c.getElementsByClassName("cluster_container");
            var visible_cl_container=null;
            for (var i=0;i<cl_containers.length;i++)
            {
                if (cl_containers[i].dataset["cluster"]==cl_index)
                {
                    cl_containers[i].classList.remove("display_none");
                    visible_cl_container=cl_containers[i];
                }
                else
                    cl_containers[i].classList.add("display_none");
            }
            if (s.clusters[cl_index].texts_loaded==false)
            {
                s.addEventListener("on_cluster_texts_loaded",cluster_texts_loaded);
                s.clusters[cl_index].load_texts();

            }
            else
            {
                display_cluster_texts(s.clusters[cl_index],visible_cl_container)
            }
            me.highlight_cluster(s.clusters[cl_index],cl_index)
        }
        var cluster_texts_loaded=function(e)
        {            
            var cl_containers=c.getElementsByClassName("cluster_container");
            for (var i=0;i<cl_containers.length;i++)
            {
                if (cl_containers[i].classList.contains("display_none")==false)
                {
                    display_cluster_texts(e.detail.cluster,cl_containers[i]);
                }
            }
        }
        var display_cluster_texts=function(cl,cl_container)
        {
            cl_container.innerHTML="";
            for (var i=0;i<cl.hits.length;i++)
            {
                cl.hits[i].cluster=cl;
                me.visualize_one_hit(i,cl.hits[i],cl_container);
                
            }
        }

        var cl_overwiew_div=div("font_10pt underline",c);
        var cluster_index=0;
        for (var i=0;i<clusters.length;i++)
        {
            cluster_index=clusters[i];
            var cl=span("r_padding_10",cl_overwiew_div,"Cluster "+(Number(clusters[i])+1));
            cl.dataset["cluster"]=clusters[i];
            var cl_div=div("cluster_container display_none color_black",c);
            cl_div.dataset["cluster"]=clusters[i];
            cl.onclick=show_cluster;
        }
        if (clusters.length==1)
            show_cluster(Number(cluster_index));
        
        

    }
    
    

    hide_in_text=(analysis)=>
    {
    
    }

}

class cls_QF_analysis extends EventTarget
{//here the results of analyses for single pids are stored
    constructor(settings,start=true,_submodule,paratext_block=null)
    {
        super();
        this._smod=_submodule;
        this.paratext_block=paratext_block;
        this.pid=settings.pid_to_analyze;
        this.settings=settings;

        this.sentences=[];
        this.index;

        this.instance_nr=this.counter+1;
        this.analysis_id="QFA-"+this.instance_nr;
        
        cls_QF_analysis.prototype.counter++;

        if (this.paratext_block!=null)
        {
            
            var d=div("bold",this.paratext_block);
            
            var plus=span("bold pointer h_margin_5",d," + ");
            span("",d,"TR analysis for "+this.pid);
            
            
            var chb=create_element("input","l_margin_10",d);
            chb.id="tr_analysis_pxbox_"+this.pid;
            chb.type="checkbox";
            chb.checked=true;
            var lbl=create_element("label","",d,"Show in text box");
            lbl.htmlFor=chb.id;
            chb.style.display="initial";
            var btn=create_element("button","",d,"D");
            btn.onclick=this.download_analysis;
            var me=this;
            chb.onchange=function(e){me.toggle_analysis(e.target.checked);};
            plus.onclick=function(e){e.target.parentNode.nextSibling.classList.toggle("display_none");};
            var sentences_container=div("sentences_container",this.paratext_block);
        }

        if (start==true)
            this.start_analysis();
    }
    download_analysis=()=>
    {
        this.Wy=this._smod._document.doc.meta.decisive_year
        this.rv="<text_reuse_analysis>\n";
        for (var i=0;i<this.sentences.length;i++)
        {
            this.s=this.sentences[i];
            this.rv+="<sentence pid='"+this.s.pid+"'>\n";
            this.rv+="\t<text>"+this.s.sentence_text+"</text>\n";
            var me=this;
            var continue_generating=function(e)
            {
                me.rv+="\t<cluster n='"+Number(j+1)+"'>\n";
                for (var k=0;k<me.c.hits.length;k++)
                {
                    var h=me.c.hits[k];
                    var rel="";
                    if (h.year=="" || h.year=="0" || h.year=="10000")
                        rel="--unknown--";
                    else if (me.Wy<Number(h.year))
                        rel="--more recent--";
                    else if (me.Wy>Number(h.year))
                        rel="--older--";
                    else
                        rel="--same year--";

                    me.rv+="\t\t<hit n='"+Number(k+1)+"' chronologial_relation='"+rel+"'>\n";
                    me.rv+="\t\t\t<work>"+h.work+"</work>\n";
                    me.rv+="\t\t\t<year>"+h.year+"</year>\n";
                    me.rv+="\t\t\t<pid>"+h.pid+"</pid>\n";
                    me.rv+="\t\t\t<text>"+h.sentence+"</text>\n";
                    me.rv+="\t\t</hit>\n";
                }
                me.rv+="\t</cluster>\n";
            }

            for (var j=0;j<this.s.clusters.length;j++)
            {
                this.c=this.s.clusters[j];
                this.c.load_texts(true);
                //this.c._sentence.on_cluster_texts_loaded=continue_generating.bind(this);
                continue_generating();

            }
        }
        this.rv+="</text_reuse_analysis>";
        this.save("TR_analysis.xml",this.rv);
    }
    save=(filename, data)=> {
        const blob = new Blob([data], {type: 'text/csv'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;        
            document.body.appendChild(elem);
            elem.click();        
            document.body.removeChild(elem);
        }
    }
    start_analysis=()=>
    {
        this.settings.texts_to_exclude=this._smod._document.doc.text_id;
        this.settings.works_to_exclude=this._smod._document.doc.work_id;
        /*nejprve zjistímě, zda chceme analyzovatjednotlivou větu, nebo nějaký odstavec.
         V takovém případě identifikujeme jednotlivé věty*/
        if (this.settings.pid_to_analyze.indexOf(",")!=-1)//analyzjeme jenom jednu větu
        {
            this.sentences.push(new cls_QF_sentence_analysis(this.settings.pid_to_analyze,null,this));
        }
        else
        {
            if (this.settings.DOM_object!=null)
            {
                var s_list=this.settings.DOM_object.getElementsByClassName("s");
                for (var i=0;i<s_list.length;i++)
                    this.sentences.push(new cls_QF_sentence_analysis(s_list[i].id,this.settings.DOM_object,this));
            }
        }
        
        
        /*pak procházíme jednotlivé věty a posíláme žádost o jejich analýzu serveru*/
        this.index=0;
        this.analyse_next_sentence();
        


    }
    analyse_next_sentence=()=>
    {
        ajax(url+"php_modules/quotation_finder.php?settings="+this.settings.json()+
        "&pid="+this.sentences[this.index].pid,this.analysis_received);

    }
    analysis_received=(e)=>
    {
        this.sentences[this.index].analysis_received(e.responseXML);

        this.dispatchEvent(new CustomEvent("on_sentence_analysis_received",{detail:{sentence:this.sentences[this.index],analysis_id:this.analysis_id}}));

        this.index++;
        if (this.index<this.sentences.length)
            this.analyse_next_sentence();
        else
        {}

    }
    toggle_analysis=(visible)=>
    {
        this.dispatchEvent(new CustomEvent("on_analysis_toggled",{detail:{visible:visible,analysis:this}}));

    }
    
}
cls_QF_analysis.prototype.counter=0;

class cls_QF_sentence_analysis extends EventTarget
{
    constructor(pid,segment=null,_analysis)
    {
        super();
        this._analysis=_analysis;
        this._document=_analysis._smod._document;
        this.pid=pid;
        this.responseXML=null;
        this.analysed=false;
        this.sentence_text="";
        this.segment=segment;
        this.clusters=Array();

        this.cl_colors_red=["coral","crimson","darksalmon","deeppink","hotpink","indianred","lightcoral","lightpink","lightsalmon","maroon","mediumvioletred","orangered"];
        this.cl_colors_blue=["aliceblue","cadetblue","cornflowerblue","dodgerblue","honeydew","lightblue","lightcyan","lightskyblue"];
        this.cl_colors_violet=["blueviolet","darkslateblue","darkmagenta","darkorchid","darkslateblue","darkviolet","hotpink","indigo","lavender",
    "magenta","mediumorchid","mediumpurple","mediumslateblue","orchid"]
        this.cl_colors_availible=["coral","cornflowerblue","cadetblue","crimson","chocolate","darkcyan",
    "darkgoldenrod","darkkhaki","darksalmon","darkseagreen","darkturquoise","deeppink","deepskyblue","gold","greenyellow"];
        this.cl_colors_to_use=[...this.cl_colors_red];
    }
    analysis_received=(responseXML)=>
    {
        this.responseXML=responseXML;
        if (responseXML==null)
        {
            this.results=0;   
        }
        else
        {
            this.sentence_text=xp(responseXML,"/cc:total_results/cc:sentence/cc:text");
            this.results=1;//spočítat nějak počet výsledků?
            var cl_it=xpei(responseXML,"/cc:total_results/cc:sentence/cc:clusters/cc:cluster");
            var cluster=null;
            while (cluster=cl_it.iterateNext())
            {
                var hits=Array();
                var hits_xml=xpei(responseXML,"cc:hits/cc:hit",cluster);
                var hit=null;
                while (hit=hits_xml.iterateNext())
                {
                    var w=xp(responseXML,"cc:work",hit);
                    var y=xp(responseXML,"cc:year",hit);
                    var pid=xp(responseXML,"cc:pid",hit);
                    var obj_hit=
                    {
                        year:Number(y),
                        work:w,
                        pid:pid,
                        sentence:""//the texts are not loaded now (it would slow down the whole thing significantly)
                    }
                    hits.push(obj_hit);
                }

                var obj_cluster=
                {
                    _sentence:this,
                    xml:cluster,
                    texts_loaded:false,
                    
                    hits:hits,
                    load_texts(asynchr=true)
                    {
                        var me=this;
                        var texts_received=function(e)
                        {
                            var sentences=xpei(e.responseXML,"/cc:sentences/cc:sentence");
                            var sentence;
                            var i=0;
                            while (sentence=sentences.iterateNext())
                            {
                                if (me.hits[i].pid=sentence.getAttribute("pid"))
                                    me.hits[i].sentence=xp(e.responseXML,"cc:text",sentence);
                                i++;
                            }
                            me.texts_loaded=true;
                            me._sentence.dispatchEvent(new CustomEvent("on_cluster_texts_loaded",{detail:{cluster:me}}));

                        }
						
                        
                        var pids=Array();
                        for (var i=0;i<this.hits.length;i++)
                        {
							if (this.hits[i].sentence=="")
								pids.push("'"+this.hits[i].pid+"'");
                        }
                        if (pids.length>0)
						{
							pids=pids.toString();
							ajax(url+"basex?function=get_sentences&pid§=("+pids+")&p2=true()",texts_received,"GET",null,asynchr);
						}

                    }
                };
                this.clusters.push(obj_cluster);
            }
        }
        this.analysed=true;        
    }
    
    
    
}
