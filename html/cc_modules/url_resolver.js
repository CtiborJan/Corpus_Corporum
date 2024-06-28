var url_resolver=true;
class cls_url_resolver
{
    constructor(url)
    {
        this.resolve_url(url);
    }
    resolve_url(url)
    {
        this.browser_opened=false;
        var url_params=new URLSearchParams(url.search.replace("%26","&"));
        this.requested_path="";
        this.requested_text="";
        this.initial_hash=window.location.hash;
        
        var pathname=url.pathname.replace("/CC2","");
        
        
        if (url_params.get("w")!=null)
        {
//             navigate_request=new CustomEvent('navigate_request',{
//                 detail:{path:url_params.get("w"),path_to_focus:""}});
            this.requested_path=url_params.get("w");
        }
        else if (url_params.get("path")!=null)
        {
//             navigate_request=new CustomEvent('navigate_request',{
//                 detail:{path:url_params.get("w"),path_to_focus:""}});
            this.requested_path=url_params.get("path");
            if (this.requested_path.match(/^cps_[0-9]+\.[0-9A-Za-z.]+/) || this.requested_path.match(/[0-9]+:.*/))//cc_id of some text - we open it
                this.requested_text=this.requested_path;

        }
        else if (url_params.get("tabelle")!=null)
        {
            //Perpetuus_Turonensis_cps2
//             navigate_request=new CustomEvent('navigate_request',{
//                 detail:{path:"tabelle:"+url_params.get("tabelle"),path_to_focus:""}});
            this.requested_path="tabelle:"+url_params.get("tabelle");
        }     
        else if (url_params.get("c")!=null)
        {   
            var c=url_params.get("c");
            if (c.match(/^cps_/)==null)
                c="cps_"+c;
//             navigate_request=new CustomEvent('navigate_request',{
//                 detail:{path:c,path_to_focus:""}});
            this.requested_path=c;
        }
        else if (url_params.get("app")=="home" || pathname=="/home")
        {
            this.requested_path="home";          
        }
        else if (url_params.get("app")=="browser" || pathname.match(/^\/browser/))
        {
            this.requested_path=pathname.match(/^\/browser(.*)/);
            if (this.requested_path[1]!="")
                this.requested_path=this.requested_path[1];
            else
                this.requested_path="/";
        }
        else if (url_params.get("app")=="dictionaries" || pathname.match(/^\/dictionaries/))
        {
            this.open_dictionaries();
        }
        else if (url_params.get("app")=="bible" || pathname.match(/^\/bible/))
        {
            this.open_biblical_synopsis();
        }
        else
        {
            this.requested_path="home";
        }


        if (url_params.get("text")!=null)
        {
            this.requested_text=url_params.get("text");
        }
        
        if (this.requested_path=="home" && this.requested_text=="")
        {
            this.open_homepage();
        }
        else if (this.requested_path!="")
        {

            this.open_browser(this.requested_path);
            //document.getElementById("base").dispatchEvent(navigate_request);
        }
        
        if (this.requested_text!="")
        {
            var open_text_request=new CustomEvent('load_text_request',{
                detail:{path:this.requested_text,hash:this.initial_hash,path_to_focus:url_params.get("focus")}});
            dispatch_event(open_text_request);
        }

        window.onhashchange=this.hash_changed;
    }
    hash_changed=(e)=>
    {
        
    }
    open_homepage=()=>
    {
        var module;
        module=new cls_mod_home(B.slot);           
        B.slot.activate_module(0);  
    }
    open_dictionaries=()=>
    {
        var module;
        module=new cls_mod_dictionaries(B.slot);           
        B.slot.activate_module(0);
    }
    open_biblical_synopsis=()=>
    {
        var module;
        module=new cls_mod_text_viewer(B.slot);
        module.add_new_document("","",1);
        module.add_new_document("","",1);
        
        B.slot.activate_module(0);
    }
    open_browser=(path)=>
    {
        if (this.browser_opened==false)
        {
            this.browser_opened=true;
            var slot2=B.slot.add_slot(["flex","flex_vertical"],"4");
            var slot3=B.slot.add_slot(["flex","flex_vertical"],"2");
            var slot4=slot3.add_slot(["flex","flex_vertical"]);
            //slot3.add_slot(["flex","flex_vertical"]);
            var module;
            //module=new cls_mod_home(B.slot);

            module=new cls_mod_browser(slot2,path);
            module=new cls_mod_text_viewer(slot2,0);
            module=new cls_db_search(slot4,"fd",1);
            
            B.main_slot=slot2;
            //module=new cls_image_viewer(fslot);
            
            slot2.activate_module(0);  
        }
    }
}
