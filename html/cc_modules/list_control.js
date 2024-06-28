var list_control_module_loaded=true;
class list_control
{
    constructor(name,outer_container,show_list_header=false,show_footer=false,show_tbl_header=true)
    {
        if (name=="")
            name="lst";
        
        var unique_name=name;//zajistíme si unikátní jméno. Je důležité, protože se používá jako část jména třídy u listitems -
        //abychom byli schopni při rozvíracím seznamu správně identifikovat položky jednotlivých seznamů (aby neměly všechny stejnou třídu, a tudíž byly nerozlišitelné)
        var i=1;
        while (document.getElementById(unique_name)!=null)
        {
            unique_name=name+"_"+i;
        }
        name=unique_name;
        
        this.name=name;
        outer_container.style.display="flex";
        outer_container.style.flexDirection="column";
        this.header=this.create_list_header();
        this.tbl_container=document.createElement("div");
        this.tbl=document.createElement("table");//table
        this.footer=this.create_list_footer();
        
        if (show_list_header==false)
            this.header.style.display="none";
        else
            this.header.style.display="block";
        
        this.tbl_container.classList.add("list_tbl_container");
        this.footer.classList.add("list_footer");
        if (show_footer==false)
            this.footer.style.display="none";
        else
            this.footer.style.display="block";
        
        this.tbl.classList.add("list_tbl");
        this.show_tbl_header=show_tbl_header;
        this.sticky_theader=true;
        this.multiselect_mode=1;//0=off, 1=normal (working SHIFT, CTRL), 2=only CTRL
        this.shift=false;
        this.ctrl=false;
        this.selection=new cls_list_selection(this);
        this.pointer=true;
        
        this.tbl_container.appendChild(this.tbl);
        this.metadata=[];
        this.dropdown_auto_expand=false;
        this.item_count=0;
        this.list_items_padded=false;
        this.total_rows=0;
        this.count_of_selected=0;
        this.count_of_visible=0;
        
        outer_container.appendChild(this.header);
        outer_container.appendChild(this.tbl_container);
        outer_container.appendChild(this.footer);
    
    }
    
    
    
    create_list_header=()=>
    {
        var h=document.createElement("div");
        h.classList.add("list_header");
        span("",h,"Filter:");
        this.filter_box=textbox("",h,"",true,null,this.filter_box_input);
        
        return h;
    }
    create_list_footer=()=>
    {
        var f=document.createElement("div");
        f.classList.add("list_header");
        span("font_10pt border_h2_top",f,"total/visible/selected:");
        return f;
    }
    create_extended_filter_menu=(caption,options,fn)=>
    {
        if (Array.isArray(options))
        {
            var opt="<option>"+caption+"</option>";
            for (var i=0;i<options.length;i++)
            {
                opt+="<option>"+options[i]+"</option>";
            }
            opt+="<option>CANCEL FILTER</option>"
            var ext=create_element("select","",this.header,opt);
            ext.style.maxWidth="160px";
            ext.addEventListener("click",fn);
        }
    }
    filter_box_input=(e)=>
    {
        var v=this.filter_box.value;
        var items=this.tbl.getElementsByClassName("list_item "+this.name);
        if (v=="")
        {
            for (var i=0;i<items.length;i++)
            {
                items[i].classList.remove("list_item_hidden");
            }
        }
        else
        {
            var satisfies=function(text)
            {
                if (v.indexOf("^")==0)
                {
                    var v2=v.slice(1);
                    if (text.indexOf(v2)==0)
                        return true;
                }
                else
                {
                    if (text.indexOf(v)!=-1)
                        return true;
                }
                return false;
            }
            this.count_of_visible=0;
            for (var i=0;i<items.length;i++)
            {
                var td=items[i].children;
                var found=false;
                for (var j=0;j<td.length;j++)
                {
                    if (satisfies(td[j].firstChild.textContent))
                        found=true;
                }
                if (found==false)
                {
                    items[i].classList.add("list_item_hidden");
                    this.count_of_visible++;
                }
                else
                    items[i].classList.remove("list_item_hidden");
            }
            this.update_footer();
        }
    }
    
    dispose=()=>
    {
        this.clear_data();
        this.tbl.remove();
        this.tbl=null;
        this.footer.remove();
        this.footer=null;
        this.header.remove();
        this.header=null;
    }
    
