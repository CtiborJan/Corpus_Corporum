/*
 * Struktura HTML elementů je: 
 * nahoře je ovládací lišta vyjmutá ze zbytku modulu (a jedna pro celý modul)
 * Pod ní se nachází flex kontajner obsahující jeden až n instancí třídy document_holder - jeden defaultně, více při synoptickém zobrazení
 * Každý document_holder sestává ze dvou částí: text_section a paratext_section:
 * text_section obsahuje text, tj. třídu page, která se dále dělí na left a right margin a paratext mod=1
 * paratext_section obsahuje principielně totéž a nachází se pod text_section, ale je viditelná jenom při paratext modu = 0.Při mode=1 
 * je paratext zobrazen vedle textu ve speciálním divu.
 * xxx
 */
var cls_text_viewer=true;
class  cls_mod_text_viewer extends cls_mod 
{ 
    constructor(parent_slot,mode=0)
    {
        super(parent_slot,mode);
        this.events=new EventTarget();
        this.mode=mode;//0=single text, 1=synopsis
        this.taskbar_text="T";
        this.taskbar_color="black";
        this.taskbar_bckg_color=taskbar_btn_color;//"rgb(224,205,172)";
        this.parent_slot=parent_slot;
        this.module_name="Text viewer";
        this.module_description="Enables viewing texts";
        this.my_index=this.parent_slot.add_module(this)-1; 
        

        this.module_content_container=div("full_div flex_row",this.module_container);
        var cp_container=div("mod_TxVw_m1_control_panel_container",this.module_content_container);
        this.control_panel_container=cp_container;
        var cp_expand=div("expand",cp_container);
        var cp_expand_chevron=div("chevron contain pos_right float_right padding_10",cp_expand);
      
        this.control_panel=
        {
            container:cp_container,
            div_expand:cp_expand,
            chevron:cp_expand_chevron,

            expand:function()
            {
                this.div_expand.parentNode.classList.toggle("expanded");
                this.chevron.classList.toggle("left");
                for (var i=0;i<this.cps.length;i++)
                    this.cps[i].activate();
            },
            add:function(cp)
            {
                this.cps.push(cp);
                this.container.appendChild(cp.container);
            },
            get:function(name)
            {
                for (var i=0;i<this.cps.length;i++)
                    if (this.cps[i].code_name==name)
                        return this.cps[i];
            },
            clear:function()
            {
                for (var i=0;i<this.cps.length;i++)
                    this.cps[i].container.remove();
                this.cps=Array();
            },
            cps:[]
        }
        this.control_panel.div_expand.onclick=this.control_panel.expand.bind(this.control_panel);

        this.documents=[
            //new cls_TxVw_document_holder(this.div_content_container,this),
            new cls_TxVw_document_holder(this.module_content_container,this)
        ];

        
        //this.control_panel=new cls_control_panel(this,this.cp_strip,"Module",0);
        //var tmp=this.control_panel.add_item(null,"M","Mode");
        

        var mode_selected=function(e)
        {
            me.set_font_size(e.target.id.match(/[0-9]+/)[0]);
        }
        
        

        
        this.synopsis_manager=null;
        
        document.addEventListener("load_text_request",this.loading_text_requested);
        
        this.submodules=[];
        this.load_submodule(new cls_mod_quotation_finder_TextViewerVis(this));
        
    }
    load_submodule=(smod)=>
    {
        for (var i=0;i<this.submodules.length;i++)
            if (this.submodules.name==smod.name)
                return 1;
            
        this.submodules.push(smod);
        
        smod.attach_to_module(this,null);
        
                
    }
    loading_text_requested=(e)=>
    {
        if (this.mode==0)
        {
            e.stopPropagation();
            var focus=e.detail.path_to_focus;
            if ((focus=="" || focus==null) && (e.detail.hash!="" && e.detail.hash!=null))
                focus=e.detail.path + e.detail.hash.replace("#","");
            this.documents[0].load_document(e.detail.path,focus);
            //this.documents[1].text_section.load(e.detail.path,e.detail.path_to_focus);
            this.parent_slot.activate_module(this.my_index);
        }
    }
    set_mode=(mode,synopsis_mode=0)=>
    {//synoptický vs. single-document mód
        this.mode=mode;
        if (this.mode==0)
        {//jeden dokument
            for (var i=1;i<this.documents.length;i++)
            {
                this.documents[i].exit();
                this.documents[i]=null;
            }
            this.documents=this.documents.slice(0,1);
            this.documents[0].super_container.classList.remove("synoptic_mode");

        }
        else
        {//synopse
            for (var i=0;i<this.documents.length;i++)
            {
                this.documents[i].super_container.classList.add("synoptic_mode");
                if (this.documents[i].layout_mode==1)
                    this.documents[i].set_layout(0);
            }
            if (this.synopsis_manager==null)
                this.synopsis_manager=new cls_smod_synopsis_manager(this,synopsis_mode);
            

            
            
        }
    }
    add_new_document=(path_id="",path_to_focus="",synopsis_mode=0)=>
    {//synopsis_mode 1=biblická, 0=default
        if (this.mode==0)
        {
            this.set_mode(1,synopsis_mode);
        }
        
        this.synopsis_manager.add_document(path_id,path_to_focus,synopsis_mode);
        
        
    }
    on_after_document_loaded=(e)=>
    {
        if (this.mode==1)
        {
            if (this.synopsis_manager==null)
                this.synopsis_manager=new cls_smod_synopsis_manager(this);
        }
        
        
        

        this.control_panel.clear();

        if (this.mode==0)
        {
            var doc=this.documents[0].doc;

            var a_idno=doc.meta.author_idno;
            var w_idno=doc.meta.work_idno;
            var c_idno=doc.meta.corpora_idno[0];
            var d=div("control_panel2_content");
            var me=this;
            var d2=div("first_line_indent_m10",d,"Author: ");
            var a=span("underline pointer",d2,doc.meta.author.textContent);
            a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:a_idno}}));};
            d2=div("first_line_indent_m10",d,"Work: ");
            a=span("underline pointer",d2,doc.meta.work.textContent);
            a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:w_idno}}));};
            d2=div("first_line_indent_m10",d,"Corpus: ");
            a=span("underline pointer",d2,doc.meta.corpora[0].textContent);
            a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:c_idno}}));};
            div("",d,"idno: "+doc.meta.cc_idno);
            div("",d,"id: "+doc.meta.cc_id);
            div("",d,"uri: <span class='text_overflow_autoscroll_h'>"+doc.meta.uri+"</span>");

            this.control_panel.add(new cls_control_panel2(this,null,"About the text",d,null,"about"));
    //        this.cp_appearance=new cls_control_panel2(this,this.control_panel_container,"Appearance",null);
    //        this.cp_tools=new cls_control_panel2(this,this.control_panel_container,"Tools",null);


            d=div("control_panel2_content");
            
            var b=create_element("button","",div("",d),"Download as XML");
            b.onclick=
                function(e)
                {
                    window.location=url+"php_modules/download.php?idno="+doc.meta.cc_idno+"&type=file-xml";
                }.bind(this);
            if (doc.meta.has_images==true)
            {//when the text has images, it can be downloaded all as zip archive
                b=create_element("button","",div("",d),"Download XML and images");
                b.onclick=
                function(e)
                {
                    window.location=url+"php_modules/download.php?idno="+doc.meta.cc_idno+"&type=archive-xml-and-data";
                }.bind(this);
            }
            
            
            b=create_element("button","",div("",d),"Download as text file");
            b.onclick=
            function(e)
            {
                window.location=url+"php_modules/download.php?idno="+doc.meta.cc_idno+"&type=file-txt";
            }.bind(this);
            //var d2=create_element("button","",div("",d),"Download as PDF");

            

            this.control_panel.add(new cls_control_panel2(this,null,"Actions",d,null,"actions"));


            d=div("control_panel2_content");
            
            
            var rb=radiobutton2("",div("",d),"Under the text",false,"rbt_ptmode_0","opt-paratext-position",this.set_pt_mode);
            rb=radiobutton2("",div("",d),"Next to the text",false,"rbt_ptmode_1","opt-paratext-position",this.set_pt_mode);
            //rb=radiobutton2("",div("",d),"In the text",false,"","opt-paratext-position",this.set_pt_mode);
            this.control_panel.add(new cls_control_panel2(this,this.control_panel_container,"Paratext",d,null,"paratext"));

            d=div("control_panel2_content");
            rb=radiobutton2("serif",div("",d),"Serif",false,"rbt_font_0",
            "opt-font-type",this.set_font_type);
            rb.dataset["font"]="serif";
            rb=radiobutton2("sans-serif",div("",d),"Sans-serif",false,"rbt_font_1",
            "opt-font-type",this.set_font_type);
            rb.dataset["font"]="sans_serif";
            this.control_panel.add(new cls_control_panel2(this,this.control_panel_container,"Font type",d,null,"font_type"));

            d=div("control_panel2_content");
            rb=radiobutton2("font_75p",div("",d),"Smaller",false,"rbt_font_size_0",
            "opt-font-size",this.set_font_size);
            rb.dataset["font_size"]="smaller";
            rb=radiobutton2("normal",div("",d),"Normal",false,"rbt_font_size_1",
            "opt-font-size",this.set_font_size);
            rb.dataset["font_size"]="default";
            rb=radiobutton2("font_120p",div("",d),"Bigger",false,"rbt_font_size_2",
            "opt-font-size",this.set_font_size);
            rb.dataset["font_size"]="bigger";
            this.control_panel.add(new cls_control_panel2(this,this.control_panel_container,"Font size",d,null,"font_size"));

            
        }

    }
    set_font_size=(size)=>
    {//nastavení velikosti písma pro všechny dokumenty v modulu
        if (typeof(size)=="object")
            if (size.target!=undefined)
                size=size.target.dataset["font_size"];

        var to_remove=Array();
        var to_add=Array();
        if (size=="100" || size=="default")
        {
            this.documents[0].font_size="100";
            to_remove=["font_75p","font_120p"];
        }
        else if (size=="75" || size=="smaller")
        {
            this.documents[0].font_size="75";
            to_add=["font_75p"];
            to_remove=["font_120p"];
        }
        else if (size=="120" || size=="bigger")
        {
            this.documents[0].font_size="120";
            to_remove=["font_75p"];
            to_add=["font_120p"];
        }
        for (var i=0;i<this.documents.length;i++)
        {
            for (var j=0;j<to_remove.length;j++)
            {
                this.documents[i].text_section.text_container.classList.remove(to_remove[j]);
                this.documents[i].paratext_section.paratext_container.classList.remove(to_remove[j]);
            }
            for (var j=0;j<to_add.length;j++)
            {
                this.documents[i].text_section.text_container.classList.add(to_add[j]);
                this.documents[i].paratext_section.paratext_container.classList.add(to_add[j]);
            }
        }   
    }
    font_size_form_activated=(f)=>
    {
        var rbs=f.f.getElementsByTagName("input");
        for (var i=0;i<rbs.length;i++)
            if (rbs[i].id=="rbt_font_size_"+
                this.documents[0].font_size)
                rbs[i].checked=true;    
    }
    set_font_type=(type)=>
    {//nastavení velikosti písma pro všechny dokumenty v modulu
        if (typeof(type)=="object")
            if (type.target!=undefined)
                type=type.target.dataset["font"];

        var to_remove="serif";
        var to_add="sans_serif";
        if (type=="serif")
        {
            to_remove="sans_serif";
            to_add="serif";
        }
        for (var i=0;i<this.documents.length;i++)
        {
            this.documents[i].text_section.text_container.classList.remove(to_remove);
            this.documents[i].paratext_section.paratext_container.classList.remove(to_remove);
            this.documents[i].text_section.text_container.classList.add(to_add);
            this.documents[i].paratext_section.paratext_container.classList.add(to_add);
        }   
        this.documents[0].font_type=to_add;
    }
    set_pt_mode=(e)=>
    {
        for (var i=0;i<this.documents.length;i++)
        {
            if (e.target.id=="rbt_ptmode_0" || e==0)
                this.documents[i].set_layout(0);
            else if (e.target.id=="rbt_ptmode_1" || e==1)
                this.documents[i].set_layout(1);
        }
    }

    
    font_type_form_activated=(f)=>
    {
        var rbs=f.f.getElementsByTagName("input");
        for (var i=0;i<rbs.length;i++)
            if (rbs[i].id=="rbt_font_type_"+
                this.documents[0].font_type)
                rbs[i].checked=true;    
    }
    pt_mode_form_activated=(f)=>
    {
        var rbs=f.f.getElementsByTagName("input");
        for (var i=0;i<rbs.length;i++)
            if (rbs[i].id=="rbt_ptmode_"+this.documents[0].layout_mode)
                rbs[i].checked=true;    
    }
    
    
    
}
class cls_smod_default_synopsis
{
}



class cls_smod_synopsis_manager
{
    /*  Jaké mohou nastat případy?
        Jde o identické texty (ve smyslu CC, tj. stejné cc_idno)
        Jde o jiné texty, ale stejné dílo, tj. dvě různé verze téhož
        Jde o jiná díla. Ale i ta si mohou odpovídat. Může jít o:
            - stejné dílo, jen jako takové neidentifikované
            - nějakou verzi díla, ale strukturálně blízkou (překlad apod.)
            - jedno dílo je čstí jiného
            - jde o docela jiné texy, kde nějaké srovnání není rozumně možné
     */
    
    constructor(TxVw,synopsis_type=0)//0=default, for any documents, 1=biblical
    {
        this.TxVw=TxVw;//parent (text viewer module)
        this._documents=this.TxVw.documents;//reference to documents opened in textviewer
        this.synopseis=Array();
        if (this.TxVw.documents.length>0)
        {//existující dokument musí být také převeden do synoptického zobrazení
            this.open_slot(synopsis_type,0);
        }
        this.create_synoptic_control_strip();
    }
    create_synoptic_control_strip=()=>
    {
        //při synoptickém zobrazení se kontorlní panely přesunou před první document
        this.cp_container=div("mod_TxVw_m1_control_panel_container");
        this.TxVw.module_content_container.insertBefore(this.cp_container,this.TxVw.module_content_container.childNodes[0]);
        //this.control_panel=new cls_control_panel(this.cp_container,this);
        this.cp_container.appendChild(this.TxVw.control_panel_container);

        for (var i=0;i<this.synopseis.length;i++)
        {
            this.synopseis[i].control_panel.moved();
        }
    }
    create_synopsis=(mode)=>
    {
        if (mode==0)
            return new cls_smod_default_synopsis();
        else if (mode==1)
            return new cls_smod_biblical_synopsis(this);
    }
    open_slot=(synopsis_mode=0,add_to_existing=-1)=>
    {
        if (add_to_existing==-1)
        {//vytváříme opravdu nový dokument (tj. nerecyklujeme nějaký už otevřený)
            var new_document_holder=new cls_TxVw_document_holder(this.TxVw.module_content_container,this.TxVw);
            this._documents.push(new_document_holder);
        }
        else
            new_document_holder=this._documents[add_to_existing];
        
        //nejprve si zjistíme, jestli už synopse, kterou chceme použít, existuje, příp. ji vytvoříme
        var synopsis_to_use=null;
        for (var i=0;i<this.synopseis.length;i++)
        {
            if (this.synopseis[i].synopsis_mode==synopsis_mode)
                synopsis_to_use=this.synopseis[i];
        }
        if (synopsis_to_use==null)
        {
            synopsis_to_use=this.create_synopsis(synopsis_mode);
            this.synopseis.push(synopsis_to_use);
        }
        new_document_holder.synopsis=synopsis_to_use;
        
        new_document_holder.super_container.classList.add("synoptic_mode");
        
        
        if (synopsis_mode==1)//biblical synopsis
        {
            new_document_holder.super_container.classList.add("biblical_synopsis");
        }
        synopsis_to_use.add_document(new_document_holder);

        new_document_holder.set_layout(2);
        return new_document_holder;
    }
    add_document=(path_id,path_to_focus,synopsis_mode)=>
    {//přidá dokument do obecné synopse
        var ndh=this.open_slot(synopsis_mode);
        if (path_id!="")
            ndh.load_document(path_id,path_to_focus);
    }

    
    on_document_scrolled=(index)=>
    {
        /*
         * došlo k posunu nějakého dokumentu: zkontrolujeme, které jsou další
         * s ním případně spojené a posuneme je také.
         */
        
    }
    on_document_loaded=(index)=>
    {
        /*
         * byl nahrán nějaký dokument: pokud má tento index nějaká spojení,
         * musíme je prověřit a:
         * 1) pokud jde o biblickou synopsi, nahrát příslušný druhý dokument
         * 2) v dalším případě posoudit, zda může jít o srovnatelný text, příp. se zeptat uživatele
         */
    }
    on_document_page_mousemove(e)
    {/* this=document, in which the event occured
        box pro srovnání dokumentů podle aktuální řádky
     */
        var line_top=null;
        if (e.rangeParent!=undefined)
        {//firefox
            var r=document.createRange();
            r.setStart(e.rangeParent,e.rangeOffset);
            r.setEnd(e.rangeParent,e.rangeParent.length);
            var rects=r.getClientRects();
            line_top=rects[0].y;
        }
        else
        {//everything else :-(
            var chn=e.target.childNodes;
            var r=document.createRange();
            for (var i=0;i<chn.length;i++)
            {
                if (chn[i].nodeName=="#text")
                {
                    r.setStart(chn[i],0);
                    r.setEnd(chn[i],chn[i].length);
                    var rects=r.getClientRects();
                    for(var j=0;j<rects.length;j++)
                    {
                        if (e.clientY>=rects[j].y && e.clientY<=rects[j].y+rects[j].height)
                        {
                            if (e.clientX>=rects[j].x && e.clientX<=rects[j].x+rects[j].width)
                            {
                                line_top=rects[j].y;
                                break;
                            }
                        }
                    }
                    if (line_top!=null)
                        break;
                }
            }
        }
        this.align_button.style.top=this.__tpages[0].container.parentNode.scrollTop+line_top-82;
    }
    align_two_documents=(d1,d2,method=0)=>
    {
        //this function tries to find similarities in the structure of the two documents and according to them manage their scrolling
        
        var get_hlvls=function(d)
        {//hlvls=hierarchy levels
            var rv=Array();
            var i=0;
            var go_deeper=false;
            do
            {
                go_deeper=false;
                var hlvl=d.text_xml.getElementsByClassName("hlvl_"+i);
                if (hlvl.length>0)
                {
                    rv.push(hlvl);
                    go_deeper=true;
                    i++;
                }
            }while(go_deeper==true);
            return rv;
        };
        var numerize_hlvls=function(hlvls)
        {
            var rv="";
            for (var i=0;i<hlvls.length;i++)
            {
                rv+=hlvls[i].length;
                if (i<hlvls.length-1)
                    rv+="-";
            }
            return rv;
        };
        var d1_hlvls=get_hlvls(d1);
        var d1_nhlvls=numerize_hlvls(d1_hlvls);
        var d2_hlvls=get_hlvls(d2);
        var d2_nhlvls=numerize_hlvls(d2_hlvls);
        

        
        var find_semantic_anchors=function(a_hlvl,b_hlvl)
        {
            //semantic way - we try to find same groups of words
            
        }
        find_semantic_anchors(d1,d1_hlvls[1]);
        
    }
   
    
}


