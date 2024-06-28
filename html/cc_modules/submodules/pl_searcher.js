var cls_smod_pl_searcher_loaded=true;
class cls_smod_pl_searcher
{
    constructor()
    {
        
    }
    add_me_to_page=(after)=>
    {
        this.container=document.createElement("div");
        after.parentNode.insertBefore(this.container,after.nextSibling);
        span("bold",this.container,"Enter PL volume and column ");
        span("", this.container,"(e. g. 12 34A or 12, 34A): ");
        this.txt=textbox("",this.container);
        this.btn=button("",this.container," &nbsp; Go &nbsp; ");
	this.btn.addEventListener("click",this.submit);
        this.results_div=div("",this.container);
        this.db_searcher=new cls_smod_simple_db_searcher(null,false,null,this.results_div);
        this.txt.addEventListener("keypress",this.submit);
        this.db_searcher.mode="load_text";
    }
    submit=(e)=>
    {
        if (!(kb_click(e))) return false;
        //if ((e.type=="keypress" && e.keyCode==13) || e.type=="click")
        {
            this.db_searcher.submit_simple_query("PL "+this.txt.value,"PL");
        }
    }
    
}
