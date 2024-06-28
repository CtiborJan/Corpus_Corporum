var content_viewer_loaded=true;
class cls_smod_content_viewer
{
    constructor()
    {
        this.div=document.createElement("div");
        this.lst=null;
    }
    ns_resolver(prefix="")
    {
        return 'http://mlat.uzh.ch/2.0';
    }
 
    show_contents(path_or_xml,on_item_clicked=null,on_dropdown_opened=null,extended_list=false)
    {
        var me=this;
        this.lst=new list_control("lst_cw",this.div,false,false,false);
        var process_data=function(data)
        {
            if (list_control_module_loaded==true)
            {
                var dtype=data.evaluate("cc:navigation/cc:last_step/cc:item/@type",data,me.ns_resolver);
                dtype=dtype.iterateNext();
                dtype=dtype.textContent;
                
                me.lst.process_data(data,get_schema(dtype));
            }
            else
                return document.createTextNode("Error: List control module not loaded!");
        }
        
        if (typeof path_or_xml==="string")
        {
           this.lst.get_data_from_server(url+"php_modules/navigate.php?load="+path_or_xml,process_data);
            
        }
        else
        {
            process_data(path_or_xml);
        }
        var get_schema=function(dtype)
        {
            if (dtype=="text")
                return "<schema><row dropdown='false' title='Corpus'>cc:navigation/cc:contents/cc:table_of_contents/cc:contents</row>\n\
            <column highlight='' name='cap' label='' width='' on_empty='[...]'>cc:head</column>\n\
            <column hidden='true' name='idno'>./@pid</column>\n\
            </schema>";
        }

    }
    
    
}