class cls_control_panel
{
    constructor(parent_module,panels_strip=null,panel_name="",before=-1)
    {
        this._parent=parent_module;
        this._cp_strip=this._parent.control_panel_container;

        this.container=div("control_panel_container",null);
        if (before==-1)
            this._cp_strip.appendChild(this.container);
        else
            this._cp_strip.insertBefore(this.container,this._cp_strip.childNodes[before])
            
        this.panel=div("control_panel",this.container);
        this.items=Array();
        
        this.panel_name=panel_name;
        this.opened_form=null;

        this._cp_strip.parentElement.addEventListener("mouseover",this.activate_panel_1);
        this._cp_strip.parentElement.addEventListener("mouseleave",this.deactivate_panel);
        this.activating_element=this._cp_strip.parentElement;
    }
    add_item=(item=null,button_innerHTML="",label,fn=null)=>
    {
        if (item!=null)
            this.items.push(item);
        else
            this.items.push(new cls_control_panel_item(this,button_innerHTML,label,fn));

        return this.items[this.items.length-1];
    }
    activate_panel_1=(e)=>
    {
        this.container.classList.add("cp_activate");
    }
    deactivate_panel=(e)=>
    {
        for (var i=0;i<this.items.length;i++)
        {
            this.items[i].button_clicked(false);
        }
        this.container.classList.remove("cp_activate");
    }
    remove_panel=(e)=>
    {
        this.container.remove();
    }
    open_form=(f)=>
    {
        f.activated();
    }
    hide_form=()=>
    {
        /*if (this.opened_form!=null)
            this.opened_form.remove();*/
    }
    moved=()=>
    {
        this.activating_element.removeEventListener("mouseover",this.activate_panel_1);
        this.activating_element.removeEventListener("mouseleave",this.deactivate_panel);
        this._cp_strip.parentElement.addEventListener("mouseover",this.activate_panel_1);
        this._cp_strip.parentElement.addEventListener("mouseleave",this.deactivate_panel);
        
        this.activating_element=this._cp_strip.parentElement;
    }
    hide=()=>
    {
        this.container.classList.add("display_none");
    }
    no_opacity=()=>
    {//někdy chceme, aby byl panel intenzivně vidět pořád
        this.panel.style.opacity=1;
    }
}
class cls_control_panel_item
{
    constructor(control_panel,button_innerHTML,label="",fn=null)
    {
        this.button=div("control_panel_btn",null,button_innerHTML);
        this._cp=control_panel;
        control_panel.panel.insertBefore(this.button,control_panel.bottom_btn); 
        //this.label=div("control_panel_btn_label",this.button,label);
        this.button.title=label;
        this.button.addEventListener("click",this.button_clicked);
        this.tools_form=null;
        this.fn=fn;
    }
    add_tools_form=(form)=>
    {
        this.tools_form=form;
        this.button.appendChild(form.f);
    }
    button_clicked=(e)=>
    {//e==false = záměrné zavolání procedury pro "vypnutí" všech otevřených panelů
        if (this.tools_form!=null)
        {
            if (this.button.classList.contains("cp_btn_activated") || e===false )
            {
                this.button.classList.remove("cp_btn_activated");
                this._cp.hide_form();
            }
            else
            {
                var btns=this._cp.container.getElementsByClassName("control_panel_btn");
                for (var i=0;i<btns.length;i++)
                {//deaktivujeme případné jiné aktivované tlačítko
                    btns[i].classList.remove("cp_btn_activated");
                }
                this.button.classList.add("cp_btn_activated");
                this._cp.open_form(this.tools_form);
            }
        }
        if (this.fn!=null && e!=false)
            this.fn();
    }
}
class cls_tools_form_basis
{
    constructor(label,activating_button)
    {
        this.f=div("control_panel_form_basis",null);
        this.l=div("bold text_align_center",this.f,label);
    }
    activated=()=>
    {

    }
}



class cls_control_panel2
{
    constructor(parent_module,cp_container,name,
        content=null,on_activate_function=null,
        code_name="")
    {
        this.parent_module=parent_module;
        this.name=name;
        this.container=div("control_panel2",cp_container)
        this.title=div("control_panel2_title",this.container,name);
        this.append_content(content);
        this.on_activate=on_activate_function;
        this.code_name=code_name;

    }
    append_content=(content)=>
    {
        this.content=content;
        if (content!=null)
            this.container.appendChild(content);
    }
    activate=()=>
    {
        if (this.on_activate!=null)
            this.on_activate;
    }
}


















class cls_paratext extends EventTarget
{/*
    vrstva mezi "fyzickými" (html) objekty modulu a daty paratextu (=source). 
    Zajišťuje zobrazování jednotlivých druhů paratextu, jejich adaptaci na změnu layoutu atd.
    Samotné zobrazování si ale musí každý paratext řešit sám, protože každý je jiný... (?)
    */
    constructor(_source,_document,name)
    {
        super();
        this.using_paratext=true;
        this.name=name;
        this._document=_document;
        this.div=div("",null); //div containing the paratext, which can be appended to different places (under/next to the text)
        //span("",this.div,name);
        this._source=_source;
        this.mode=0;
        this.ev=new EventTarget();
        if (_source!=null)
            if (this._source.paratext_organizer_set!=undefined)
                this._source.paratext_organizer_set(this);
        this.initialized=false;

        
    }
    show=()=>
    {
        
        this.visible=true;
        this.div.classList.remove("display_none");
        if (this._source!=null)
            if (this._source.display!=undefined)    
                this._source.display(this.mode);
        
    }
    hide=()=>
    {
        this.visible=false;
        this.div.classList.add("display_none");
    }
    layout_mode_set=(mode)=>
    {
        this.mode=mode;
        if (mode==0)
            this._document.__ptpages[0].text_body.appendChild(this.div);
        else
            this._document.__tpages[0].obj_inpage_paratext.container.appendChild(this.div);
        
        this.dispatchEvent(new CustomEvent("onlayout_mode_change",{detail:mode}));
        
    }

    initialize=(mode)=>
    {
        if (this.initialized==false && this._source!=null)
        {
            if (this._source.apparatus_initialize!=undefined)
                this._source.apparatus_initialize(mode);
        }

    }
    


}
class cls_TxVw_apparatus
{
    constructor(_document,_paratext_organizer=null,apparatus_xml=null)
    {
        this._document=_document;
        this.items=[];
        this.anchors=[];
        this.already_displayed=false;
        this.exists=false;
        
        this.previously_highlighted=null;
        this.timeout_id=null;

        if (apparatus_xml!=null)
            this.apparatus_xml_set(apparatus_xml);
        
        if (_paratext_organizer!=null)
            this.paratext_organizer_set(_paratext_organizer);
    }
    apparatus_xml_set(apparatus_xml)
    {
        this.apparatus_xml=apparatus_xml;
        this.items=this.apparatus_xml.getElementsByClassName("paratext_item");
        this.exists=(this.items.length>0);
    }

    paratext_organizer_set(_paratext_organizer)
    {
        this._paratext_organizer=_paratext_organizer;
        this._container=_paratext_organizer.div;

        this._paratext_organizer.addEventListener("onlayout_mode_change",this.paratext_adjust);
        this._paratext_organizer.addEventListener("on_page_width_change",this.paratext_adjust);
    }
    apparatus_initialize=(mode)=>
    {

        if (this._document.doc.text_html_node!=null && this.apparatus_xml!=null)
        {//the layout mode can be set even before the text is displayed and all objects initialized
            if (this.already_displayed==false)
            {
                //first we must remove empty sections. They are due to some errors in XSLT, which has sometimes serious issues with creating (and closing) empty elements
                /*or rather, it would be extremely demanding to calculate in advance, on which page (because the pages are not
                 the main organizational structure of the TEI documents) there is/is not an apparatus entry, so sections
                 are created for all pages and that ones, which remain empty, must be removed now*/
                var to_delete=[];
                var sections=this.apparatus_xml.getElementsByClassName("paratext_section");
                for (var i=0;i<sections.length;i++)
                {
                    if (sections[i].nextSibling!=null)
                        if (sections[i].nextSibling.isSameNode(sections[i+1]))
                        {
                            to_delete.push(sections[i]);
                        }
                }
                for (var i=0;i<to_delete.length;i++)
                    to_delete[i].remove();

                this._container.innerHTML=this.apparatus_xml.innerHTML;

                this._document.obj_images.process_img_errors(this._container);

                this.already_displayed=true;
                
                //we must remove ev. empty sections (which must be there, otherwise the XSLT results in nonsenses...)


                this.items=this._container.getElementsByClassName("paratext_item");
                this.set_anchors();
            }
            if (mode==0)//paratext under the main text
            {
                

            }
            else if (mode==1)//paratext next to the main text
            {
                
            }
        }

    }
    paratext_adjust=(e)=>
    {
        if (this._paratext_organizer.mode==1)
        {
            var inpage_paratext=this._document.__tpages[0].obj_inpage_paratext;
            var items_content_height=Array(this.items.length);
            var items_top=Array(this.items.length);
            
            //uložíme si výšky obsahuj jednotlivých prvků, abychom mohli pracovat i při skrytém kontajneru (a tedy mnohem rychleji)
            for (var i=0;i<items_content_height.length;i++)
            {
                items_content_height[i]=this.items[i].offsetHeight;
            }
            
            inpage_paratext.container.classList.add("display_none");
            inpage_paratext.tmp_placeholder.classList.remove("display_none");
        
            if (this.anchors.length>0)
            {
                var lowest=0;
                var prev_offsetTop=0;
                var nr_overlapping=0;
                
                //this.paratexts=Array(anchors.length);
                for (var i=0;i<this.anchors.length;i++)
                {//procházíme jednotlivé kotvy v hlavním textu a k nim příslušné položky v paratextu, kterých musí být vždy stejně
                    
                    //uložíme k prvkům informaci o jejich indexu v poli, ať ji později nemusíme složitě zjišťovat
                    if (this.anchors[i].dataset["index"]==null)
                        this.anchors[i].dataset["index"]=i;
                    if (this.items[i].dataset!=null && this.items[i].dataset["index"]==null)
                        this.items[i].dataset["index"]=i;
                    
                    //nastavíme hořejšek paratextu stejně s kotvou
                    if (this.items[i].style!=undefined)
                        this.items[i].style.top=this.anchors[i].offsetTop;
                    items_top[i]=this.anchors[i].offsetTop;
                        
                    //projdeme předchozí prvky, jejichž kotva (protože prvek samotný se může o trochu posunout - těch 6 px níže) je na stejné úrovni jako předchozí prvek, pokud ten není na stejné úrovni jako aktuální,
                    //(tj. pokud je na řádku 1 n kotev a my se posuneme k první kotvě na řádku 2, projdeme všechny tyto kotvy na řádku 1 (resp. jim odpovídající prvky))
                    for (var j=i-1;j>=0 && this.anchors[j].offsetTop==prev_offsetTop && this.anchors[j].offsetTop!=this.anchors[i].offsetTop;j--)
                    {
                        //a pokud je jejich vnitřní (resp. ideální) výška větší než aktuálně pomocí maxHeight omezená výška prvku...
                        if (items_content_height[j]>this.items[j].offsetHeight)
                        {
                            //roztáhneme je na celý volný prostor (resp. jejich maxHeight)
                            this.items[j].style.maxHeight=(this.anchors[i].offsetTop-this.anchors[j].offsetTop-10)+"px";
                            break;//resp. toto provedeme jenom s tou poslední v řadě.
                        }
                    }
                    
                    
                    //překrývání: pokud je horní hrana aktuálního prvku stejně vysoko jako v případě předchozího nebo je výše než je zatím nejnižší bod předchozích prvků...
                    if (this.anchors[i].offsetTop==prev_offsetTop || this.anchors[i].offsetTop<lowest)
                    {
                        //posuneme prvek trochu dolu
                        nr_overlapping++;
                        this.items[i].style.marginTop=/*anchors[i].offsetTop+*/(6*nr_overlapping)+"px";
                    }
                    else
                        nr_overlapping=0;
                    
                    //spočítáme případně nově nejnižší bod
                    if (this.items[i].offsetTop+this.items[i].offsetHeight>lowest)
                    {
                        lowest=this.items[i].offsetTop+this.items[i].offsetHeight;
                    }
                    //zapamatujeme si úroveň aktuální kotvy
                    prev_offsetTop=this.anchors[i].offsetTop;
                
                    //nastavíme posluchače událostí...
                    this.items[i].onmouseenter=this.mouseenter_ptitem.bind(this._document.obj_paratext);
                    this.items[i].onmouseleave =this.mouseleave_ptitem.bind(this._document.obj_paratext);
                    
                }
            }
            inpage_paratext.tmp_placeholder.classList.add("display_none");
            inpage_paratext.container.classList.remove("display_none");
        }
        B.sandglass.close();
        
    }