    clear_data=()=>
    {
        this.tbl.innerHTML="";
        this.item_count=0;
        this.count_of_selected=0;
        this.count_of_visible=0;
        this.metadata=null;
        this.update_footer();
        
    }
    process_data=(data, schema,html_data=false,
        on_item_clicked=null,on_dropdown_opened=null,supplied_metadata_keys=null,
        supplied_metadata_values=null,row_postprocessing_fn=null)=>
    {
        this.clear_data();
        var parser=new DOMParser();
        var schemaXML=parser.parseFromString(schema,"text/xml");
        
        var ns_resolver = function resolver() {
            return 'http://mlat.uzh.ch/2.0';
        }
        
        
        var padded="unpadded";
        if (this.list_items_padded==true)
            padded="padded";
                    
        var row_obj=schemaXML.getElementsByTagName("row")[0];
        var row_XPath=row_obj.textContent;
        if (row_XPath!="")
            row_XPath=row_XPath.replace(/[}{]/g,"");
        if (schemaXML.getElementsByTagName("metadata")[0]!=null)
        {
            var mdata=schemaXML.getElementsByTagName("metadata")[0];
            var metadata_name=mdata.getAttribute("name");
            var isxpath=mdata.getAttribute("xpath");
            if (isxpath!="false")
            {
                var metadata_XPath=mdata.textContent;
                try
                {
                    var metadata_iterator=data.evaluate(metadata_XPath,data,ns_resolver);
                    var metadata=metadata_iterator.iterateNext();
                    if (metadata!=null)
                        metadata=metadata.textContent;
                }
                catch(err)
                {}
            }
            else
                var metadata=mdata.textContent;
                
            
            if (this.metadata==null)
                this.metadata=Array();
            
            if (metadata!=null)
            {
                if (metadata_name!=null)
                    this.metadata[metadata_name]=metadata;
                else
                    this.metadata.push(metadata);
            }
            if (supplied_metadata_values!=null)//metadata zadaná z řídící funkce, nikoliv z dat
            {
                if (Array.isArray(supplied_metadata_values) && Array.isArray(supplied_metadata_keys))
                {
                    for (var md_i=0; md_i<supplied_metadata_values.length;md_i++)
                    {
                        this.metadata[supplied_metadata_keys[md_i]]=supplied_metadata_values[md_i];
                    }
                }
            }
        }
        var dropdown=row_obj.getAttribute("dropdown");
        if (dropdown!=null)
        {
            if (dropdown=="true")
                dropdown=true;
        }
        else
            dropdown=false;
        
        var row_title=row_obj.getAttribute("title");
            if (row_title==null)
                row_title="";
            
            
        var columns_=schemaXML.getElementsByTagName("column");
        
        var dropdown_auto_expand=row_obj.getAttribute("expand_on_sole_item");
        if (dropdown_auto_expand==null)
            this.dropdown_auto_expand=false
        else
            if (dropdown_auto_expand=="true")
                this.dropdown_auto_expand=true;
            
    
        /*
         * 
         * zde si zpracujeme sloupce (zjistíme, kolik jich je a jaké)
         * 
         */
        this.columns=Array();
        for (var i=0;i<columns_.length;i++) 
        {
            
            var expression=columns_[i].innerHTML;
            var name=columns_[i].getAttribute("name");
            if (name==null)
                name=expression.replace(/[{}]/g,"");//není-li zadáno jmeno sloupce explicitně, vezmeme Xpath, který popisuje, kde se najdeou data pro tento sloupec
            
            var label=columns_[i].getAttribute("label");
            if (label==null)
                label=name.replace(/[{}]/g,"");
           
            var hidden=columns_[i].getAttribute("hidden");
                if (hidden!=null)
                    hidden=true;
                else
                    hidden=false;
                
             var format_nr=columns_[i].getAttribute("format_nr");
                if (format_nr!=null)
                    format_nr=true;
                else
                    format_nr=false;
                
            var format_year=columns_[i].getAttribute("format_year");
                if (format_year!=null)
                    format_year=true;
                else
                    format_year=false;    
            
            var sum=columns_[i].getAttribute("sum");//zda se má sloupec sečíst: pokud je tru, budou se hodnoty sloupce sčítat, pokud je něco jiného (např. "Total: "), pak se v tomto sloupci v řádku se součty zobrazí tento text
                if (sum==null)
                    sum=false;
                else if (sum=="true")
                    sum=true;
                
            var highlight=columns_[i].getAttribute("highlight");
            if (highlight!=null)
                highlight=highlight.split(",");
            else
                highlight=[];
            
            var width=columns_[i].getAttribute("width");
            if (width==null)
                width="";
            
            var on_empty=columns_[i].getAttribute("on_empty");
            if (on_empty==null)
                on_empty="";
            
            var title=columns_[i].getAttribute("title");
            if (title==null)
                title="";
            
            var cancel_click=false;
            cancel_click=columns_[i].getAttribute("cancel_click");
            if (cancel_click=="true")
                cancel_click=true;
            
            var buttons=[];
            var btn=columns_[i].getElementsByTagName("button");//tlačítka "zabudovaná" do seznamu
            for (var j=0;j<btn.length;j++)
            {
                var btn_title=btn[j].getAttribute("title");
                var btn_action_id=btn[j].getAttribute("action_id");
                var btn_pos=btn[j].getAttribute("position");
                var btn_obj={title:btn_title,action_id:btn_action_id,position:btn_pos};
                buttons.push(btn_obj);
            }
            if (buttons.length==0)
                buttons=null;
            
            
            if (sum!=false)
                var add_sum_row=true;
            
            //sum_value=zde se bude ukládat součet hodnoty sloupce, sum_error=počet řádků, kde nebylo možné převést hodnotu na číslo
            var col={expression:expression,name:name,label:label,hidden:hidden,highlight:highlight,sum:sum,sum_value:0,sum_error:0,
                width:width,parent:this,on_empty:on_empty,title:title,buttons:buttons, format_nr:format_nr, format_year:format_year, cancel_click:cancel_click,
            position:function()
            {
                var thead=this.parent.tbl.getElementsByTagName("thead")[0];
                var head_cells=thead.getElementsByTagName("th");
                for (var i=0;i<head_cells.length;i++)
                {
                    if (head_cells[i].dataset["name"]==this.name)
                    {
                        return i;
                    }
                }
                return -1;
            }
            };
            
            this.columns.push(col);
        }
        
        
        
        var thead=document.createElement("thead");
        if (this.show_tbl_header==false)
            thead.style.display="none";
        var header_tr=document.createElement("tr");

        //dropdown může být rovnou zadáno false/true, ale taky test:xpath výraz, který se musí otestovat
        //a podle jeho výsledku dostaneme true, nebo false



        if (dropdown!=null && dropdown!=false)
        {
            var dd_th=document.createElement("th");
            dd_th.classList.add("sticky_th");
            dd_th.setAttribute("data-name","-");
            header_tr.appendChild(dd_th);
        }
        
        for (var i=0;i<this.columns.length;i++)
        {
            var th=document.createElement("th");
            th.innerHTML=this.columns[i].label;
            if (this.columns[i].hidden==true)
                th.style.display="none";
            if (this.sticky_theader==true)
                th.classList.add("sticky_th");
            
            th.setAttribute("data-name",this.columns[i].name);
            header_tr.appendChild(th);
        }
        
        thead.appendChild(header_tr);
        if (this.show_tbl_header==false)
            thead.style.display="none";
        
        this.tbl.appendChild(thead);
        this.tbody=document.createElement("tbody");
        this.tbl.appendChild(this.tbody);
        
        /*
         * 
         * zde se začínají přidávat jednotlivé řádky...
         * 
         */
        
        var index=0;
        
        if (row_XPath!="")
        {
            var rows=data.evaluate(row_XPath,data,ns_resolver,null);
            var row=null;
            while (row=rows.iterateNext())
            {
                if (row==null)
                    break;
                var new_row=document.createElement("tr");
                new_row.tabIndex="0";
                new_row.addEventListener("keypress",this.row_key_pressed);
                
                new_row.title=row_title;
                
                if (typeof dropdown=="string")
                {
                    var this_row_dropdown=this.evaluate_xml_expression(dropdown,data,row);
                }
                else
                    var this_row_dropdown=dropdown;
                
                
                if (this_row_dropdown==true)
                {
                    var dd_cell=document.createElement("td");
                    //dd_cell.innerHTML="&#5125;";
                    dd_cell.classList.add("list_item_dropdown_td")
                    dd_cell.addEventListener("click",this.dropdown_clicked);
                    new_row.appendChild(dd_cell);
                }
                else if (dropdown!=false)//false=dropdown vůbec nepřichází v úvahu. Poku je to nějaký 
                {//výraz, může DD být, i nemusí - ale i když není, musíme přidat buňku, 
                 //jinak se nám to rozhodí, pokud by na nějakém řádku byl, a na jiném ne
                    var dd_cell=document.createElement("td");
                    //dd_cell.innerHTML="&#5125;";
                    new_row.appendChild(dd_cell);
                }
                
                
                
                for (var j=0;j<this.columns.length;j++)//sloupce jednotlivých řádků
                {
                    
                    var new_cell=document.createElement("td");
                    var new_cell_div=document.createElement("div");
                    new_cell.appendChild(new_cell_div);
                    new_cell_div.style.width="100%";
                    new_cell_div.style.height="90%";
                    new_cell_div.classList.add("relative");
                    new_cell.classList.add(padded);
                    
                    if (this.columns[j].width!=null)
                        new_cell.style.width=this.columns[j].width;
                    
                    var cell_xpaths=this.columns[j].expression.match(/\{([^}]+)\}/g);
                    
                    var cell_textContent=this.columns[j].expression;
                    
                    for (var xi=0;xi<cell_xpaths.length;xi++)
                    {
                        var xpath_iterator=data.evaluate(cell_xpaths[xi].replace(/[{}]/g,""),row,ns_resolver);
                        var xpath_values=Array();
                        var xpath_value=null;
                        while (xpath_value=xpath_iterator.iterateNext())
                            xpath_values.push(xpath_value);
                        
                        if (xpath_values.length==1)
                            var xpath_textContent=xpath_values[0].textContent;
                        else if (xpath_values.length>1)
                        {
                            var xpath_textContent="";
                            for (var k=0;k<xpath_values.length;k++)
                            {
                                xpath_textContent+=xpath_values[k].textContent;
                                if (k<xpath_values.length-1)
                                    xpath_textContent+=", ";
                            }
                        }
                        else
                            var xpath_textContent=null;
                        
                        if (xpath_textContent==null)
                        {/*pokud požadovaná data nejsou, pak z předpokládaného řetězce textu do buňky tento výraz vyřadíme, a když dospějeme do konce a poslední výraz neexistuje a 
                            zároveň je výraz celé buňky roven tomuto výrazu, pak žádná data nejsou a cell_textContent nastavíme na null
                            */
                            if (xi!=cell_xpaths.length-1)
                                cell_textContent=cell_textContent.replace(cell_xpaths[xi],"{}");
                            else
                                if (cell_textContent.replace("{}","")==cell_xpaths[xi])
                                    cell_textContent=null;
                        }
                        else
                            cell_textContent=cell_textContent.replace(cell_xpaths[xi],xpath_textContent);
                    
                    }
                    
                    if (cell_textContent!=null)//máme data
                    {
                        if (cell_textContent.trim()=="" && this.columns[j].on_empty!="")
                            new_cell_div.innerHTML=this.columns[j].on_empty;
                        else
                        {
                            //vložení obsahu do buňky
                            
                            if (this.columns[j].format_nr==true)
                            {
                                new_cell_div.innerHTML=new Intl.NumberFormat().format(Number(cell_textContent));
                            }
                            else if (this.columns[j].format_year==true)
                            {
                                if (cell_textContent=="0" || cell_textContent=="")
                                    new_cell_div.innerHTML="-";
                                else if (Number(cell_textContent)>0)
                                    new_cell_div.innerHTML=cell_textContent;
                                else
                                    new_cell_div.innerHTML=(Number(cell_textContent)*-1)+" BC";
                                
                            }
                            else
                                new_cell_div.innerHTML=cell_textContent;    
                                
                            if (this.columns[j].sum==true)
                            {//pokud chceme tento sloupec sečíst...
                                if (Number(cell_textContent)!=NaN)
                                    this.columns[j].sum_value+=Number(cell_textContent)
                                else
                                    this.columns[j].sum_error++;
                            }
                        }
                        
                    }
                    else//pokud sloupec v datech chybí... 
                    {
                        if (this.columns[j].on_empty==null)
                            new_cell_div.innerHTML="[no data]";
                        else
                            new_cell_div.innerHTML=this.columns[j].on_empty;
                        new_cell_div.classList.add("list_item_no_data");
                    }
                    
                    if (this.columns[j].hidden==true)
                        new_cell.style.display="none";
                    if (this.pointer==true)
                        new_cell_div.classList.add("pointer");
                    
                    for (var k=0;k<this.columns[j].highlight.length;k++)//přidáme styly pro zvýraznění sloupců
                    {
                        if (this.columns[j].highlight[k].substring(0,1)!="$")
                            new_cell_div.classList.add("list_item_"+this.columns[j].highlight[k]);
                        else
                        {
                            var ev_result=xp(data,this.columns[j].highlight[k].substring(1),row);//data.evaluate(this.columns[j].highlight[k].substring(1),row,ns_resolver);
                            new_cell_div.classList.add("list_item_"+ev_result);
                        }
                    }
                    
                    if (this.columns[j].cancel_click==true)
                    {
                        new_cell_div.dataset["cancel_click"]="true";
                    }
                    
                    if (this.columns[j].title!="")
                        if (this.columns[j].title.substring(0,1)!="$")
                            new_cell_div.title=this.columns[j].title;
                        else
                        {
                            var ev_result=xp(data,this.columns[j].title.substring(1),row);
                            new_cell_div.title=ev_result;
                        }
                    else
                        new_cell_div.title="";
                        
                    
                    /*var btns=this.columns[j].buttons//přidáme tlačítka, jsou-li nějaká
                    if (btns!=null)
                    {
                        for (var k=0;k<btns.length;k++)
                        {
                            var btn=document.createElement("info_btn");
                            btn.style.height="90%";
                            btn.style.fontSize="75%";
                            
                            if (btns[k].position=="right")
                                btn.style.float="right";
                            else
                                btn.style.marginLeft="15px";
                            //btn.style.position="absolute";
                            btn.innerHTML=btns[k].title;
                            btn.dataset["action_id"]=btns[k].action_id;
                            btn.addEventListener("click",this.in_list_button_clicked);
                            btn.style.visibility="hidden";//tlačítka jsou skrytá a ukáží se jen při pohybu myší nad řádku
                            new_cell_div.appendChild(btn);
                        }
                    }*/
                    var btns=new_cell_div.getElementsByTagName("button");
                    for (var k=0;k<btns.length;k++)
                    {
                        if (btns[k].tagName.toLowerCase()=="button")
                        {
                            btns[k].addEventListener("click",this.in_list_button_clicked); 
                        }
                            
                    }
                    new_row.addEventListener("mouseover",this.list_item_on_mouseover);
                    new_row.addEventListener("mouseleave",this.list_item_on_mouseleave);
                    
                    new_row.appendChild(new_cell);
                }
                new_row.setAttribute("data-index",index);
                new_row.classList.add("list_item");
                new_row.classList.add(this.name);
                //new_row.appendChild(row_content);
                this.tbody.appendChild(new_row);
                if (row_postprocessing_fn!=null)
                    row_postprocessing_fn(this.columns,data,row,new_row);
               
                index++;
            }
            if (index==0) //žádná data, žádné řádky
            {
                var on_empty_row=schemaXML.getElementsByTagName("row")[0].getAttribute("on_empty");
                if (on_empty_row!=null)
                {
                    var new_row=document.createElement("tr");
                    var new_cell=document.createElement("td");
                    new_cell.innerHTML=on_empty_row;
                    new_cell.classList.add("list_item_no_data");
                    new_row.setAttribute("data-index",index);
                    new_row.classList.add("list_item");
                    new_row.classList.add(this.name);
                    new_row.appendChild(new_cell);
                    this.tbody.appendChild(new_row);
                }
            }
            this.item_count=index;
            this.count_of_visible=index;
            this.update_footer();
        }
        /*
         * 
         * 
         * Zde končí přidávání řádků
         * 
         */
        if (add_sum_row==true)//pokud máme některé sloupce, které chceme sečíst, přidáme teď řádek se součty
        {
            var tfoot=create_element("tfoot","list_table_footer",this.tbl);
            var frow=create_element("tr","",tfoot);
            if (dropdown!=false)
                create_element("td","",frow);
            for (var i=0;i<this.columns.length;i++)
            {
                var align="";
                for (var j=0;j<this.columns[i].highlight.length;j++)
                    if (this.columns[i].highlight[j]=="right")
                        align="list_item_right";
                    else if (this.columns[i].highlight[j]=="center")
                        align="list_item_center";
                    
                var fcell=create_element("td",align,frow);
                if (this.columns[i].hidden==true)
                    fcell.style.display="none";
                if (this.columns[i].sum!=false && this.columns[i].sum!=true)
                    fcell.innerHTML=this.columns[i].sum;
                else if (this.columns[i].sum==true)
                {
                    if (this.columns[i].format_nr!=true)
                        fcell.innerHTML=this.columns[i].sum_value;
                    else
                        fcell.innerHTML=new Intl.NumberFormat().format(Number(this.columns[i].sum_value));
                }
                    
            }
        }
        
        
        this.tbl.classList.add("sortable");
        sorttable.makeSortable(this.tbl);
        this.tbl.addEventListener("click",this.item_clicked);
        this.tbl.addEventListener("dblclick",this.item_dblclicked);
        this.tbl.addEventListener("keydown",this.key_down);
        this.tbl.addEventListener("keyup",this.key_up);
        this.tbl.tabIndex="1";
        
