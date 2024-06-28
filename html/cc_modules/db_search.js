var db_search=true;
class cls_db_search extends cls_mod
{
    constructor(parent_slot,submodules="sfd",control_mode=0)
    {//submodules:s=simple db searcher;f=fulltext;d=dictionary
     //control_mode:0=explicite (každý submodul má své olvádací prvky); 1=zhuštěné (1 ovl. prvek);
        super(parent_slot);
        this.taskbar_text="S";
        this.taskbar_color="black";
        this.taskbar_bckg_color="lightblue";
        this.control_mode=control_mode;
        this.module_name="Database searching";
        this.module_description="Enables searching in the database.";
        this.submodules=submodules;
        this.my_index=this.parent_slot.add_module(this)-1;
        this.wrapper=div("full_div flex_column",this.module_container);
        
        if (control_mode>0)
            this.create_default_controls();
        for (var i=0;i<this.submodules.length;i++)
            this.load_submodule(this.submodules.substr(i,1));
        
        
        
    }
    create_default_controls=()=>
    {
        var input_box=div("",this.wrapper);
        input_box.style.flex="0 0b 60px";
        this.input_textbox=textbox("textbox",input_box,"",true,this.default_textbox_keypress);
        var buttons_wrapper=div("block",input_box);
        this.btn_show_options=button("inline-block height_25 width_25 settings_wheel float_right",buttons_wrapper,"",true,this.show_hide_options);
        this.btn_show_help=button("inline-block height_25 float_right",buttons_wrapper,"help",true,this.show_help);
        
        this.options=div("b_margin_10",input_box);
        //this.options.style.display="none";
        if (this.control_mode==1)
            this.results_header=div("height_25p ",this.wrapper,"");
        
        this.results_wrapper=div("relative bottom", this.wrapper);
        this.results_wrapper.style.flex="10 1 100px";
        this.results_wrapper.style.overflow="auto";
        
        if (this.control_mode==2)
            this.results=div("",this.results_wrapper);
        else
        {
            
            
            this.results_fs_header=radiobutton("rbt_switch_results_fs",this.results_header,"Full-text search results",false);
            this.results_fs_header.name="search_results_div_header";
            this.results_fs_header.dataset["type"]="fs";
            this.results_fs_header.addEventListener("click",this.rb_select_results_set_clicked);
            
            this.results_dict_header=radiobutton("rbt_switch_results_dict",this.results_header,"Dictionary lookup results",false);
            this.results_dict_header.name="search_results_div_header";
            this.results_dict_header.dataset["type"]="dict";
            this.results_dict_header.addEventListener("click",this.rb_select_results_set_clicked);
            
            this.results_fs=div("sm_results_div",this.results_wrapper);
            this.results_fs.dataset["type"]="fs";
            this.results_dict=div("sm_results_div",this.results_wrapper);
            this.results_dict.dataset["type"]="dict";
        }
    }
    show_help=(e)=>
    {
        if (!(kb_click(e))) return false;
        window.open("search_help.html","Search help","width=600,height=600");
    }
    rb_select_results_set_clicked=(e)=>
    {//přepínání mezi výsledky z posledního hledání ve slovníku/fulltextu
        if (e.currentTarget.dataset["type"]=="dict")
        {
            this.results_fs.classList.add("display_none");
            this.results_dict.classList.remove("display_none");
        }
        else
        {
            this.results_fs.classList.remove("display_none");
            this.results_dict.classList.add("display_none");
        }
    }
    load_submodule=(sm)=>
    {
        if (this.control_mode>0)
        {
            var txt=this.input_textbox;
            var opts=this.options;
            if (this.control_mode==1)
            {
                if (sm=="f")
                    res=this.results_fs;
                else if (sm=="d")
                    res=this.results_dict;
            }
            else
                res=this.results;
        }
        else
        {
            var txt=null;
            var res=null;
            var opts=null;
        }
        var ac_smod=null;
        if (sm=="s")
        {
            this.simple_searcher=new cls_smod_simple_db_searcher(this.wrapper);
            ac_smod=this.simple_searcher;
        }
        else if (sm=="f")
        {
            this.fulltext_searcher=new cls_smod_fulltext_searcher(this.wrapper,txt,res,opts);
            ac_smod=this.fulltext_searcher;
        }
        else if (sm=="d")
        {
            this.dictionary_lookup=new cls_smod_dictionary_lookup(this.wrapper,txt,res,opts);
            ac_smod=this.dictionary_lookup;
        }
        
        if (this.control_mode==1)
        {
            var btn_submit=button("font_75p inline-block",null,ac_smod.submit_btn_label,true,ac_smod.submit_button_clicked);
            this.btn_show_options.parentNode.insertBefore(btn_submit,this.btn_show_options);
        }
    }
    results_of_submodule_received=(sm)=>
    {
        if (sm=="f")
        {
            if (this.results_dict!=null)
                this.results_dict.classList.add("hidden");
        }
        else if (sm=="d")
            if (this.results_fs!=null)
                this.results_fs.classList.add("hidden");
            
    }
    show_hide_options=(e)=>
    {
        if (!(kb_click(e))) return false;
        if (this.options.style.display=="none")
            this.options.style.display="block";
        else
            this.options.style.display="none";
    }
    default_textbox_keypress=(e)=>
    {
    }
    
}