    set_anchors=()=>
    {
        this.anchors=this._document.doc.text_html_node.getElementsByClassName("paratext_anchor");
        for (var i=0;i<this.anchors.length;i++)
        {
            this.anchors[i].dataset["index"]=i+1;
            this.anchors[i].onmouseover=this.mouseover_anchor.bind(this);
            this.anchors[i].onmouseleave=this.mouseleave_anchor.bind(this);
            this.anchors[i].onclick=this.mouseclick_anchor.bind(this);
        }
        
    }
    mouseover_anchor=(e)=>
    {
        
        var item=this.get_item_by_index(e.currentTarget.dataset["index"]);
        this.remove_highlight();

        item.classList.add("pt_highlighted");
        this.previously_highlighted=item;
    }
    mouseleave_anchor=(e)=>
    {
        this.remove_highlight();
    }
    mouseclick_anchor=(e)=>
    {
        var index=e.currentTarget.dataset["index"]-1;
        this._document.obj_paratext.move_to_view(index);
    }
    mouseenter_ptitem=(e)=>
    {//pohyb nad položkou paratextu, jedno, kde: zvýrazníme příslušnou kotvu
        //a u modu 1 ještě spustíme časovač na "vyzvednutí" položky do popředí
        if (e.target.classList.contains("pt_highlighted"))
            return 0;
        //document.title+="e";
        var index=Number(e.currentTarget.dataset["index"])+1;
        
        if (this._document.layout_mode==1)
        {//paratext vedle textu: spustíme odložené vyzdvihnutí do popředí (aby měl uživatel možnost 
            // přejet na nějakou položku "uvnitř" aktuální velké
            this.remove_highlight();
            if (this.timeout_id!=null)
                window.clearTimeout(this.timeout_id);
            this.timeout_id=window.setTimeout(this.bring_to_foreground,300,e.currentTarget);
        }
        /*if (this.ptitem_highlight_anchor!=undefined)
            //if this.ptitem_highlight_anchor.parentNode
            this.ptitem_highlight_anchor.remove()
        if (this._document.layout_mode==0)
        {
            this.ptitem_highlight_anchor=div("pt_hightlight_anchor",e.currentTarget);
            div("pt_highlight_anchor_arrow",this.ptitem_highlight_anchor,"↑");
            this.ptitem_highlight_anchor.onclick=this.center_anchor_in_view.bind(this);
        }*/
        
        //this.anchors[index].classList.add("pt_highlighted");
        
        
    }       
    mouseleave_ptitem=(e)=>
    {
        if (e.currentTarget.parentNode.id==e.target.id)
            document.title+="l";
        this.remove_highlight()
    }
    bring_to_foreground=(item)=>
    {//opožděné vyzdvižení prvku před ostatní
        window.clearTimeout(this.timeout_id);
        this.timeout_id=null;
        item.classList.add("pt_highlighted");
    }
    remove_highlight=()=>
    {
        var h=this._container.getElementsByClassName("pt_highlighted");
        while (h.length!=0)
            h[0].classList.remove("pt_highlighted");

    }


    get_item_by_index=(index)=>
    {
        for (var i=0;i<this.items.length;i++)
            if (this.items[i].id=="pt_"+index)
                return this.items[i];
    }
    show_hide_apparatus_as_title=(show)=>
    {
        for (var i=0;i<me.__anchors.length;i++)
        {/*pro zobrazení/skrytí aparátu jako title nad kotvami v textu (při modu 1, tj. vedle textu, to nepotřebujeme a nechceme)*/
            var paratext_item_nr=me.__anchors[i].getElementsByClassName("paratext_item_nr")[0];
            
            
            if (show==true)
            {
                if (paratext_item_nr.dataset["title"]!=undefined && paratext_item_nr.title=="")
                {
                    paratext_item_nr.title=paratext_item_nr.dataset["title"];
                    paratext_item_nr.dataset["title"]="";
                }
            }
            else
            {
                paratext_item_nr.dataset["title"]=paratext_item_nr.title;
                paratext_item_nr.title="";
            }
            
        }
    }
    
}

class cls_TxVw_document_holder extends EventTarget
{//pro umožnění synoptického pohledu: každý text využívá jeden document holder
    static counter=0;
    constructor(container, parent, layout_mode=0)
    {
        super();
        this.super_container=div("mod_TxVw_one_document_container",container);//obsahuje "adresní řádek" + samotný obsah
        this.container=div("mod_TxVw_content_container",this.super_container);//obsahuje "ovládací panel" + obsah
        this.address_bar=div("mod_TxVw_upper_bar",this.super_container);
        this._parent=parent;
        this._module=parent;
        
        this.milestones=null;
        this.__tpages=Array();
        this.__ptpages=Array();
        

        

        this.layout_mode=layout_mode;
        this.font_size="100";
        this.font_type="sans_serif";
        
        
        this.id="cls_TxVw_document_holder:"+cls_TxVw_document_holder.counter;
        cls_TxVw_document_holder.counter++;

        
        this.text_section=new cls_TxVw_text_section(this.container,this,this);
        this.paratext_section=new cls_TxVw_paratext_section(this.container,this);
        if (this.layout_mode==1)
        {
            this.paratext_section.hide();
            //this.__tpages[0]
        }
        
        this.vnavigation=new cls_TxVw_vertical_navigation(this.text_section.nav_container,this);
        this.position_indicator=div("mod_TxVw_position_indicator",this.address_bar);
        
    }
    remove=()=>
    {
        this.close_document();
        this.super_container.remove();
    }
    
    load_document=(path_id,path_to_focus)=>
    {
        this.close_document();//zavřeme předchozí otevřený dokument, je-li, a vyčistíme html
        if (path_id=="")
            return 0;
        var me=this;
        this.xml=null;
        this.loaded_pid=path_id;
        this.path_to_focus=path_to_focus;
        


        var process_text=function(e)
        {

            me.xml=e.responseXML;
            me.text_xml=e.responseXML.getElementsByTagName("response_text")[0];
            me.apparatus_xml=e.responseXML.getElementsByTagName("response_paratext")[0];
            me.table_of_contents_xml=xpe(me.xml,"/cc:xml_response/cc:response_meta/cc:table_of_contents");
            

           

            //milestones
            var ms=me.text_xml.getElementsByTagName("milestone_settings");
            for (var i=ms.length-1;i>=0;i--)
                ms[i].remove();


            me.obj_context_selection.init();
            

            me.doc=
            {
                //objekt udržující samotná data nahraného textu
                meta:
                {
                    text_name:"",
                    author:null,
                    author_idno:null,
                    work:null,
                    work_idno:null,
                    text:null,
                    text_idno:null,
                    corpora:Array(),
                    corpora_idno:Array(),
                    work_date:null,
                    author_date:null,
                    stats:null,
                    cc_id:null,
                    cc_idno:null,
                    has_images:false,
                    not_loaded_sections:null,
                    last_loaded_section_head:"",
                    decisive_year:0,
                    author_years:Array(),
                    work_year:Array()
                },
                not_loaded_higher_levels:null,
                apparatus:new cls_TxVw_apparatus(me,null,me.apparatus_xml)
                
                
            };
            
            me.doc.meta.text_name=xp(me.xml,"cc:xml_response/cc:response_meta/cc:text");
            url="https://mlat.uzh.ch/";
            window.history.pushState(null,me.doc.meta.text_name,url+"browser/"+path_id);
            
            //extrahujeme si údaje o textu
            var cps=xpei(me.xml,"cc:xml_response/cc:response_meta/cc:corpus");
            var c,arr_c=Array(),arr_c_s="";
            while (c=cps.iterateNext())
            {
                arr_c.push(c);
                arr_c_s+="cps_"+c.attributes.nr.textContent+".";
            }
            me.doc.meta.corpora=arr_c;
            me.doc.meta.author=xpe(me.xml,"cc:xml_response/cc:response_meta/cc:author");
            me.doc.meta.author_years=[Number(me.doc.meta.author.getAttribute("year1")),
                Number(me.doc.meta.author.getAttribute("year2"))];


            me.doc.meta.work=xpe(me.xml,"cc:xml_response/cc:response_meta/cc:work");
            me.doc.meta.text=xpe(me.xml,"cc:xml_response/cc:response_meta/cc:text");

            me.doc.meta.text_idno=me.doc.meta.text.getAttribute("cc_idno");
            me.doc.meta.work_idno=me.doc.meta.work.getAttribute("cc_idno");
            me.doc.meta.work_year=Number(me.doc.meta.work.getAttribute("year"));

            //years!!! - dost provizorium, nutno vyřešit nějak systematičtěji
            if (me.doc.meta.work_year!=0 && me.doc.meta.work_year!=10000)
                me.doc.meta.decisive_year=me.doc.meta.work_year;
            else
            {
                if (me.doc.meta.author_years[1]!=0 && me.doc.meta.author_years[1]!=10000)
                    me.doc.meta.decisive_year=me.doc.meta.author_years[1];
                else
                    me.doc.meta.decisive_year=me.doc.meta.author_years[0];  
            }
            
            //#####xxxx

            me.doc.meta.author_idno=me.doc.meta.author.getAttribute("cc_idno");
            for (var i=0;i<me.doc.meta.corpora.length;i++)
                me.doc.meta.corpora_idno.push(me.doc.meta.corpora[i].getAttribute("cc_idno"));
            me.doc.meta.cc_idno=xp(me.xml,"cc:xml_response/cc:response_meta/cc:item/cc:cc_idno");
            me.doc.meta.cc_id=xp(me.xml,"cc:xml_response/cc:response_meta/cc:item/cc:cc_id");

            if (me.doc.meta.cc_id!="")
                me.doc.meta.uri=me.doc.meta.cc_id
            else
                me.doc.meta.uri=path_id;
            me.doc.meta.uri=B.host+"/browser/"+me.doc.meta.uri;

            if (xp(me.xml,"cc:xml_response/cc:response_meta/cc:data_url")!="")
            {
                me.doc.meta.has_images=true;
            }

            me.obj_paratext.paratexts=[];
            if (me.doc.apparatus.exists==true)  
                me.obj_paratext.paratexts.push(new cls_paratext(me.doc.apparatus,me,"Apparatus",true));

            

            //we must create paratext organizers for all submodules that need it
            for (var i=0;i<me._module.submodules.length;i++)
            {
                var smod=me._module.submodules[i];
                if (smod.using_paratext!=undefined)
                    if (smod.using_paratext==true)
                    {
                        var pt=me.obj_paratext.add_paratext(smod,smod.name);
                        if (smod.paratext_organizer_set!=undefined)
                            smod.paratext_organizer_set(pt);
                    }
            }

            
            var nls=xpei(me.xml,"cc:xml_response/cc:response_meta/cc:heads/cc:head");
            var section;
            var not_loaded_sections=Array();
            while (section=nls.iterateNext())
            {
                if (section.attributes["pid"].textContent!=me.doc.meta.cc_idno)
                    not_loaded_sections.push({head:section.textContent,pid:section.attributes["pid"].textContent})
            }
            me.doc.meta.not_loaded_sections=not_loaded_sections;

            if (path_id!=me.doc.meta.cc_idno)
            {
                var rv=xp(me.xml,"cc:xml_response/N:response_text//N:div[@class!='text'][1]/N:*[@class='head']");
                if (rv!=undefined)
                {
                    var rg=/\n|\W{2,}/g;
                    rv=rv.replaceAll(rg," "); 
                    me.doc.meta.last_loaded_section_head=rv.trim();
                }
            }

            me.display();


            me.doc.milestones_sets=Array();
            me.doc.milestones_sets.push(new cls_TxVw_milestones_set(me))//vytvoříme defaultní hierarchické milestony

            //a někdy v budoucnu i další
            
            me._module.on_after_document_loaded(null);
            if (me.synopsis!=undefined && me.synopsis!=null)//pokud jde o dokument v synopsi, upozorníme synopsi, že nahrání je hotové
                me.synopsis.on_after_document_loaded(me);
            /*me.parent.milestones=new cls_milestones(e.responseXML.getElementsByTagName("milestone_settings"),me.parent.__text,me.parent);
            var ms=me.__text.getElementsByTagName("milestone_settings");
            for (var i=ms.length-1;i>=0;i--)
                ms[i].remove();
            */
            //me.v_nav=new cls_TxVw_vertical_navigation(me.nav_container,me);
            
            //me.vnavigation.add_hierarchy_level(1,true,"12733:I.1");


            me.doc.text_html_node.onmousemove=me.obj_mouse_activity.on_mouse_move.bind(me.obj_mouse_activity);
            me.doc.text_html_node.onmouseleave=me.obj_mouse_activity.on_mouse_leave;

            me.obj_paratext.initialize_all();
            me.obj_paratext.mode_set(0);
        
            me.obj_paratext.show_paratext(0);

            me.set_layout(me.layout_mode);
            
            me.vnavigation.clear();
            me.vnavigation.add_hierarchy_level(0,true);


            //scroll to given position
            if (me.doc.meta.cc_id!="" && me.path_to_focus!=null)
                me.path_to_focus=me.path_to_focus.replace(me.doc.meta.cc_id,me.doc.meta.cc_idno);
            if (me.path_to_focus!="")
                me.obj_scrolling.scroll_to_pid(me.path_to_focus);
            
        }
        url="https://mlat.uzh.ch/";
        ajax(url+"php_modules/display_text.php?ajax=true&path="+path_id,process_text);
    }
    close_document=()=>
    {
        this.__tpages[0].clean();
        this.__ptpages[0].clean();
        this.xml=null;
        this.text_xml=null;
        this.apparatus_xml=null;
        this.loaded_pid="";
        this.doc=null;
        this.paratexts=[];
    }
    exit=()=>
    {//zavíráme dokument včetně ovládacích prvků
        this.close_document();
        this.container.remove();
    }
    display=(e)=>
    {
        this.position_indicator.innerHTML="";
        this.doc.text_html_node=this.__tpages[0].set_text_html(this.text_xml.innerHTML);
        
        this.obj_position_bar.init();

        this.obj_document_navigation.init();

        this.obj_mouse_activity.init();
        
        this.obj_position_bar.print_static_position();

        this.obj_title_page.init();

        this.doc.apparatus.set_anchors();
        
        
    }
    set_layout=(mode)=>
    {
        //případ, že text nemá vůbec paratext, vyřešíme zde...
        


        var me=this;
        
        this.layout_mode=mode;

        /*if (this.has_apparatus==false)
        {
            this.paratext_section.section_container.classList.add("no_paratext");
            mode=0;
            span("l_margin_10",this.paratext_section.pages[0].text_body,"(no apparatus) ");
            span("horizontal chevron btn s20x20",this.paratext_section.pages[0].text_body).onclick=
                    function(){me.paratext_section.section_container.classList.add("display_none")};
            return 0;
        }
        else
            this.paratext_section.section_container.classList.remove("no_paratext");
        */
       
        if (mode==0)
        {//paratext under the main text

            //this.__ptpages[0].set_text_html(this.apparatus_xml.innerHTML);
            this.__tpages[0].obj_inpage_paratext.hide();
            //this.__ptitems_container=this.__ptpages[0].container;
            this.paratext_section.display();
            /*this.__ptitems=this.__ptpages[0].container.getElementsByClassName("paratext_item");
            for (var i=0;i<this.__ptitems.length;i++)
            {
               this.__ptitems[i].dataset["index"]=i;
               this.__ptitems[i].onmouseenter=this.obj_paratext.mouseenter_ptitem.bind(this.obj_paratext);
               this.__ptitems[i].onmouseleave=this.obj_paratext.mouseleave_ptitem.bind(this.obj_paratext);
            }*/
            

            
        }
        else if (mode==1)
        {//paratext next to the main text
            this.__tpages[0].obj_inpage_paratext.display();
            /*this.__ptitems_container=this.__tpages[0].obj_inpage_paratext.container;*/
            this.paratext_section.hide();
            
            /*skryjeme title u kotev: protože při tomto zobrazení je vždy, když je vidět kotva, vidět i paratext, 
               a u velkých poznámek může title překrývat i zvýrazněnou poznámku.
                */ 
            //show_hide_apparatus_as_title(false);
        }
        else if (mode==2)//paratext as tool tip text in the text
        {
            this.paratext_section.hide();
            this.__tpages[0].obj_inpage_paratext.hide();
            //show_hide_apparatus_as_title(true);
        }
        for (var i=0;i<this.paratexts.length;i++)
        {
            this.paratexts[i].layout_mode_set(mode);   
        }
        this.obj_paratext.mode_set(mode);
    }

    obj_images=
    {
        _document:this,
        on_img_error(e)
        {/* when an image is not loaded, the empty <img> can grow to extreme
            height (100% of the parent) for some reason (havent found out why). This function 
            sets in that case max height to 50px */
            e.target.style.height="50px";
            if (e.target.dataset["tried_again"]==null)
            {
                e.target.alt="Image could not be loaded. Click to try to reload it."
                e.target.addEventListener("click",
                   function(e)
                   {/*sometimes the images just dont load while loading the page for some reasen. 
                    We give user the opportunity to reload it */
                    e.target.style.height ="";
                    e.target.src+="&t="+new Date().getTime();
                   });
                e.target.dataset["tried_again"]="true";
            }
            else
            {
                e.target.alt="Image could not be loaded. Sorry";

            }
        },
        process_img_errors(parentNode)
        {
            var imgs=parentNode.getElementsByTagName("img");
            for (var i=0;i<imgs.length;i++)
            {
                imgs[i].addEventListener("error",this.on_img_error);
            }
        }
    }
    