        //nastavíme posluchače událostí seznamu (jsou-li zadány) (musíme to udělat dřív, než případně rozešleme
        //událost otevření dropdownu v následném kroku (je-li to nastaveno a v seznamu je jen jedna položka)
        if (on_item_clicked!=null)
            this.tbl.addEventListener("item_clicked",on_item_clicked);
        if (on_dropdown_opened!=null)
            this.tbl.addEventListener("dropdown_opened",on_dropdown_opened);

        
        if (this.dropdown_auto_expand==true && this.item_count==1 && this_row_dropdown==true)
        {//pokud máme nastavenu možnost, že při jediné položce se po nahrání má tato ihned sama rozbalit, provedem to zde
            this.expand_dropdown(0);
        }
        
    }
    update_footer=()=>
    {
        if (this.footer!=null)
        {
            this.footer.innerHTML="<span class='font_10pt border_h2_top'>total/visible/selected:<strong>"+this.item_count+"</strong>/"+this.count_of_visible+"/"+this.count_of_selected+"</span>";
        }
    }
    list_item_on_mouseover=(e)=>
    {//zobrazíme tlačítka na řádku:
        var btns=e.currentTarget.getElementsByTagName("button");
        for (var i=0;i<btns.length;i++)
            btns[i].style.visibility="visible";
    }
    list_item_on_mouseleave=(e)=>
    {//zobrazíme tlačítka na řádku:
        var btns=e.currentTarget.getElementsByTagName("button");
        for (var i=0;i<btns.length;i++)
            btns[i].style.visibility="hidden";
    }
    in_list_button_clicked=(e)=>
    {//funkce aktivovaná při kliknutí do zabudovaného tlačítka: vyvolá událost seznamu s action_id a výběrem
        e.stopPropagation();//aby nebyla spuštěna událost item_clicked
        var action_id=e.target.dataset["action_id"];
        var row_index=this.get_listitem_parent(e.target);
        if (row_index!=null)
            row_index=row_index.dataset["index"];
        var ev_button_clicked=new CustomEvent('in_list_button_clicked',{
                    detail:{list_obj:this,action_id:action_id,row_index:row_index}});
        this.tbl.dispatchEvent(ev_button_clicked);
    }
    key_down=(e)=>
    {
        if (e.keyCode==16)
            this.shift=true;
        else if (e.keyCode==17)
            this.ctrl=true;
        else if (e.keyCode==65)
        {//ctrl+A, vybereme všechno
            var last_clicked=this.tbl.getElementsByClassName("last_clicked")[0];
            last_clicked.classList.remove("last_clicked");
            this.tbody.firstChild.classList.add("last_clicked");
            var target={target:this.tbody.lastChild};
            this.shift=true;
            this.item_clicked(target);
            this.shift=false;
            e.stopPropagation();
            e.preventDefault();
        }
        else if (e.keyCode==38 || e.keyCode==40)//šipka dolu/nahoru
        {
            var last_clicked=this.tbl.getElementsByClassName("last_clicked");
            if (last_clicked.length>0)
                last_clicked=last_clicked[0];
            if (e.keyCode==40)
            {
                if (this.ctrl==false && last_clicked.nextSibling!=null)
                    var target={target:last_clicked.nextSibling};
                 else if (this.ctrl==true)
                    var target={target:last_clicked.parentNode.lastChild};
            }
            else
            {
                if (this.ctrl==false && last_clicked.previousSibling!=null)
                    var target={target:last_clicked.previousSibling};
                else if (this.ctrl==true)
                    var target={target:last_clicked.parentNode.firstChild};
            }
            
            if (target!=undefined)
            {
                this.item_clicked(target);
                e.stopPropagation();
                e.preventDefault();
                this.scroll_row_to_view(target.target);
            }
          
        }
    }
    key_up=(e)=>
    {
        if (e.keyCode==16)
            this.shift=false;
        else if (e.keyCode==17)
            this.ctrl=false;
    }
    scroll_row_to_view=(r)=>
    {
        var c=this.tbl.parentNode//kontainer celé tabulky je to, co se skroluje, ne tabulka samotná
        if (c.scrollTop>r.offsetTop)//řádek je nad viditelným pohledem
            c.scrollTop=r.offsetTop-r.offsetHeight;
        else if (r.offsetTop>c.scrollTop+c.clientHeight)
            c.scrollTop=(r.offsetTop-c.clientHeight)+r.offsetHeight;
    }
    dropdown_clicked=(e,index=-1)=>
    {
        if (index==-1)//metody vyvolala událost kliknutí na DD tlačítko
            var listitem=this.get_listitem_parent(e.target);
        else//metodu jsme vyvolali uměle a rovnou jsme zadali index řádku
        {
            var listitem=this.tbl.getElementsByClassName("list_item "+this.name);
            for (var i=0;i<listitem.length;i++)
                if (listitem[i].dataset["index"]==index)
                {
                    listitem=listitem[i];
                    break;
                }
        }   
            
        if (listitem==null)
            return false;
        
        var dd_btn=listitem.getElementsByClassName("list_item_dropdown_td")[0];
        var index=listitem.dataset["index"];
        var expanded=listitem.dataset["expanded"];
        if (expanded!="true")
        {
            var expanded_tr=this.tbl.getElementsByClassName("expanded_tr_"+index+" "+this.name)[0];
            
            dd_btn.classList.add("list_item_dropdown_td_dropped_down");
            if (expanded_tr==null)//do tabulky ještě pro tuto položku nebyl připojen řádek pro další nahrání obsahu
            {
                expanded_tr=document.createElement("tr");
                //expanded_tr.colspan=10;
                expanded_tr.classList.add("expanded_tr")
                expanded_tr.classList.add("expanded_tr_"+index);
                expanded_tr.classList.add(this.name);
                
                var expanded_td_1=document.createElement("td");//první "buňka" dělá odsazení a při dvojkliku zavře rozbalený podseznam
                expanded_td_1.title=listitem.getElementsByTagName("td")[1].textContent;//[0]=rozbalovací tlačítko!
                expanded_td_1.classList.add("expanded_td_1");
                var expanded_td_2=document.createElement("td");
                expanded_td_2.classList.add("expanded_td_2");
                expanded_td_2.colSpan=listitem.getElementsByTagName("td").length;
                
                var expanded_td_2_inner_div=document.createElement("div");
                expanded_td_2_inner_div.classList.add("expanded_td_2_inner_div");
                expanded_td_2.appendChild(expanded_td_2_inner_div);
                
                expanded_tr.appendChild(expanded_td_1);
                expanded_tr.appendChild(expanded_td_2);

                var next_sibling=listitem.nextSibling;
                if (next_sibling==null)
                    this.tbl.appendChild(expanded_tr);
                else
                    next_sibling.parentNode.insertBefore(expanded_tr,next_sibling);
                
                listitem.setAttribute("data-expanded","true");
                listitem.classList.add("list_item_dropdown_opened");
                
                this.dispatch_dropdown_opened(true,index,expanded_td_2_inner_div);
                
            }
            else
            {
                expanded_tr.style.display="";
                var expanded_td2=expanded_tr.getElementsByClassName("expanded_td_2_inner_div")[0];
                listitem.setAttribute("data-expanded","true");
                this.dispatch_dropdown_opened(false,index,expanded_td2);
            }
            
        }
        else
        {//zavření rozbalené podtabulky
            
            this.dropdown_close(index,dd_btn,listitem);
            /*dd_btn.classList.remove("list_item_dropdown_td_dropped_down");
            var expanded_tr=this.tbl.getElementsByClassName("expanded_tr_"+index)[0];
            expanded_tr.style.display="none";
            listitem.setAttribute("data-expanded","false");
            */
            //this.dispatch_dropdown_closed(false,index);
        }
        if (e!=null)
            e.stopPropagation();
    }
    dropdown_close=(index,dd_btn=null,listitem=null)=>
    {
 
        //dd_btn="tlačítko" (vlastně td) se šipkou, listitem=řádek, který jsme "rozbalili"
        var expanded_tr=this.tbl.getElementsByClassName("expanded_tr_"+index)[0];//samotný prostor pro podtabulku
        
        expanded_tr.style.display="none";
        if (listitem==null)
            listitem=expanded_tr.previousSibling;
        listitem.setAttribute("data-expanded","false");
        listitem.classList.remove("list_item_dropdown_opened");
        
        if (dd_btn==null)
            dd_btn=listitem.getElementsByClassName("list_item_dropdown_td")[0];
        
        dd_btn.classList.remove("list_item_dropdown_td_dropped_down");
    }
    
    
    dispatch_dropdown_opened=(first_time,index,target_td)=>
    {
        var ev_dropdown_opened=new CustomEvent('dropdown_opened',{
                    detail:{first_time:first_time,item_index:index,
                        list_obj:this,target_td_div:target_td}});
        this.tbl.dispatchEvent(ev_dropdown_opened);

    }
    
    row_key_pressed=(e)=>
    {
        if (e.keyCode==13 || e.keyCode=="32")
            this.item_clicked(e);
    }
    
            
    item_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        var clicked_row=e.target;
        
        
        
        if (clicked_row.classList.contains("expanded_td_1")==true)//kliknutí na levé políčko, sloupeček, u rozbalené
            //"podtabulky" - s tím necheme dělat nic, to reaguje jen na dvojklik, při němž to "podtabulku" zavře
            return 0;
        
        while (clicked_row.classList.contains("list_item")==false && clicked_row.parentNode!=null)
        {
            clicked_row=clicked_row.parentNode;//target události může být leccos, my ale potřebujeme ten řádek, tj. tr s třídou "list_item"
            if (typeof clicked_row.classList === 'undefined')
                return 0;//klikli jsme mezi řádky, tj. na nějaký rodičovský element tr - takže se k tr touto cestou nedostanem
        }
        
        var prev_last_clicked_index=-1;
        var rows=this.tbl.getElementsByClassName("list_item");
        for (var i=0;i<rows.length;i++)
        {
            if (rows[i].classList.contains("last_clicked"))
            {
                rows[i].classList.remove("last_clicked");
                prev_last_clicked_index=i;
            }
            if (this.multiselect_mode==0 || (this.ctrl==false && this.shift==false))
            {//no CTRL or SHIFT, or no multiselect allowed at all
                rows[i].classList.remove("list_item_selected");
                this.count_of_selected=0;
            }
        }
        clicked_row.classList.add("last_clicked");
        var clicked_index=clicked_row.rowIndex-1;//dataset.index;
        
        clicked_row.classList.toggle("list_item_selected");
        if (clicked_row.classList.contains("list_item_selected") && this.multiselect_mode==0)
            this.count_of_selected++;
        else if (this.multiselect_mode>0)
        {
            if (this.shift==true && this.multiselect_mode==1)
            {
                var sindex, eindex;
                if (prev_last_clicked_index<clicked_index)
                {
                    sindex=prev_last_clicked_index;
                    eindex=clicked_index;
                }
                else
                {
                    sindex=clicked_index;
                    eindex=prev_last_clicked_index;
                }
                for (var i=sindex;i<=eindex;i++)
                {
                    rows[i].classList.add("list_item_selected");
                    this.count_of_selected++;
                }
            }
            else if (clicked_row.classList.contains("list_item_selected"))
                this.count_of_selected++;
        }
        if (e.stopPropagation!=undefined)
            e.stopPropagation();
        
        var clicked_column=e.target;
        if (e.target.nodeName.toLowerCase()=="tr")//při "kliknutí" přes klávesnici
        {
            clicked_column=e.target.firstChild;
        }
            
        
        while (clicked_column.nodeName.toLowerCase()!="td")
            clicked_column=clicked_column.parentNode;
        var cc=false;//this.columns[clicked_column.cellIndex-1].cancel_click;
        if (cc!=true)
            this.dispatch_item_clicked();
        
        this.update_footer();
        
    }
    dispatch_item_clicked=()=>
    {
        var ev_item_clicked=new CustomEvent('item_clicked',{
                    detail:{list_obj:this}});
        this.tbl.dispatchEvent(ev_item_clicked);

    }
    item_dblclicked=(e)=>
    {
        var clicked_row=e.target;
        if (clicked_row.classList.contains("expanded_td_1")==true)//u rozbaleného podseznamu sloupeček 
        {//odsazující podseznam (vlastně "pokračování" rozbalovacího tlačítka)

            clicked_row=this.get_listitem_parent(clicked_row,"expanded_tr");
            var index=clicked_row.previousSibling.dataset["index"];
            this.dropdown_close(index);
        }
    }
    load_data=(url,schema,html_data=false)=>
    {
        var me=this;
        var xhttp=new XMLHttpRequest();
        xhttp.onreadystatechange=function()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                if (this.responseXML!=null)
                    me.process_data(this.responseXML,schema);
                else
                    return false;
            }
        }
        xhttp.open("GET",url);
        xhttp.send();
        
    }
    get_data_from_server=(url,process_method)=>
    {//this will only download the data from the server, withou processing them
        var me=this;
        var xhttp=new XMLHttpRequest();
        xhttp.onreadystatechange=function()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                if (this.responseXML!=null)
                    process_method(this.responseXML);
                else
                    process_method(false);
            }
        }
        xhttp.open("GET",url);
        xhttp.send();
    }
    
    
    get_listitem_parent=(child_node,class_name="list_item")=>
    {
        var n=child_node;
        while (n.classList.contains(class_name)==false)
        {
            if (n.parentNode!=null)
                n=n.parentNode;
            else
                return null
        }
        return n;
    }
    
    expand_dropdown(index)
    {
        this.dropdown_clicked(null,index);
    }
    count()
    {
        
    }
    
    evaluate_xml_expression=(expr,xml_object,context_node=null)=>
    {
        var comparision=expr.match(/::(.*)/);
        if (comparision!=null)
        {
            comparision=comparision[1];
            var operator=comparision.match(/(gt|lt|=|eq|get|let)/);
            if (operator!=null)
                operator=operator[1];
            var comp_value=comparision.match(/(gt|lt|=|eq|get|let) ?(.*)/);
            if (comp_value!=null)
                comp_value=comp_value[2];
        }
        else
            return false
        
        var expression=expr.match(/test:(.*)::/);
        if (expression!=null)
            expression=expression[1];
        else
            false
        
        var result=xml_object.evaluate(expression,context_node,this.ns_resolver);
        if (result!=null)
        {
            if (result.resultType==0)
                result=result.iterateNext();
            
            if (result.resultType==1)
            {
                if (operator=="=" || operator=="eq")
                    if (result.numberValue==Number(comp_value)) return true; else return false;
                if (operator=="gt")
                    if (result.numberValue>Number(comp_value)) return true; else return false;
                if (operator=="lt")
                    if (result.numberValue<Number(comp_value)) return true; else return false;
                if (operator=="get")
                    if (result.numberValue>=Number(comp_value)) return true; else return false;
                if (operator=="let")
                    if (result.numberValue>=Number(comp_value)) return true; else return false;
            }
            
        }
        return false;
    }
    add_metadata(name, data)
    {
        if (Array.isArray(this.metadata)==false)
            this.metadata=Array();
        
        this.metadata[name]=data;
    }
    
    
    ns_resolver()
    {
        return 'http://mlat.uzh.ch/2.0';
    }
    
    
}
class cls_list_selection
{
    constructor(list_obj)
    {
        this.list=list_obj;
        
    }
    count()
    {
        return this.list.tbl.getElementsByClassName("list_item_selected").length;
    }
    get_index()
    {
        //not implemented yet
    }
    get_columns(columns)
    {
        if (Array.isArray(columns)==false && columns!="all" && columns!="")
            columns=[columns];
        
        var rv=[];
        var columns_to_return=[];
        for (var i=0;i<this.list.columns.length;i++)
        {
            if ((columns=="all" ||columns=="") || (Array.isArray(columns)==true && columns.indexOf(this.list.columns[i].name)>-1))
            {
                var column={name:this.list.columns[i].name,position:this.list.columns[i].position()};
                columns_to_return.push(column);
            }
        }
        var all_rows=this.list.tbl.getElementsByClassName("list_item "+this.list.name);
        for (var i=0;i<columns_to_return.length;i++)
        {
            var column=[];
            for (var j=0;j<all_rows.length;j++)
            {
                var td=all_rows[j].getElementsByTagName("td")[columns_to_return[i].position];
            }
            rv.push(column);
        }
        
    }
    get_simply(column)
    {
        var rv=this.get(column);
        rv=rv[0];
        rv=rv[column];
        return rv;
    }
    get(columns="all",index=-1)
    {
        if (Array.isArray(columns)==false && columns!="all" && columns!="")
            columns=[columns];
        
        var rv=[];
        var columns_to_return=[];
        for (var i=0;i<this.list.columns.length;i++)
        {
            if ((columns=="all" ||columns=="") || (Array.isArray(columns)==true && columns.indexOf(this.list.columns[i].name)>-1))
            {
                var column={name:this.list.columns[i].name,position:this.list.columns[i].position()};
                columns_to_return.push(column);
            }
        }
        if (index==-1)
            var selected=this.list.tbl.getElementsByClassName("list_item_selected");
        else
        {
            var selected=[this.list.tbl.getElementsByClassName("list_item "+this.list.name)[index]];
        }
        for (var i=0;i<selected.length;i++)
        {
            var row=new Object();
            var td=selected[i].getElementsByTagName("td");
            for (var j=0;j<columns_to_return.length;j++)
            {
                var ac_td=td[columns_to_return[j].position];
                if (ac_td.dataset["value"]!=null)
                    var value=ac_td.dataset["value"];
                else
                    var value=ac_td.textContent;
                row[columns_to_return[j].name]=value;
            }
            rv.push(row);
        }
        return rv;
    }
    get_column(column, as_array=true,separator=",")
    {
        if (as_array==true)
            var rv=Array();
        else
            var rv="";
        var column_index=-1;
        for (var i=0;i<this.list.columns.length;i++)
        {//nejdřív musíme zjistit index sloupce
            if (this.list.columns[i].name==column)
            {
                column_index=i;
                break;
            }
        }
        if (column_index==-1)
            return null;//nenašli jsme požadovaný sloupec
        var items=this.list.tbl.getElementsByClassName("list_item "+this.list.name);
        for (var i=0;i<items.length;i++)
        {
            var td=items[i].getElementsByTagName("td");
            if (as_array==true)
            {
                rv.push(td[column_index].textContent);
            }
            else
            {
                rv+=td[column_index].textContent;
                if (i<items.length-1)
                    rv+=separator;
            }
        }
        return rv;
    }
    
}