    obj_title_page=
    {
        _document:this,
        init()
        {
            var meta=this._document.doc.meta;
            this.title_page=div("document_title_page", null);
            this.cps=div("corpus",this.title_page,"");
            for (var i=0;i<meta.corpora.length;i++)
            {
                var c=meta.corpora[i];
                if (i>0)
                    var sep=" > ";
                else
                    var sep="";
                var s=span("",this.cps,sep + c.textContent + " (Corpus "+c.attributes["nr"].textContent+") ");
                s.dataset["pid"]=meta.corpora_idno[i];
                s.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:e.target.dataset["pid"]}}));};
            }
            this.author=div("author pointer",this.title_page,meta.author.textContent);
            this.author.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:meta.author_idno}}));};
            var work_name_span=span("",null,meta.work.textContent);
            this.work=div("work",this.title_page,work_name_span);
            
            this.not_loaded_sections=span("not_loaded_sections",this.work);   
            var me=this;
            for (var i=0;i<meta.not_loaded_sections.length;i++)
            {

                span("item separator",this.not_loaded_sections," > ");
                var s=span("item",this.not_loaded_sections,meta.not_loaded_sections[i].head)
                s.dataset["pid"]=meta.not_loaded_sections[i].pid;
                s.onclick=function(e){me._document.load_document(e.target.dataset["pid"])};
                s.title="Click to load the whole section."
                
                work_name_span.dataset["pid"]=meta.cc_idno;
                work_name_span.onclick=s.onclick;
                work_name_span.classList.add("pointer");
                work_name_span.title="Click to load the whole text."
                
            }
            if (meta.last_loaded_section_head!="")
            {//if we load only part of a text, we want to show the head of the loaded part as well, not only the preceding not laoded ancestors
                span("item separator",this.not_loaded_sections," > ");
                var s=span("item",this.not_loaded_sections,meta.last_loaded_section_head);
            }
            
            
            this.text=div("text",this.title_page,meta.text.textContent);

            

            this.text=div("id",this.title_page,"cc_id: "+meta.cc_id + ", cc_idno: " + meta.cc_idno);
            
            
            this.show_doc_nav=div("sdn_btn",this.title_page,"Table of contents");
            var ch=div("chevron horizontal chevron_h",this.show_doc_nav)
            this.show_doc_nav.addEventListener("click",this._document.obj_document_navigation.open_document_navigation.bind(this._document.obj_document_navigation));
            this._document.__tpages[0].text_body.insertBefore(this.title_page,this._document.__tpages[0].text_body.getElementsByClassName("text")[0]);
            this._document.addEventListener("scrolled_before_text",this.on_scrolled_before_text.bind(this));

            this._document.obj_scrolling.text_scrolled(null);
            this.on_scrolled_before_text(null);

        },
        on_scrolled_before_text(e)
        {
            for (var i=0;i<this.title_page.children.length;i++)
            {
                var ch=this.title_page.children[i];
                var top_strip_corresponding_item=this._document.obj_position_bar.main.getElementsByClassName(ch.classList[0]);
                if (this.title_page.children[i].offsetTop>this._document.obj_scrolling.scroll_top+this._document.obj_position_bar.main.offsetHeight)
                {
                    if (top_strip_corresponding_item.length>0)
                    {
                        top_strip_corresponding_item[0].classList.add("hidden");
                        if (top_strip_corresponding_item[0].previousElementSibling!=null)
                            top_strip_corresponding_item[0].previousElementSibling.classList.add("hidden");
                        ch.classList.remove("hidden");
                    }
                }   
                else
                {
                    
                    if (top_strip_corresponding_item.length>0)
                    {
                        top_strip_corresponding_item[0].classList.remove("hidden");
                        if (top_strip_corresponding_item[0].previousElementSibling!=null)
                            top_strip_corresponding_item[0].previousElementSibling.classList.remove("hidden");
                            ch.classList.add("hidden");
                    }
                }
            }
        }
    }
    
    obj_intext_boxes=
    {
        _document:this,
        b:Array(),

        open(position,flags)
        {
            var new_box=new cls_intext_box(this,position,flags);
            this.b.push(new_box);
            return new_box;
        },
        close_boxes_of_class(class_name)
        {
            for (var i=this.b.length-1;i>=0;i--)
            {
                if (this.b[i].class_name==class_name)
                {
                    this.b[i].close();
                    //this.b.splice(i,1);
                }
            }
        },
        close_box(box)
        {
            for (var i=0;i<this.b.length;i++)
            {
                if (box===this.b[i])
                {
                    this.b.splice(i,1);
                    return 0;
                }
                
            }
        }
    }

    obj_document_navigation=
    {
        _document:this,
        init()
        {
            this.doc_nav_open=div("show_document_navigation", this._document.obj_position_bar.main);
            div("sdn_btn chevron horizontal",this.doc_nav_open);
            this.doc_nav_open.title="Show table of contents (or press F2)";
            this.doc_nav_open.addEventListener("click",this.open_document_navigation.bind(this));

            this.doc_nav=div("document_navigation_panel display_none",this._document.obj_position_bar.main);
            this.close_div=div("intext_toolbox_close",this.doc_nav,"close box");
            this.close_div.addEventListener("click",this.open_document_navigation.bind(this));
            this.doc_nav_inner_box=div("inner_box",this.doc_nav);
            this.doc_nav_list_box=div("full_div",this.doc_nav_inner_box);
            
            var tbl=this.create_navigation_table(this._document.table_of_contents_xml);
            this.doc_nav_list_box.appendChild(tbl);

            document.addEventListener("keydown",this.onkeydown.bind(this));

            this._document.addEventListener("first_visible_div_changed",this.on_text_first_visible_div_changed.bind(this));
            
        },
        onkeydown(e)
        {
            if (e.key=="F2")
                this.open_document_navigation();
        },

        create_navigation_table(table_of_contents_xml)
        {
            var create_level=function(xml,lvl,parent_object)
            {
                var tbl=create_element("table","doc_nav_table_of_contents",null);
                if (lvl>1)
                    tbl.classList.add("collapsed");
                if (xml.children[0].tagName.toLowerCase()=="head")
                {
                    var text=xml.children[0].textContent.trim();
                            text=text.replace("\n","");
                            text=text.replace(/\s+/," ");
                    var th=create_element("thead","",tbl);//children[0]=<head>
                    var tr=create_element("tr","",th);
                    var td1=create_element("td","list_item_dropdown_td",tr);
                    var td2=create_element("td","",tr,text);
                    tr.dataset["pid"]=xml.attributes["pid"].textContent;
                    var me=this;
                    td1.onclick=function(e)
                    {
                        var tbl=ancestor(e.target,function(el)
                        {return el.nodeName.toLowerCase()=="table";},
                        function(el){return el.nodeName.toLowerCase()=="table";});
                        tbl[0].classList.toggle("collapsed");
                        e.target.classList.toggle("list_item_dropdown_td_dropped_down");
                    };
                    td2.addEventListener("click",parent_object.nav_item_clicked.bind(parent_object));
                }
                for (var i=0;i<xml.children.length;i++)
                {
                    var ch=xml.children[i];
                    if (ch.nodeName.toLowerCase()=="contents")
                    {
                        if (ch.getElementsByTagName("contents").length>0)
                        {
                            var tr_contents=create_element("tr","",tbl);
                            tr_contents.appendChild(create_level(ch,lvl+1,parent_object));
                        }
                        else
                        {
                            var text=ch.textContent.trim();
                            text=text.replace("\n","");
                            text=text.replace(/\s+/," ");
                            var tr=create_element("tr","",tbl,"<td></td><td>"+text+"</td>");
                            tr.dataset["pid"]=ch.attributes["pid"].textContent;
                            tr.addEventListener("click",parent_object.nav_item_clicked.bind(parent_object));
                        }
                    }
                    

                };
                return tbl;
            }
            if (table_of_contents_xml.children.length>0)
                var content_tbl=create_level(table_of_contents_xml,1,this);
            else
                content_tbl=div("",null,"(no contents under this level)");
            return content_tbl;
        },
        nav_item_clicked(e)
        {
            var pid=ancestor(e.target,function(el){return(el.dataset["pid"]!=null)},function(el){return(el.dataset["pid"]!=null)})[0].dataset["pid"];
            this._document.obj_scrolling.scroll_to_pid(pid);

            this.open_document_navigation();
        },
        set_height()
        {
            if (this.doc_nav.classList.contains("display_none")==false)
            {
                var text_section_height=this._document.text_section.section_container.offsetHeight;
                var scroll_top=this._document.text_section.text_container.scrollTop;
                var offsetParent_height=this.doc_nav.offsetParent.offsetHeight;
                var h=text_section_height-(offsetParent_height+30);
                if (scroll_top<80)
                    h-=(80-scroll_top);
                this.doc_nav.style.height=h;
            }
        },
        open_document_navigation(e)
        {
            
            this.doc_nav.classList.toggle("display_none");

            if (this.doc_nav.classList.contains("display_none")==false)
            {
                this.set_height();
                if (typeof(e)=="string")
                {//open on certain position
                    var trs=this.doc_nav_list_box.getElementsByTagName("tr");
                    for (var i=0;i<trs.length;i++)
                    {
                        if (trs[i].dataset["pid"]==e)
                        {
                            var higher_level_trs=ancestor(trs[i],
                                function(el){return el.nodeName.toLowerCase()=="tr";},
                                function(el){return el.nodeName.toLowerCase()=="div";})
                            var scroll_top=0;
                            for (var j=0;j<higher_level_trs.length;j++)
                            {
                                higher_level_trs[j].parentNode.classList.remove("collapsed");
                                scroll_top+=higher_level_trs[j].parentNode.offsetTop;
                            }
                            this.doc_nav_inner_box.scrollTop=scroll_top+trs[i].offsetTop-50;
                            break;
                        }
                    }
                }
                
            }
        },

        on_text_first_visible_div_changed(e)
        {
            this.set_height();
            var trs=this.doc_nav_list_box.getElementsByTagName("tr");
            for (var i=0;i<trs.length;i++)
            {
                
                trs[i].classList.remove("first_visible_div");
                trs[i].classList.remove("first_visible_div_ancestor");
            
                if (trs[i].dataset["pid"]==e.detail.first_visible_div_pid)
                {
                    var higher_level_trs=ancestor(trs[i],
                        function(el){return el.nodeName.toLowerCase()=="tr";},
                        function(el){return el.nodeName.toLowerCase()=="div";},false)
                    trs[i].classList.add("first_visible_div");
                    for (var j=0;j<higher_level_trs.length;j++)
                        higher_level_trs[j].classList.add("first_visible_div_ancestor");
                    
                }
            }
        }
    }

    obj_mouse_activity=
    {//objekt zpracovávající pohyby myší nad textem: identifikace věty, odstavce apod., nad nimiž je myš
        _document:this,
        sentence:null,
        selected_hierarchy:Array(),
        last_lowest_id:"",
        last_target_id:"",
        init()
        {
            this._document.text_section.text_container.addEventListener("click",this.on_text_clicked.bind(this));
        },
        find_elements_rc(el,p,array)
        {
            for (var i=0;i<el.childNodes.length;i++)
            {
                var ch=el.childNodes[i];
                var chnn=ch.nodeName.toLowerCase();
                if (chnn=="div" || chnn=="p" || chnn=="lg")
                {
                    if (ch.offsetTop<=p && ch.offsetTop+ch.offsetHeight>=p)
                    {
                        array.push(ch);
                        //if (chnn=="div")
                            //p-=ch.offsetTop;
                        this.find_elements_rc(ch,p,array);
                        break;
                    }
                }
            }
        },

        on_mouse_move(e)
        {
            if (ancestor(e.target,function(e){return (e.nodeName.toLowerCase()=="context_menu")},null,true).length>0)
                return 0;//we must cancel moving in the context menus
            var el=e.currentTarget;
            this.sentence=null;
            
            
            //get all hiararchic levels under the cursor
            /*this.selected_hierarchy=ancestor(el,
                function(el){var tagName=el.tagName.toLowerCase();return (tagName=="div" || tagName=="p" || tagName=="lg" || tagName=="l");},
                function(el){return el.classList.contains("text");}
                );*/
            if (this.last_target_id!=e.target.id)
            {
                this.selected_hierarchy=Array();
                this.find_elements_rc(el,e.layerY,this.selected_hierarchy);
                if (this.selected_hierarchy.length>0)
                {
                    this.selected_hierarchy.splice(0,0,el);
                    if (this._document.obj_context_selection!=null)
                        this._document.obj_context_selection.context_selection_changed(this.selected_hierarchy);
                }

            }
            this.last_target_id=e.target.id;
            

            
        },
        on_mouse_leave(e)
        {
            this.sentence=null;
            this.p=null;
            this.div=null;
            //this.selected_hierarchy=Array();
        },
        on_text_clicked(e)
        {
            if (ancestor(e.target,
                function(el){return (el.nodeName.toLowerCase()=="context_menu" || el.classList.contains("mod_TxVw_page_top_strip") || el.classList.contains("intext_toolbox")) || el.classList.contains("document_title_page") ;},
                function(el){return (el.classList.contains("module_container"));}).length>0)
                return 0;//cancle clicking in the context menus (which are hierarchically part of the html text node)
            if (true==true)
            {
                var is_point_in_rect=function(rect,X, Y)
                {
                    if (X>=rect.left && X<=rect.right && Y>=rect.top && Y<=rect.bottom)
                        return true;
                    else
                        return false;
                };
                if (e.rangeParent==undefined)
                {
                    var rects=window.getSelection().anchorNode.parentElement.getClientRects();
                }
                else
                {
                    var r=document.createRange();
                    r.setStart(e.rangeParent,1);
                    r.setEnd(e.rangeParent,e.rangeParent.length);
                    var rects=r.getClientRects();
                }
                var is_in_range=false;
                for (var i=0;i<rects.length;i++)
                {
                    if (is_point_in_rect(rects[i],e.clientX,e.clientY)==true)
                    {
                        is_in_range=true;
                        break;
                    }
                }
            
                //if (this.text_selection_mode==1 || (this.text_selection_mode==0 && e.ctrlKey==true))//kliknutí otevře slovníkové heslo (mode==1), anebo CTRL+kliknutí (mode==0)
                if (is_in_range==true)//(/*e.target.tagName.toLowerCase()!="div" &&*/ e.rangeOffset<e.rangeParent.length) //to avoid opening dictionary entries on clicking on white place next to text
                {
                    var s = window.getSelection();
                    
                    var range = s.getRangeAt(0);
                    var node = s.anchorNode;
                    var text=node.textContent;
                    if (range.startOffset==range.endOffset)
                    {
                        var clicked_pos=range.startOffset;
                        var prev_lb=text.lastIndexOf("\n",clicked_pos);
                        var prev_space=text.lastIndexOf(" ",clicked_pos);
                        var next_lb=text.indexOf("\n",clicked_pos);
                        var next_space=text.indexOf(" ",clicked_pos);
                        
                        if (prev_lb>prev_space) prev_space=prev_lb;
                        if (next_lb!=-1 && (next_lb<next_space || next_space==-1)) next_space=next_lb;
                        
                        if (next_space==-1)
                            next_space=text.length;
                        var word=text.substring(prev_space,next_space);
                        
                        
                        word=word.replace(/^[\s\n]+|[\s\n]+$/gm,'');
                        word=word.replace(/[- .,?<>!;:%0-9/\\()\[\]{}"']/gm,'');
                        word=word.toLowerCase();
                    
                        if (word!="")
                            document.body.dispatchEvent(new CustomEvent("word_selected",{detail:{word:word},bubbles:true}));
                    }
                }
            }
        }
    }

    obj_context_selection=
    {//objekt spravující menu pro div, odstavec a větu
        _document:this,
        selected_element:null,
        selected_hierarchy:Array(),
        menus:Array(),
        
        init()
        {
            this.selected_element=null;
            this.selected_hierarchy=Array();
            for (var i=0;i<this.menus.length;i++)
            {
                this.menus[i].delete();
            }
            this.menus=Array();
        },

        context_selection_changed(selected_hierarchy)
        {
            for (var i=0;i<this.menus.length;i++)
                this.menus[i].delete();
            this.selected_hierarchy=selected_hierarchy;
            this.menus=Array();

            if (this._document.doc.meta.not_loaded_sections.length>0)
                for (var i=this._document.doc.meta.not_loaded_sections.length-1;i>=0;i--)
                {
                    selected_hierarchy.splice(1,0,{id:this._document.doc.meta.not_loaded_sections[i].pid,
                                                    tagName:"div",
                                                    head:this._document.doc.meta.not_loaded_sections[i].head,
                                                    classList:{contains:function(t){return false;}}});
                }

            for (var i=0;i<selected_hierarchy.length;i++)
            {
                var ac_l=selected_hierarchy[i];
                this.menus.push(this.create_context_menu(ac_l,true,selected_hierarchy[0]));
            }
            this.menus[this.menus.length-1].expand();
            this.context_menu_activated(null);
        },
        
        create_context_menu(context,collapsed=true,text_context_html=null)
        {
            if (context!=null)
            {

                var me=this;
                var type=context.tagName.toLowerCase();

                var path_id=context.id.replace(/^[^:]+/,"");
                var permalink=this._document.doc.meta.uri+path_id;
                var permalink2=this._document.doc.meta.uri+"#"+path_id;

                var permalink_div=div("",null);
                
                var permalink_text="";
                if (context.classList.contains("text")==false)
                {
                    permalink_text=" (open the whole text and scroll to this section)";
                }

                var d=div("",permalink_div);
                var b=create_element("button","",d,"Copy");
                span("monospace pointer l_margin_5",d,permalink2);
                span("cursor_text",d,permalink_text)
                d.onclick=function(e){navigator.clipboard.writeText("https://"+permalink2);}
                b.onclick=d.onclick;

                if (context.classList.contains("text")==false)
                {
                    d=div("",permalink_div);
                    b=create_element("button","",d,"Copy");
                    span("monospace pointer",d,permalink);
                    span("cursor_text",d," (open only this section)")
                    d.onclick=function(e){navigator.clipboard.writeText("https://"+permalink);}
                    b.onclick=d.onclick;
                }
              

                var download_div=div("",null);
                b=create_element("button","",div("",download_div),"Download as XML");
                b.dataset["pid"]=context.id;
                b.addEventListener("click",
                    function(e)
                    {
                        window.location=url+"php_modules/download.php?idno="+e.target.dataset["pid"]+"&type=file-xml";
                    }
                );
                //b=create_element("button","",div("",download_div),"Download as XML with POS annotation");
                b=create_element("button","",div("",download_div),"Download as plain text (.txt)");
                b.dataset["pid"]=context.id;
                b.addEventListener("click",
                    function(e)
                    {
                        window.location=url+"php_modules/download.php?idno="+e.target.dataset["pid"]+"&type=file-txt";
                    }
                );

                if (type=="p") 
                {
                    var rv=new cls_context_menu(context,this._document,"¶");                
                    rv.create_item("L","Link to this paragraph",null,permalink_div);
                    rv.create_item("F","Focus on this paragraph",function(e){me._document.load_document(context.id);});
                    rv.create_item("D","Download this paragraph...",null,download_div);
                    /*rv.create_item("xml","Download this paragraph as xml",null);
                    rv.create_item("pdf","Download this paragraph as pdf",null);
                    rv.create_item("txt","Download this paragraph as plain text",null);*/

                    this._document._module.events.dispatchEvent(new CustomEvent("context_menu_created",{detail:rv}));
                    rv.caption.onclick=this.context_menu_caption_click.bind(this);
                }
                else if (type=="div" && context.classList.contains("text")==false)
                {
                    var head="";
                    if (context.head===undefined)
                    {
                        var heads=context.getElementsByClassName("head");
                        var h_len=10;
                        if (heads.length>0)
                            if (heads[0].parentNode.isSameNode(context))
                            {
                                head=heads[0].textContent.trim();
                            }
                        head=head.split(" ");
                        if (head.length<=h_len)
                            head=head.slice(0,h_len).join(" ");
                        else
                            head=head.slice(0,h_len).join(" ")+"...";
                        
                        var html_context=context;
                        
                        var not_loaded=false;
                    }
                    else
                    {
                        head=context.head+"<br/>(this section is not loaded in the current view)";
                        var html_context=text_context_html;
                        var not_loaded=true;
                    }
                    var rv=new cls_context_menu(html_context,this._document,"c",head,not_loaded);                
                    rv.create_item("C","Table of contents",function(e){me._document.obj_document_navigation.open_document_navigation(context.id)});
                    rv.create_item("L","Link to this chapter (click to copy)",null,permalink_div);
                    rv.create_item("F","Focus on this chapter",function(e){me._document.load_document(context.id);});
                    rv.create_item("D","Download this chapter...",null,download_div);

                    /*rv.create_item("xml","Download this chapter as xml",null);
                    rv.create_item("pdf","Download this chapter as pdf",null);
                    rv.create_item("txt","Download this chapter as plain text",null);*/
                    if (not_loaded==false)
                        this._document._module.events.dispatchEvent(new CustomEvent("context_menu_created",{detail:rv}));
                    rv.caption.onclick=this.context_menu_caption_click.bind(this);
                }
                else
                {
                    
                    if (this._document.loaded_pid.match(":"))
                    {
                        not_loaded=true;
                        head+="<br/>(this section is not loaded in the current view)";
                    }
                        
                    var head="Whole text of " + this._document.doc.meta.text_name+head;
                    var rv=new cls_context_menu(context,this._document,"c",head,not_loaded);                
                    rv.create_item("C","Table of contents",function(e){me._document.obj_document_navigation.open_document_navigation(context.id)});
                    rv.create_item("L","Link to the text (click to copy)",null,permalink_div);
                    rv.create_item("F","Load the whole text",function(e){me._document.load_document(me._document.doc.meta.cc_idno);});
                    rv.create_item("D","Download the text...",null,download_div);

                    /*rv.create_item("xml","Download this chapter as xml",null);
                    rv.create_item("pdf","Download this chapter as pdf",null);
                    rv.create_item("txt","Download this chapter as plain text",null);*/
                    if (not_loaded==false)
                        this._document._module.events.dispatchEvent(new CustomEvent("context_menu_created",{detail:rv}));
                    rv.caption.onclick=this.context_menu_caption_click.bind(this);
                    
                    
                }
                if (collapsed==true)
                    rv.collapse();
                
                rv.addEventListener("context_menu_activated",this.context_menu_activated.bind(this));
                return rv;
            }
        },
        context_menu_activated(e)
        {
            var def_l=-10;
            var def_w=25;
            var after_exp=false;
            for (var i=this.menus.length-1;i>=0;i--)
            {

                if (this.menus[i].html_container.classList.contains("collapsed")==true)
                    def_l -=10;
                else
                    def_l -=35;

                /*if (this.menus[i].html_container.classList.contains("collapsed")==true)
                {
                    if (after_exp==false)
                        this.menus[i].html_container.style.left=def_l+def_w-2;
                    else
                        this.menus[i].html_container.style.left=def_l;
                }
                else*/

                this.menus[i].html_container.style.left=def_l;
                this.menus[i].html_container.style.zIndex=100+this.menus.length-i;
               
            }
        },
        context_menu_caption_click(e)
        {
            if (this.selected_element==null)
            {
                var el=e.target;    
                while(el!=null)
                {
                    if (el.id!="")
                    {
                        break;
                    }
                    el=el.parentNode;
                }

                this.make_selection(el);
                e.target.classList.toggle("activated");
            }
            else
            {
                //if (e.target.classList.contains("activated"))
                {
                    e.target.classList.remove("activated");
                    this.selected_element.classList.remove("text_section_selected");
                    this.selected_element=null;

                }
            }
        },
        make_selection(e)
        {
            if (this.selected_element==null)
            {
                this.selected_element=e;                
                this.selected_element.classList.add("text_section_selected");
                var s=this.selected_element.getElementsByClassName("s");
                for (var i=0;i<s.length;i++)
                {
                    s[i].innerHTML="";
                    var ss=span("sentence_start",s[i]);
                    ss.onclick=this.sentence_start_click.bind(this);
                }
            }
            
        },
        close_menu(e)
        {
           
        },
        select_section(s)
        {

        },
        sentence_start_click(e)
        {
            var s=e.target.parentNode;
            
            this.highlight_sentence(s.id,this.selected_element);
            var words=this.wrap_words_in_sentence(s.id,this.selected_element);
        },
        select_part_of_sentence(part,pid,p)
        {
            if (p!=null)
            {
                part.text=part.text.trim();
                var words_to_hgl=part.text.replace(/([\s\n\t]+)/g,"$1@sep@").split("@sep@");
                var words=this.wrap_words_in_sentence(pid,p);
                var j=0;
                var sel_words=Array();
                for (var i=part.start_index;i<words.length && j<words_to_hgl.length;i++)
                {
                    var word_abstract=words[i].textContent.match(/(\w+)/g);
                    if (word_abstract!=null && word_abstract.length>0)
                        word_abstract=word_abstract[0].toLowerCase();
                    var word_to_hgl_abstract=words_to_hgl[j].match(/(\w+)/g);
                    if (word_to_hgl_abstract!=null && word_to_hgl_abstract.length>0)
                        word_to_hgl_abstract=word_to_hgl_abstract[0].toLowerCase();
                    if (word_abstract==word_to_hgl_abstract)
                    {
                        sel_words.push(words[i]);
                        j++;
                        
                    }
                    
                }   
            }
            return sel_words;
        },
        unhighliht_sentence(pid,p)
        {
            var sentence_nodes=this.wrap_sentence(pid,p);
            while (sentence_nodes.length>0)
                sentence_nodes[0].classList.remove("sentence_selected");
        },
        highlight_sentence(pid,p,classes="",cancel_others=true)
        {//basic built-in highlighting of a sentence: another modules can just take the elements (using wrap_sentence) and highlight it by themselves
            if (p!=null)
            {
                var hgl=p.getElementsByClassName("sentence_selected");
                while (hgl.length>0)
                    hgl[0].classList.remove("sentence_selected");
                
                var sentence_nodes=this.wrap_sentence(pid,p);
                for(var i=0;i<sentence_nodes.length;i++)
                {
                    sentence_nodes[i].classList.add("sentence_selected");
                }
                
            }
        },
        get_sentence_DOM_text_nodes(pid,p)
        {
            if (p!=null)
            {
                var s=p.getElementsByClassName("s");
                for (var i=0;i<s.length;i++)
                {
                    if (s[i].id==pid)
                    {
                        var first=s[i];
                        if (i<s.length-1)
                            var last=s[i+1];
                        else
                            var last=p.childNodes[p.childNodes.length-1];
                        break;
                    }
                }
                var r=document.createRange();
                r.setStart(first,0);
                r.setEnd(last,0);
                var it=document.createNodeIterator(r.commonAncestorContainer,NodeFilter.SHOW_TEXT);
                var nodes=[];
                while (it.nextNode())
                {
                    if (r.intersectsNode(it.referenceNode))
                        nodes.push(it.referenceNode);
                    else
                        if (nodes.length>0)
                            break;
                }
                return nodes;
                //select_nodes_between(first,last,function(n){if (n.nodeName.toLowerCase()=="#text")return true});
            }
        },
        wrap_sentence(pid,p=null,nodeName="sentence",classes="")
        {//wrap a sentence (between two <span class="s"/>) with "sentence" elements
            var wrap=function(sentence_text_nodes,nodeName="sentence",classes="",pid="")
            {
                var new_nodes=Array();
                for (var i=0;i<sentence_text_nodes.length;i++)
                {
                    var parent=sentence_text_nodes[i].parentNode;

                    if (parent.textContent.trim()=="")
                    {
                        new_nodes.push(parent);
                        continue;
                    }
                    var already_wrapped=false;
                    while (parent.nodeName.toLowerCase()!="div")
                    {
                        if (parent.nodeName.toLowerCase()==nodeName.toLowerCase())
                        {
                            new_nodes.push(parent);
                            already_wrapped=true;
                            break;
                        }
                        parent=parent.parentNode;
                    }
                    //to prevent recursiv wraping of already wraped sentences
                    if (already_wrapped==false)
                    {
                        var new_node=create_element(nodeName,classes,null,sentence_text_nodes[i].textContent);
                        new_node.dataset["pid"]=pid;
                        new_nodes.push(new_node);
    
                        sentence_text_nodes[i].parentNode.insertBefore(new_node,sentence_text_nodes[i]);
                        sentence_text_nodes[i].remove();
                    }
                    
                }
                return new_nodes;
            };
            if (p!=null)
            {
                var DOM_elements=this.get_sentence_DOM_text_nodes(pid,p);
                return wrap(DOM_elements,nodeName,classes,pid);
            }
        },
        
        wrap_words_in_sentence(pid,p=null,nodeName="w",classes="")
        {
            var wrap=function(sentence_text_nodes,nodeName="w",classes="")
            {

                var new_nodes=Array();
                for (var i=0;i<sentence_text_nodes.length;i++)
                {

                    var parent=sentence_text_nodes[i].parentNode;
                    var already_wrapped=false;
                    while (parent.nodeName.toLowerCase()!="div")
                    {
                        if (parent.nodeName.toLowerCase()==nodeName.toLowerCase())
                        {
                            new_nodes.push(parent);
                            already_wrapped=true;
                            break;
                        }
                        parent=parent.parentNode;
                    }
    
                    if (already_wrapped==false)
                    {
                        var new_node;
                        var w=sentence_text_nodes[i].textContent.replace(/([\s\n\t]+)/g,"$1@sep@").split("@sep@");
                        for (var j=0;j<w.length;j++)
                        {
                            if (w[j].trim()!="")
                            {
                                new_node=create_element(nodeName,classes,null,w[j]);
                                sentence_text_nodes[i].parentNode.insertBefore(new_node,sentence_text_nodes[i]);
                                new_nodes.push(new_node);
                            }
                        }
                        sentence_text_nodes[i].remove();
                    }
                }
                return new_nodes;
            };
            if (p!=null)
            {
                
                var DOM_elements=this.wrap_sentence(pid,p);
                DOM_elements=this.get_sentence_DOM_text_nodes(pid,p);
                return wrap(DOM_elements,nodeName,classes);
            }
        }
        


    }


 



    obj_position_bar=
    {
        _document:this,

        init()
        {
            var strips=this._document.container.getElementsByClassName("mod_TxVw_page_top_strip");
            for (var i=strips.length-1;i>=0;i--)
                strips[i].remove();
            var lm=this._document.__tpages[0].left_margin;
            var rm=this._document.__tpages[0].right_margin;
            var tb=this._document.__tpages[0].text_body;

            this.left=div("mod_TxVw_page_top_strip");
            this.right=div("mod_TxVw_page_top_strip");
            this.main=div("mod_TxVw_page_top_strip");

            if (lm.childNodes.length==0)
                lm.appendChild(this.left);
            else    
                lm.insertBefore(this.left,lm.childNodes[0]);     

            if (rm.childNodes.length==0)
                rm.appendChild(this.right);
            else    
                rm.insertBefore(this.right,lm.childNodes[0]);

            if (tb.childNodes.length==0)
                tb.appendChild(this.main);
            else    
                tb.insertBefore(this.main,tb.childNodes[0]);
            
            this.static_part=div("mod_TxVw_page_top_strip_part static_part",this.main);
            this.dynamic_part=div("mod_TxVw_page_top_strip_part dynamic_part",this.main);
            this.dynamic_part_span_container=span("span_container",this.dynamic_part)
            
            
            
        },
        print_static_position()
        {//data jsou uložena buďt v _document.xml, anebo extrahovaná v _document.doc
            
            var doc=this._document.doc;
            this.static_part.innerHTML="";

            for (var i=0;i<doc.meta.corpora.length;i++)
            {
                var cps_n=doc.meta.corpora[i].getAttribute("nr");
                if (cps_n!=undefined)
                {
                    cps_n=" (Corpus "+cps_n+")";
                }
                else
                    cps_n="";
                var a=span("item corpus",this.static_part,doc.meta.corpora[i].textContent+cps_n);
                a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:doc.meta.corpora_idno[0]}}));};
                span("item separator",this.static_part," > ");
            }
            a=span("item author",this.static_part,doc.meta.author.textContent);
            a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:doc.meta.author_idno}}));};
            span("item separator",this.static_part," > ");
            a=span("item work",this.static_part,doc.meta.work.textContent);
            a.onclick=function(e){dispatch_event(new CustomEvent('navigate_request',{detail:{path:doc.meta.work_idno}}));};

            var items=this.static_part.getElementsByClassName("item");
            for (var i=0;i<items.length;i++)
            {
                if (items[i].classList.contains("separator")==false)
                {
                    if (items[i].scrollWidth>items[i].offsetWidth)
                        items[i].title=items[i].textContent;
                }
            }
            
        },
        on_text_scrolled(ac_div_and_ancestors)
        {
            var get_caption_on_no_head=function(el)
            {
                var count_preceding_siblings=function(e)
                {
                    var n=1;
                    while(e.previousElementSibling!=null)
                    {
                        if (e.previousElementSibling.nodeName.toLowerCase()=="div")
                            n+=1;
                        e=e.previousElementSibling;
                    }
                    return n;
                };
                if (el.attributes["xml-n"]!=null)
                    if (el.attributes["xml-n"].textContent!="")
                        return el.attributes["xml-n"].textContent;

                for (var i=0;i<el.childNodes.length;i++)
                {
                    var ch=el.childNodes[i];
                    var ch_nn=ch.nodeName.toLowerCase();
                    if (ch_nn=="context_menu")
                        continue;
                    
                    if (ch_nn=="div" || ch_nn=="lg" || ch_nn=="front" || ch_nn=="back")
                        return "<em>"+count_preceding_siblings(ch)+"</em>";
                    
                    else
                    {
                        var t=ch.textContent;
                        var m=t.match(/^[\W]*([[<{][0-9IVXLCDM.;, \W]+[\]>}])/i);
                        if (m!=null)
                            return "<em>"+m[0].replace(/[\W]+/g," ")+"</em>";
                        else
                            if (ch_nn=="#text")
                                continue;
                            else
                                return "<em>"+count_preceding_siblings(ch)+"</em>";
                    }
                    
                }
            };
            
            if (this._document.doc.meta.not_loaded_sections.length>0)
                    for (var j=0;j<this._document.doc.meta.not_loaded_sections.length;j++)
                    {
                        ac_div_and_ancestors.splice(1,0,this._document.doc.meta.not_loaded_sections[j]);
                    }
            
            for (var j=ac_div_and_ancestors.length-1;j>=0;j--)
            {
                var class_to_add="";
                if (ac_div_and_ancestors[j].pid!=undefined)//"supplied" non loaded sections!
                {
                    ac_head=ac_div_and_ancestors[j].head;
                    class_to_add=" not_loaded";
                }
                else
                {
                    if (ac_div_and_ancestors[j].classList.contains("text"))
                        continue;
                    var ac_head=ac_div_and_ancestors[j].getElementsByClassName("head");
                    if (ac_head.length>0)
                    {
                        ac_head=ac_head[0];
                        if (ac_head.parentNode.isSameNode(ac_div_and_ancestors[j]))
                        {
                            ac_head=ac_head.textContent.replace(/\n/,"");
                            ac_head=ac_head.replace(/[\s]+/," ");
                            ac_head=ac_head.replace(/</,"&lt;");
                            ac_head=ac_head.replace(/>/,"&gt;");
                        }
                        else
                        {
                            ac_head=get_caption_on_no_head(ac_div_and_ancestors[j]);
                        }
                    }
                    else
                        ac_head=ac_head=get_caption_on_no_head(ac_div_and_ancestors[j]);
                    if (this._document.position_indicator!=undefined)
                    {//kvůli synopsi zatím nechávám, ale nutno sloučit
                        this._document.position_indicator.innerHTML+=ac_head;
                        if (j>1)//the last is always the #text div, we don't count it 
                            this._document.position_indicator.innerHTML+=" > ";
                    }
                }
                {
                    var s=span("item"+class_to_add,this._document.obj_position_bar.dynamic_part_span_container,ac_head);
                    if (class_to_add!="")
                    {
                        s.dataset["pid"]=ac_div_and_ancestors[j].pid;
                        s.title="This section is not loaded in the current view. Click to load it";
                        var me=this;
                        s.onclick=function(e){me._document.load_document(e.target.dataset["pid"])};
                    }
                    if (j>0)
                        span("item separator",this._document.obj_position_bar.dynamic_part_span_container,">");
                    
                }

            }
        }
    }
    obj_scrolling=
    {
        _document:this,
        scroll_top:0,
        client_height:0,
        cancel_synoptic_propagation:false,
        first_visible_div:null,
        first_visible_div_pid:"",
        prev_first_visible_div_pid:"",
        prev_first_visible_div_index:-1,
        text_scrolled()
        {

            if (this._document.doc==undefined)
                return 0;
            var first_visible_div_index=null;
            var first_visible_anchor=null;
            this.scroll_top=this._document.text_section.text_container.scrollTop;

            this.client_height=this._document.text_section.text_container.clientHeight;
            var divs=this._document.__tpages[0].text_body.getElementsByClassName("hierarchy");
            
            this._document.position_indicator.innerHTML="";
            this._document.obj_position_bar.dynamic_part_span_container.innerHTML="";

            for (var i=0;i<divs.length;i++)
            {//zjistíme, který je první viditelný div
                if (divs[i].offsetTop>this.scroll_top+70)
                    first_visible_div_index=i-1;
                else if (i==divs.length-1)
                    first_visible_div_index=i;

                if (first_visible_div_index!=null)
                {//najdeme ten, jehož začátek je níže než aktuálně nejvýše viditelný text
                    if (first_visible_div_index==-1)//jsme úplně nahoře...
                        break;

                    //if (first_visible_div_index==this.prev_first_visible_div_index)
                      //  break;//oproti "minule" se nic nezměnilo, nemá cenu vše znovu generovat, aby bylo ve výsledku vše stejné
                        
                    
                    this.first_visible_div=divs[first_visible_div_index];
                    this.first_visible_div_pid=this.first_visible_div.id;


                    if (this.first_visible_div_pid!=this.prev_first_visible_div_pid)
                    {//the first div changed since the last 
                        this._document.dispatchEvent(new CustomEvent("first_visible_div_changed",{
                            detail:{
                                "first_visible_div":this.first_visible_div,
                                "first_visible_div_pid":this.first_visible_div_pid
                            }}));
                    }

                    //if (first_visible_div.offsetTop-this.scroll_top>50)
                    //    break;//nalezený div ale začíná až pod horní hranou, tedy jsme na začátku dokumentu a nezobrazujeme nic
                    

                    this.ancestor_divs=Array();
                    this.ancestor_divs=ancestors(this.first_visible_div,
                        function(el){return el.nodeName.toLowerCase()=="div";},
                        function(el){return el.classList.contains("text");})
                    /*this.ancestors.push(first_visible_div);
                    var ancestor=first_visible_div.parentElement;
                    while (ancestor.classList.contains("text")==false)
                    {
                        this.ancestors.push(ancestor);
                        ancestor=ancestor.parentElement;
                    }*/


                    
                    this._document.obj_position_bar.on_text_scrolled(this.ancestor_divs);

                    break;
                }
            }
            
            if (first_visible_div_index==-1 || this.prev_first_visible_div_index==-1)
            {
                this._document.dispatchEvent(new CustomEvent("scrolled_before_text",{
                            detail:this}));
                this._document.__tpages[0].text_body.classList.add("scrolled_before_text");
            }
            else
                this._document.__tpages[0].text_body.classList.remove("scrolled_before_text");
            
            this.prev_first_visible_div_index=first_visible_div_index;

            if (this._document.doc.apparatus.exists==true)
            { /*najdeme první paratext aktuálně viditelný na stránce. To může být v prvním viditelném
                divu, ale i v některém následujícím*/
                var first_visible_anchor=null;
                var first_visible_anchor_index=-1;
                if (first_visible_div_index>=0)
                    for (var i=first_visible_div_index;i<divs.length;i++)
                    {
                        if (divs[i].offsetTop<this.scroll_top+this.client_height )
                        {//pokud je div viditelný
                            var div_anchors=divs[i].getElementsByClassName("paratext_anchor");
                            for (var j=0;j<div_anchors.length;j++)
                            {
                                if (div_anchors[j].offsetTop-68 /*výška navigačního panelu*/ >this.scroll_top)
                                {
                                    first_visible_anchor=div_anchors[j];
                                    first_visible_anchor_index=first_visible_anchor.dataset["index"];
                                    break;
                                }
                            }
                        }
                        if (first_visible_anchor!=null)
                            break;
                    }
                
            }
            if (this._document.obj_paratext.scroll_paratext_ontextscrolled==true && this._document.obj_paratext.cancel_scrolling_ontextscrolled==false)
            {
                /*posuneme paratext tak, aby první viditelný prvek odpovídal první viditelné kotvě
               (pokud není vypnuto pomocí cancel_scrolling_ontextscrolled=true nebo
               scroll_paratext_ontextscrolled=false. To první znamená, že pro tuto chvíli bylo srovnání 
               paratextu zrušeno (při kliknutí na box se šipkou vedle paratextu!), to druhé je 
               uživatelské nastavení. 
                */
                this._document.obj_paratext.move_to_view(first_visible_anchor_index-1);
            }
            else if(this._document.obj_paratext.cancel_scrolling_ontextscrolled==true)
                this._document.obj_paratext.cancel_scrolling_ontextscrolled=false;
            
                /**
                 * dokument je součástí synopse: pokud to není zablokováno, řekneme synopsi, že se jeden dokument 
                 * posunul, aby posunula i ostatní. Ale u těch už bude právě toto zablokováno, jinak bychom se dostali 
                 * do smyčky. 
                 */
            if (this._document.synopsis!=null && this.cancel_synoptic_propagation==false)
            {
                this._document.synopsis.document_scrolled(this._document); 
            }
            else if (this.cancel_synoptic_propagation==true)
                this.cancel_synoptic_propagation=false;
            
        },
        scroll_to_pid(pid)
        {
            if (pid!=null && pid!="")
            {
                var el=document.getElementById(pid);
                this.scroll_to(el.offsetTop-70);
            }
            
        },
        scroll_to(new_scroll_top)
        {/*manuální posunutí. Posouvá se hlavně u synopse.
            A v takovém případě musíme zabánit tomu, aby se událost šířila dál do dalších synoptických dokumentů
            */
            this.cancel_synoptic_propagation=true;
            this._document.text_section.text_container.scrollTop=new_scroll_top;
        }
    }
    normalize_header=(header)=>
    {
        var t=header[0].textContent;
        t=t.trim();
        t=t.replace(/\n/g,"");
        t=t.replace(/\s+/g," ");
        return t;
    }
    obj_paratext=
    {
        /*
        organizes displaying of all diferent paratexts (text apparatus+outputs of some submodules)
        */
        _document:this,
        paratexts:Array(),
        last_highlighted_ptitem_index:-1,
        last_highlighted_anchor_index:-1,
        timeout_id:0,
        m1_paratext_index:-1,
        cancel_scrolling_ontextscrolled:false,//pro nějakou událost, která pohne textem, ale nechce následně hýbat paratextem (kliknutí na paratext, aby se text dostal do pohledu)
        scroll_paratext_ontextscrolled:true,//možnost zapnout/vypnout automatické scrollování paratextu
        mode:0,
        control_div:null,
        ev:new EventTarget(),
        last_tbody_width:0,
        last_ptdiv_width:0,
        size_observer_timer:0,

        create_control_box()
        {
            if (this.control_div==null)
                this.control_div=div("paratext_control_box",null);

            this.control_div.innerHTML="";
            for (var i=0;i<this.paratexts.length;i++)
            {
                var me=this;
                var d=div("pointer paratext_switcher",this.control_div,this.paratexts[i].name);
                d.onclick=function(e)
                {
                    me.show_paratext(e.target.textContent);
                    var pts=me.control_div.getElementsByClassName("paratext_switcher");
                    for (var i=0;i<pts.length;i++)
                    {
                        pts[i].classList.remove("active");
                    }
                    e.target.classList.add("active");
                }
            }
        },
        check()
        {
            if (this.paratexts.length==0)
                this.no_paratext_exists();
        },
        no_paratext_exists()
        {//(semi)hide the footnote paratext section, when no paratext is present
            this._document.paratext_section.section_container.style.height="40px";
            div("absolute",this._document.__ptpages[0].text_body,"(no apparatus)").style.top="0px";
        },
        mode_set(mode)
        {
            this.mode=mode;
            this.create_control_box();
            var connected;
            if (this.scroll_paratext_ontextscrolled==true)
                connected="connected";
            if (mode==0)
            {//tlačítko pro zamknutí posouvání paratextu spolu s textem
                this.btn_connect_scroling=div("pt_btn_connect_scrolling "+connected,
                    this._document.paratext_section.section_container);

                this.btn_connect_scroling.title="Scroll paratext together with main text";
                var me=this;
                var connect_disconnect_scrolling=function()
                {
                    me.scroll_paratext_ontextscrolled=!me.scroll_paratext_ontextscrolled;
                    me.btn_connect_scroling.classList.toggle("connected");
                };
                this.btn_connect_scroling.onclick=connect_disconnect_scrolling;

                this._document.__ptpages[0].left_margin.appendChild(this.control_div);
                
                window.clearInterval(this.size_observer_timer);
            }
            else
            {
                if (this._document.__tpages[0].obj_inpage_paratext.top_strip!=undefined)
                    this._document.__tpages[0].obj_inpage_paratext.top_strip.appendChild(this.control_div);
                this.size_observer_timer=window.setInterval(this.size_observer.bind(this),500);
            }
            for (var i=0;i<this.paratexts.length;i++)
                this.paratexts[i].layout_mode_set(mode);

            if (this.paratexts.length==0)
                this.no_paratext_exists();
        },
        add_paratext(_source,name)
        {
            this.paratexts.push(new cls_paratext(_source,this._document,name));
            return this.paratexts[this.paratexts.length-1];
        },
        show_paratext(index)
        {
            for (var i=0;i<this.paratexts.length;i++)
            {
                if (typeof index=="number")
                    var compare=i;
                else
                    var compare=this.paratexts[i].name;
                if (compare!=index)
                {
                    this.paratexts[i].hide();
                }
                else
                {
                    this.paratexts[i].show();
                }
            }
        },
        initialize_all()
        {
            for (var i=0;i<this.paratexts.length;i++)
            {
                this.paratexts[i].initialize(this.mode);
            }
        },
        size_observer(me)
        {//watch changes in dimensions of important elements
            if (this._document.__tpages[0].text_body.offsetWidth!=this.last_tbody_width
            || this._document.__tpages[0].obj_inpage_paratext.container.offsetWidth!=this.last_ptdiv_width)
                for (var i=0;i<this.paratexts.length;i++)
                    this.paratexts[i].dispatchEvent(new CustomEvent("on_page_width_change"));
        },
        move_to_view(index)
        {
            if (index>=0)
                if (this._document.doc.apparatus.exists==true && this._document.layout_mode==0 && 
                    index!=-1 && this._document.__ptpages[0].is_in_view(this._document.doc.apparatus.items[index])==false)
                {
                    if (this._document.layout_mode==0)//paratext pod textem
                    {
                        
                        var new_scroll_top=this._document.doc.apparatus.items[index].offsetTop;
                        this._document.__ptpages[0].scroll_to(new_scroll_top);
                    }
                }
        },
        mouseover_anchor(e)
        {
            /*this.highlight_ptitem(e.currentTarget.dataset["index"]);
            e.stopPropagation();*/
        },
        mouseleave_anchor(e)
        {
            /*this.remove_highlight();*/
        },
        highlight_ptitem(index)
        {
            /*this.remove_highlight();
            if (this._document.__ptpages[0].is_in_view(this._document.__ptitems[index])==false)    
                this._document.__ptpages[0].scroll_to(this._document.__ptitems[index].offsetTop);
            this._document.__ptitems[index].classList.add("pt_highlighted");*/
        },
        remove_highlight(anchors=false)
        {
            /*
            if (this._document.has_apparatus==true)
            {
                if (anchors==false)
                    var highlighted_items=this._document.__ptitems_container.parentNode.getElementsByClassName("pt_highlighted");
                else
                    var highlighted_items=this._document.__tpages[0].text_body.parentNode.getElementsByClassName("pt_highlighted");
                for (var i=0;i<highlighted_items.length;i++)
                {
                    highlighted_items[i].classList.remove("pt_highlighted");
                }
            }*/
        },
        
        center_anchor_in_view(e)
        {
            /*
            var index=e.currentTarget.parentElement.dataset["index"];
            var anchor=this._document.__anchors[index];
            var scrollContainer=this._document.__tpages[0].container.parentElement;
            this.cancel_scrolling_ontextscrolled=true;
            scrollContainer.scrollTop=anchor.offsetTop-(scrollContainer.clientHeight/2);
            */
        }
    }
    
    on_text_scrolled=(e)=>
    {
       this.obj_scrolling.text_scrolled();
    }
    show_info_banner=(text,additional_cls)=>
    {//zobrazíme nějakou informaci namísto textu 
        //(třeba že je text nedostupný nebo při synopsi, že se toto místo ve vybrané verzi nenachází)
        this.info_banner=div("mod_TxVw_document_info_banner "+additional_cls,this.__tpages[0].text_body,text);
    }
    hide_info_banner=()=>
    {
        if (this.info_banner!=null && this.info_banner!=undefined)
            this.info_banner.remove;
            this.info_banner=null;
    }


    
}

class cls_intext_box extends EventTarget
{
    constructor(_obj_intext_boxes,position,flags)
    {
        super();
        this._obj_intext_boxes=_obj_intext_boxes;
        this.c=div("intext_toolbox",position);
        this.content=div("intext_toolbox_content",this.c);
        if (flags.points_to==null)
            flags.points_to=position;

        //vyrobíme hubičku směřující k prvku, který box aktivoval
        this.pointer=div("intext_toolbox_pointer",this.c);
        //ukazuje doprostřed elementu
        this.pointer.style.left=flags.points_to.offsetLeft+(flags.points_to.offsetWidth/2)-this.c.offsetLeft;

        if (flags.class_name!=null)
        {
            this.class_name=flags.class_name;
            if (flags.keep_class_opened!=true)
            {
                this._obj_intext_boxes.close_boxes_of_class(flags.class_name)
            }
        }

        this.close_div=div("intext_toolbox_close",this.c,"close box");
        this.close_div.onclick=this.close;

        
    }
    close=(remove_from_array=true)=>
    {
        this.dispatchEvent(new CustomEvent("on_close_box",null));
        this.c.remove();
        if (remove_from_array==true)
        {
            this._obj_intext_boxes.close_box(this);
        }

    }
}

class cls_context_menu extends EventTarget
{

    constructor(_context,_document,caption_short,caption_expanded="",not_loaded=false)
    {//_context=html DOM p/div/s element
        super();
        this._document=_document;
        this.not_loaded=not_loaded;
        this.html_container=create_element("context_menu","",_context);
        if (not_loaded==true)
            this.html_container.classList.add("not_loaded");
        this.html_content=div("content",this.html_container,"");
        this.caption=div("context_menu_caption",this.html_content,caption_short); 
        if (caption_expanded=="")
            this.caption_expanded=caption_short;
        else
            this.caption_expanded=caption_expanded;
        this.caption_short=caption_short;
        this.captionExpanded=div("context_menu_expanded_caption",this.html_content,caption_expanded);
        this.items=[];
        this.mouse_over_item=false;
        this.html_container.onmouseleave=this.onmouseleave;
        this.html_container.onmouseenter=this.onmouseenter;
        this.close_timer=0;
        if (_context!=null)
            this.set_context(_context);
        return this;

    }
    
    set_context=(_context)=>
    {
        this._context=_context;
        this.html_container.style.height=_context.offsetHeight;
        _context.insertBefore(this.html_container,this._context.childNodes[0]);
    }
    create_item=(shortcut,caption,action,form)=>
    {
        var n_item=new cls_context_menu_item(this,shortcut,caption,action,form);
        this.items.push(n_item);
    }
    add_item=(item)=>
    {
        this.items.push(item);
    }
    onmouseleave=(e)=>
    {
        window.clearTimeout(this.close_timer);
        this.close_timer=window.setTimeout(this.hide_captions,200);
    }
    
    hide_captions=()=>
    {
        if (this.mouse_over_item==false)
        {
            var items=this.html_container.getElementsByClassName("context_menu_item_caption");
            for (var i=0;i<items.length;i++)
            {
                items[i].classList.remove("activate");
            }
        }
    }
    show_expanded_caption=()=>
    {
        this.captionExpanded.classList.remove("hidden");
    }
    hide_expanded_caption=()=>
    {
        this.captionExpanded.classList.add("hidden");
    }
    onmouseenter=(e)=>
    {
        
        for (var i=0;i<this._document.obj_context_selection.menus.length;i++)
        {
            this._document.obj_context_selection.menus[i].collapse();
        }
        this.expand();
        this.dispatchEvent(new CustomEvent("context_menu_activated",{detail:this}));
    }
    get_item=(shortcut)=>
    {
        for (var i=0;i<this.items.length;i++)
        {
            if (this.items[i].shortcut==shortcut)
                return this.items[i];
        }
        return null;
    }
    delete=()=>
    {
        this.html_container.remove();
        this.items=Array();
    }
    expand=()=>
    {
        this.html_container.classList.remove("collapsed");
    }
    collapse=()=>
    {
        this.html_container.classList.add("collapsed");
    }
}

class cls_context_menu_item
{
    constructor(context_menu,shortcut,caption,action,formHTML=null)
    {
        this._context_menu=context_menu;
        this.html_context_menu_content=context_menu.html_content;
        this.shortcut=shortcut;
        this.caption=caption;
        this.html_content_obj=null;
        this.action=null;
        
        if (typeof action ==="function")
            this.action=action;
        else
            this.html_content_obj=action;
        this.html_menu_pos=div("context_menu_item",this.html_context_menu_content,shortcut);
        //this.html_menu_pos.title=caption;
        this.html_menu_caption=div("context_menu_item_caption",this.html_menu_pos,caption);
        this.html_menu_pos.onmouseover=this.onmouseover;
        this.html_menu_caption.onmouseover=this.caption_onmouseover;
        this.html_menu_caption.onmouseleave=this.caption_onmouseleave;
        this.html_menu_pos.onclick=this.onclick;
        //this.html_menu_caption.onclick=this.onclick;
        this.formHTML=formHTML;
        this.form=null;
        this.append_formHTML(formHTML);
    }
    append_formHTML=(formHTML)=>
    {
        this.formHTML=formHTML;
        if (this.formHTML!=null)
        {
            if (this.form==null)
                this.form=div("context_menu_item_content_form",this.html_menu_caption)
            else
                this.form.innerHTML="";
            
            this.form.appendChild(this.formHTML);
        }
        else
        {
            if (this.form!=null)
            {
                this.form.remove();
                this.form=null;
            }

        }
    }
    caption_onmouseover=(e)=>
    {
        this._context_menu.mouse_over_item=true;
    }
    onmouseover=(e)=>
    {//při přejetí myší nad zkratkou musím schovat popisky ostatních prvku a zobrazit pro tento
        
        var items=this.html_context_menu_content.getElementsByClassName("context_menu_item_caption");
        for (var i=0;i<items.length;i++)
        {
            items[i].classList.remove("activate");
        }
        var caption=e.currentTarget.getElementsByClassName("context_menu_item_caption");
        caption=caption[0];
        caption.classList.add("activate");
        if (this._context_menu.close_timer!=0)
            window.clearTimeout(this._context_menu.close_timer);
        
    }
    caption_onmouseleave=(e)=>
    {
        this._context_menu.mouse_over_item=false;
        window.clearTimeout(this._context_menu.close_timer);
        this._context_menu.close_timer=window.setTimeout(this._context_menu.hide_captions,200);
    }
    onclick=(e)=>
    {
        if (this.action!=null)
        {
            this.action(this);
        }
    }
}

class cls_TxVw_text_section
{
    constructor(container,parent,mode)
    {
        this._parent=parent;
        this._document=parent;
        this._module=parent._module;
        this.section_container=div("mod_TxVw_text_section_container",container);
        
        this.text_container=div("mod_TxVw_text_container",this.section_container);
        
        this.nav_container=div("mod_TxVw_vertical_navigation_container",this.section_container);


        
        this.pages=[new cls_TxVw_page(this,this.text_container)];
        
        this._parent.__tpages=this.pages;
        

        this.text_container.onscroll=this._document.on_text_scrolled;
        
    }

    display=()=>
    {
        //nhrajeme, co jsme dostali od serveru
        this.section_container.classList.remove("display_none");
    }
    hide=()=>
    {
        this.section_container.classList.remove("display_none");
    }
    
}
class cls_TxVw_paratext_section
{
    constructor(container,parent,mode)
    {
        this._parent=parent;
        this._document=parent;
        this._module=parent._module;
        this.section_container=div("mod_TxVw_paratext_m0_section_container",container);
        this.resize_strip=div("mod_TxVw_paratext_m0_section_resize_div",this.section_container);
        this.paratext_container=div("mod_TxVw_text_container",this.section_container);
        this.nav_container=div("mod_TxVw_vertical_navigation_container",this.section_container);//čistě pro to, aby to vypadalo stejně jako sekce textu
        this.pages=[new cls_TxVw_page(this,this.paratext_container)];
        //this.paratext_container=div
        
        this._parent.__ptpages=this.pages;
        var me=this;

        this.resizing=
        {
            strip:div("mod_TxVw_paratext_m0_section_resize_div",this.section_container),
            _section:this,
            start_Y:0,
            pixel_to_percent:0,
            start(e)
            {
                this.start_Y=e.screenY;

                this.start_percent=100*this._section.section_container.offsetHeight/this._section._document.container.offsetHeight;
                this.pixel_to_percent=this.start_percent/this._section.section_container.offsetHeight,
                document.documentElement.onmousemove=this.move.bind(this);
                document.documentElement.onmouseup=this.end.bind(this);		
            },
            move(e)
            {
                var diff_Y=this.start_Y-e.screenY;
                var new_perc=this.start_percent+(diff_Y*this.pixel_to_percent);
                if (new_perc>5 && new_perc<95)
                    this._section.section_container.style.height=new_perc+"%";

                console.clear();
                console.log("this.start_Y: "+this.start_Y);
                console.log("diff_Y: "+diff_Y);
                console.log("new_perc: "+new_perc);
                console.log("this.start_percent: "+this.start_percent);
                console.log("this.pixel_to_percent: "+this.pixel_to_percent);

            },
            end(e)
            {
                document.documentElement.onmousemove=null;
                document.documentElement.onmouseup=null;	
            }
        };
        this.resizing.strip.onmousedown=this.resizing.start.bind(this.resizing);
    }

    
    display=()=>
    {
        //nhrajeme, co jsme dostali od serveru
        this.section_container.classList.remove("display_none");
    }
    hide=()=>
    {
        this.section_container.classList.remove("display_none");
    }
    paratext_item_clicked=(e)=>
    {
        
    }
    hide=(clean_content=true)=>
    {
        this.section_container.classList.add("display_none");
        if (clean_content==true)
            this.pages[0].clean
    }

    
	resizing_sectinos_move=(e)=>
	{
        var diff_Y=e.clientY-this.resizing.start_Y;
        var new_height=this.resizing_section_height+diff_Y;
        var perc=(new_height/this._0_.offsetHeight)*100;
        this.resize_sections(perc);
        this._1_text_and_nav_container.style.height=perc+"%";
        this._6_paratext_wrapper.style.top=perc+"%";
        this._6_paratext_wrapper.style.height=(100-(perc+2))+"%";
    }
	resizing_sectinos_end=(e)=>
	{
        document.documentElement.removeEventListener('mousemove', this.resizing_sectinos_move, false);
        document.documentElement.removeEventListener('mouseup', this.resizing_sectinos_end, false);
    }
    resize_sections=(text_section_size_in_perc)=>
    {
        this._1_text_and_nav_container.style.height=text_section_size_in_perc+"%";
        this._6_paratext_wrapper.style.top=text_section_size_in_perc+"%";
        this._6_paratext_wrapper.style.height=(100-(text_section_size_in_perc+2))+"%";
    }
    
    
    
}

class cls_TxVw_page
{
    constructor(parent,container)
    {
        this._parent=parent;
        this._module=parent._module;
        this._document=parent._document;
        
        //this.layout_obj=layout_obj;
        this.left=div("mod_TxVw_text_section_left",container);
        
        
        this.container=div("mod_TxVw_page_container",container)
        this.right=div("mod_TxVw_text_section_right",container);
        
        this.left_margin=div("mod_TxVw_page mod_TxVw_page_left_margin",this.container);
        this.text_body=div("mod_TxVw_page mod_TxVw_page_body",this.container);//obsahuje hlavní text
        this.right_margin=div("mod_TxVw_page mod_TxVw_page_right_margin",this.container);
        

        this.obj_onresized=
        {
            _page:this,
            ev(e)
            {
                //při změně rozměru kontajneru stránky musíme změnit i rozložení poznámek
                //this._page.obj_inpage_paratext.adjust(this._page.obj_inpage_paratext);
                this._page
            }
        }
        
        this._module.parent_slot.inner_div.addEventListener("slot_resized",this.obj_onresized.ev.bind(this.obj_onresized));//.ev_resized=this.obj_onresize.ev.bind(this.obj_onresize);
        this.container.addEventListener("mouseover",this.on_mouseover);
        
        var mypage=this;
        
        this.obj_inpage_paratext=
        {
            _page:mypage,
            _document:mypage._document,
            container:div("display_none mod_TxVw_paratext_container_m1",this.container),
            tmp_placeholder:div("display_none mod_TxVw_paratext_container_m1 display_none",this.container),/*zobrazen při nahrávání paratextu, aby zůstala šířka textu, ale container paratextu mohl mít kvůli rychlost dispaly_none*/
            display(e)
            {
                this.container.innerHTML="";
                this.container.classList.remove("display_none");
                
                this.last_tbody_width=this._page.text_body.offsetWidth;
                this.last_ptdiv_width=this.container.offsetWidth;
                this.observer_timer=window.setInterval(this.size_observer,500,this);

                this.top_strip=div("mod_TxVw_page_top_strip");
                if (this.container.childNodes.length>0)
                    this.container.insertBefore(this.top_strip,this.container.childNodes[0]);
                else
                    this.container.appendChild(this.top_strip);
            },
            
            
            hide()
            {
                this.container.classList.add("display_none");
                
            }
        };
        /*this.top_margin=div();
        this.bottom_margin=div();
        this.header=div();
        this.footer=div();*/
        
        
        
    }
    is_in_view=(element)=>
    {
        if (element==null)
            return false;
        if (element.offsetTop>this.container.parentElement.scrollTop && element.offsetTop<this.container.parentElement.scrollTop+this.container.parentElement.clientHeight)
            return true;
        else
            return false;
    }
    set_text_html=(html)=>
    {
        this.left_margin.innerHTML="";
        this.right_margin.innerHTML="";
        this.text_body.innerHTML="";
        this._parent.display();
        
        this.text_body.innerHTML=html;
        

        //for case images are not loading: the empty "img" elements can grow extremely height for some unknown reason...
        this._document.obj_images.process_img_errors(this.text_body);

        return this.text_body.getElementsByClassName("text")[0];
    }  


    clean=()=>
    {
        this.left_margin.innerHTML="";
        this.right_margin.innerHTML="";
        this.text_body.innerHTML="";
        this.obj_inpage_paratext.container.innerHTML="";
        this.obj_inpage_paratext.ptitems=null;
        
    }
    scroll_to(value)
    {
        this.container.parentNode.scrollTop=value;
    }
    on_mouseover=(e)=>
    {
        e=e;
    }
    
    
}




class cls_text_viewer_options
{
    constructor (text_viewer)
    {
        this.container=null;
        this.txtVw=text_viewer;
    }
    show()
    {
        if (this.container==null)
        {
            this.container=div("absolute bc_white",this.txtVw._1_text_and_nav_container);
            this.container.style.opacity="0.95";
            this.container.style.width="70%";
            this.container.style.height="70%";
            this.container.style.left="15%";
            this.container.style.top="15%";
            var ppw = new cls_popup_window(this.container);
        }
    }
}

class cls_TxVw_milestones_set
{
    constructor(d,settings=null)
    {
        this.all_items=Array();
        this.items_on_level=Array();
        this._document=d;
        this._text=d.doc.text_html_node;//přímo html div s @class="text", sám kontajner textu
        if (settings==null || settings=="hierarchy")//defaultní hierarchické milestony
        {
            this.type="hierarchy";
            this.all_items=this._text.getElementsByClassName("hierarchy");
            var i=0;

            do
            {
                var items=this._text.getElementsByClassName("hlvl_"+i);
                i++;
                if (items.length>0)
                    this.items_on_level.push(items);
            }
            while(items.length>0)
        }
        var a=1;
    }
}


class cls_milestone_old
{
    constructor(type,display,title,text_html,parent_obj)
    {
        this.parent_obj=parent_obj;
        this.active_ms_id="";
        if (type=="hierarchy")
        {
            this.type="hierarchy";
            this.description="Default XML structure";
            this.display="";
            
            var lvl_0=text_html.getElementsByClassName("hlvl_0");//hierarchy_level: najdeme si takovou úroveň hierarchie, kde je víc než jeden prvek. Jinak nemá smysl to v navigaci ukazovat
            if (lvl_0.length>1)
                this.nodes=lvl_0;
            else
            {
                var lvl_1=text_html.getElementsByClassName("hlvl_1");
                if (lvl_1.length>1)
                    this.nodes=lvl_1;
                else
                {
                    var lvl_2=text_html.getElementsByClassName("hlvl_2");
                    if (lvl_2.length>1)
                        this.nodes=lvl_2;
                    else
                        this.nodes=lvl_0;
                }
            }

            
        }
        else
        {
            
            this.type=type;
            this.description=type;
            this.display=display;
            this.nodes=text_html.querySelectorAll("milestone[type='"+type+"']");
            var text_div=parent_obj.__text.getElementsByClassName("text")[0];
            if (title!="false" && title!="null" && title!="")//nechceme mít žádný popisek (třeba u inline zobrazených milestones)
                this.label=document.createElement("div");
            else
                this.label=null;
            

            var anchor=document.createElement("div");
        
            if (this.display=="left_margin")
                anchor.classList.add("left_margin_milestone_anchor");
            else if (this.display=="right_margin")
                anchor.classList.add("right_margin_milestone_anchor");
            
            
            if (this.label!=null)
            {
                this.label=div("margin_milestone_label",anchor);
                this.label.title=title;
            }
            parent_obj.__text.insertBefore(anchor,text_div);
        }

    }
    on_text_scrolled=(scroll_top)=>
    {
        var found=false;
        var prev_active_id=this.active_ms_id;
        for (var i=0;i<this.nodes.length;i++)
        {
            if (scroll_top>this.nodes[this.nodes.length-1].offsetTop)
            {
                if (this.label!=null)//label=null je defaultně u typu hierarchy, lze i nastavit (třeba v bibli u čísel řádků)
                {
                    this.label.innerHTML=this.nodes[this.nodes.length-1].attributes["label"].value;
                    this.label.classList.add("block");
                    this.label.classList.remove("hidden");
                }
                found=true;
                this.active_ms_id=this.nodes[this.nodes.length-1].id;
                break;
            }
            else if (this.nodes[i].offsetTop-15>scroll_top)
            {
                if (i>0)
                {
                    //document.title+=this.type+": " +this.nodes[i-1].attributes["value"].value+" ";
                    if (this.label!=null)
                    {
                        this.label.innerHTML=this.nodes[i-1].attributes["label"].value;
                        this.label.classList.add("block");
                        this.label.classList.remove("hidden");
                    }
                    found=true;
                    
                    this.active_ms_id=this.nodes[i-1].id;
                }
                break;
            }
            
                
        }
        if (found==false && this.label!=null)
        {
            this.active_ms_id="";
            this.label.classList.add("hidden");
            this.label.classList.remove("block");
        }
        if (prev_active_id!=this.active_ms_id)//aktivní prvek se změnil, spustíme událost
        {
            var e=new CustomEvent('active_milestone_changed',{detail:{ms_type:this.type,new_active_ms_id:this.active_ms_id}});
            dispatch_event(e);
        }
            
    }
}
class cls_milestones_old
{
    constructor(milestone_settings_array, text_html,parent_obj)
    {
        this.ms=Array();
        this.ms_settings=Array();
        this.parent=parent_obj;
        
        var mss={type:"hierarchy",display:"",title:""};
        this.ms_settings.push(mss);
        var tmp=new cls_milestone("hierarchy","","",text_html);//přidáme i defaultní: struktura (divy)
        this.ms.push(tmp);
        
        mss={type:"pagebreak",display:"right_margin",title:"Page nr."};
        this.ms_settings.push(mss);
        tmp=new cls_milestone("pagebreak","right_margin","Page nr.",text_html,parent_obj);//přidáme i defaultní: zlomy stránek
        this.ms.push(tmp);
        for (var i=0;i<milestone_settings_array.length;i++)
        {
            
            var ms=milestone_settings_array[i];
            var mss={type:ms.getElementsByTagName("type")[0].textContent,display:ms.getElementsByTagName("display")[0].textContent,title:ms.getElementsByTagName("title")[0].textContent};
            this.ms_settings.push(mss);
            
            var tmp=new cls_milestone(mss.type,mss.display,mss.title,text_html,parent_obj);
            this.ms.push(tmp);
        }
        
        
        
    }
    on_text_scrolled=(scroll_top)=>
    {
        document.title="";
        for (var i=0;i<this.ms.length;i++)
        {
            this.ms[i].on_text_scrolled(scroll_top);
        }
    }
}

class cls_TxVw_vertical_navigation
{
    constructor(container,d)
    {
        this.container=container;
        this._document=d;
        this.displayed_hierarchy_levels=Array();
    }
    hide=()=>
    {
        this._document.container.classList.add("hide_vnav");
    }
    show=()=>
    {
        this._document.container.classList.remove("hide_vnav");
    }
    clear()
    {
        this.container.innerHTML="";
        this.displayed_hierarchy_levels=Array();
    }
    add_hierarchy_level(level,skip_empty,parent_level_pid)
    {//0=nejvyšší právě nahraná úroveň
        var exists=null;
        for (var i=0;i<this.displayed_hierarchy_levels.length;i++)
        {
            if (this.displayed_hierarchy_levels[i].level==level)
            {
                //tato úroveň už je vytvořena
                exists=this.displayed_hierarchy_levels[i];
            }
        }
        if (exists==null)
        {
            var new_level=new cls_TxVw_vertical_navigation_level(null,this,"hierarchy",level,skip_empty,null,parent_level_pid);
            this.displayed_hierarchy_levels.push(new_level);
        }
        else
        {
            exists.set_parent_pid(parent_level_pid,skip_empty,level);
        }
    }
    
}
class cls_TxVw_vertical_navigation_level
{
    constructor(container,parent,ms_type="hierarchy",level=0,skip_empty=true,xml_to_use=null,parent_level_pid="")
    {
        //skip_empty=pokud máme vytvořit navigaci na úrovni,kde je 1 prvek, použijeme místo toho úroveň následující 
        if (container==null)
        {
            this.container=div("TxVw_vertical_nav_one_level_container",parent.container);
        }
        else
            this.container=container;
        
        this._parent=parent;
        this._document=this._parent._document;
        this._mss=this._document.doc.milestones_sets;
        this.ms_type=ms_type;

        this.set_parent_pid(parent_level_pid,skip_empty,level);
        
        
    }
    set_parent_pid(parent_level_pid,skip_empty,level)
    {
        this.container.innerHTML="";
        var milestones=Array();
        if (this.ms_type=="hierarchy")
        {
            this.level=level;
            var ms_level_to_use=level;
            if (skip_empty==true)
            {//najdeme si úroveň, kterou skutečně chceme zobrazovat
                for (var i=ms_level_to_use;i<this._mss[0].items_on_level.length;i++)
                    if (this._mss[0].items_on_level[i].length>1)
                    {
                        ms_level_to_use=i;
                        break;
                    }
            }
            
        }
        
        if (ms_level_to_use>0 && parent_level_pid!="")
        {//musíme vyfiltrovat jenom ty, které patří do požadované sekce
            for (var i=0;i<this._mss[0].items_on_level[ms_level_to_use].length;i++)
            {
                if (this._mss[0].items_on_level[ms_level_to_use][i].parentNode.id==parent_level_pid)
                    milestones.push(this._mss[0].items_on_level[ms_level_to_use][i]);
            }
        }
        else
            milestones=this._mss[0].items_on_level[ms_level_to_use];

        this.text_height=milestones[0].parentNode.offsetHeight;
        this.section_height=this._document.text_section.section_container.offsetHeight;

        this.pointer_height=(this.section_height/this.text_height)*100;

        this.sections=Array();

        for (var i=0;i<milestones.length;i++)
        {
            var start_perc=((milestones[i].offsetTop-milestones[0].offsetTop)/this.text_height)*100;
            //ono  -milestones[0].offsetTop je proto, abychom se zarovnali od 0%, protože pokud otevřeme nějakou nižší úroveň
            //začínají její milestone až kdovíkde v dokumentu
            var height_perc=(milestones[i].offsetHeight/this.text_height)*100;
            var d=div("mod_TxVw_vertical_nav_section",this.container);
            d.style.top=start_perc+"%";
            d.style.height=height_perc+"%";
            d.title=this._document.normalize_header(milestones[i].getElementsByClassName("head"));
            this.sections.push(d);
            //d.addEventListener("click",this.open_next_level_request)
            d.addEventListener("click",this.scroll_to_position)
            d.dataset["pid"]=milestones[i].id;
        }
    }
    scroll_to_position=(e)=>
    {
        var pid=e.target.dataset["pid"];
        var correspondent_div=this._document.doc.text_html_node.getElementsByClassName("hierarchy");
        for (var i=0;i<correspondent_div.length;i++)
        {
            if (correspondent_div[i].id==pid)
                this._document.__tpages[0].scroll_to(correspondent_div[i].offsetTop - 70);
        }
    }
    open_next_level_request=(e)=>
    {
        var pid=e.target.dataset["pid"];
        this._parent.add_hierarchy_level(this.level+1,true,pid);
    }
}


class cls_TxVw_vertical_navigation_old
{
    
    constructor(container,d,TxVw)
    {//c=container (kde bude navigace zobrazena), d=data(odkud se berou data pro tvorbu navigace),TxVw=objekt mateřského modulu prohlížeče textu
        
        container.innerHTML="";
        this.container=container;
        this.txvw=TxVw;
        this.total_height=Number(d.getElementsByClassName("text")[0].clientHeight);
        
        this.text_height=TxVw.text_section.text_container.scrollHeight;
        this.text_window_height=TxVw.text_section.section_container.clientHeight;
        var pointer_height=(this.text_window_height/this.text_height)*100;//this.text_window_height;
        
        
        this.pointer=document.createElement("div");
        this.pointer.classList.add("mod_TxVw_vertical_nav_pointer");
        this.pointer.style.height=pointer_height+"%";
        
        //this.txvw._4_text_container.addEventListener("text_scrolled",this.on_text_scrolled);
        //this.txvw._4_text_container.addEventListener("first_visible_div_changed",this.on_first_visible_div_changed);
        container.appendChild(this.pointer);
        
        this.active_ms_type=0;
        
        
        
        if (this.txvw.milestones.ms.length>1)
        {
            this.btn_select_type=button("",container,"+",true, this.create_selection);//div("mod_TxVw_vertical_nav_select_type_btn",c,"<");
            this.btn_select_type.classList.add("mod_TxVw_vertical_nav_select_type_btn");
        }
        this.generate_navigation(this.txvw.milestones.ms[this.active_ms_type].type);
        
        
    }
    create_selection=(e)=>//dialog pro výběr druhu zbrazených prvků
    {
        var d=div("mod_TxVw_vertical_nav_select_type_div",this.container);
        this.select_dialog=new cls_popup_window(d);
        div("",d,"Select unit type");
        for (var i=0;i<this.txvw.milestones.ms_settings.length;i++)
        {
            var d2=div("",d);
            var rb=radiobutton("",d2,this.txvw.milestones.ms[i].description,this.active_ms_type==i,"","vertical_nav_type");
            rb.addEventListener("click",this.rb_selection_clicked);
            rb.dataset["index"]=i;
        }
    }
    rb_selection_clicked=(e)=>
    {
        this.active_ms_type=e.currentTarget.dataset["index"];
        this.generate_navigation(this.txvw.milestones.ms[this.active_ms_type].type);
    }
    generate_navigation(milestone_type)
    {
        if (milestone_type!="")
        {
            this.ms_type=milestone_type;
            this.active_ms_type=-1;

            for (var i=0;i<this.txvw.milestones.ms_settings.length;i++)
            {
                if (this.txvw.milestones.ms_settings[i].type==milestone_type)
                    this.active_ms_type=i;
            }
        }
        var mss=this.txvw.milestones.ms[this.active_ms_type].nodes;
        
        var prev_d=null;
        var prev_t=0;
        this.l0=[];
        var old_divs=this.container.getElementsByClassName("mod_TxVw_vertical_nav_section");
        for (i=old_divs.length-1;i>=0;i--)
            old_divs[i].remove;
        
        for (var i=0;i<mss.length;i++)
        {
            var ac_t=100*(Number(mss[i].offsetTop)/this.total_height);
            var div=document.createElement("div");
            div.classList.add("mod_TxVw_vertical_nav_section");
            div.style.top=ac_t+"%";
            //
            div.dataset["path_id"]=mss[i].id;
            if (milestone_type!="hierarchy")
            {
                div.title=mss[i].attributes["label"].value;
            }
            else
            {
                var first_head=mss[i].getElementsByClassName("head")[0];
                if (first_head!=null)
                {
                    //attributes["path_id"]
                    div.title=first_head.textContent.replace(/\n/g," ");
                    div.title=div.title.trim();
                }
            }
            
            div.addEventListener("click",this.on_clicked);
            
            
            if (prev_d!=null)
            {
                prev_d.style.height=(Number(ac_t)-Number(prev_t))+"%";
            }
            prev_d=div;
            prev_t=ac_t;
            this.container.appendChild(div);
            this.l0.push(div);
        }
        if (prev_d!=null)
            prev_d.style.height=(100-prev_t)+"%";
   
    }
    on_clicked=(e)=>
    {
        var id=e.target.dataset["path_id"];
        var head=document.getElementById(id);
        this.txvw._4_text_container.scrollTop=head.offsetTop-100;
    
    }
    on_mouse_over(e)
    {
    }
    on_text_scrolled=(e)=>
    {
        var t=(Number(e.target.scrollTop)/Number(e.target.scrollHeight))*100;
        this.pointer.style.top=t+"%";

    }
    on_first_visible_div_changed=(e)=>
    {   
        return 0;
        var me=this;
        var l0_changed=function(active)
        {//pokud se změnila pozice na nejvyšší úrovni hierarchie, vygenerujeme i navigaci pro druhou úroveň aktivní sekce
            for (var i=0;i<me.l0_sections.length;i++)
            {
                if (me.l0_sections[i].dataset["path_id"]==active.id)
                {
                    me.l0_sections[i].classList.add("mod_TxVw_vertical_nav_section_selected");
                    if (active!=null)
                    {
                        var ch=active.children;
                        var last_t=0;
                        var ac_t=0;
                        var total_height=active.clientHeight;
                        var prev_d=null;
                        var prev_t=null;
                        for (var j=0;j<ch.length;j++)
                        {
                            if (ch[j].classList.contains("hierarchy"))
                            {
                                ac_t=100*(Number(ch[j].offsetTop-active.offsetTop)/total_height);
                                var d=document.createElement("div");
                                d.classList.add("mod_TxVw_vertical_nav_section_l2");
                                d.style.top=ac_t+"%";
                                d.dataset["path_id"]=ch[j].id;
                                if (prev_d!=null)
                                {
                                    prev_d.style.height=(ac_t-prev_t)+"%";
                                }
                                me.l1_sections.push(d);
                                prev_d=d;
                                prev_t=ac_t;
                                me.l0_sections[i].appendChild(d);
                            }
                        }
                        if (prev_d!=null)
                            prev_d.style.height=(100-prev_t)+"%";
                    }
                }
                else
                {
                    me.l0_sections[i].classList.remove("mod_TxVw_vertical_nav_section_selected");
                    me.l0_sections[i].innerHTML="";
                }
            }
        }
        
        var ac=e.detail.divs;
        if (this.last_active_sections_id.length==0)
        {
            l0_changed(ac[ac.length-1]);
        }
        else if (this.last_active_sections_id[this.last_active_sections_id.length-1]!=ac[ac.length-1].id)
        {
            l0_changed(ac[ac.length-1]);
        }

        
        this.last_active_sections_id=[];
        for (var i=0;i<ac.length;i++)
            this.last_active_sections_id.push(ac[i].id);
    }
    
}