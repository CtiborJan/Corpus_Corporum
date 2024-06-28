var clsname=""
function ajax(url,processing_function,method="GET",data=null,asynchronous=true)
{
    var xhttp=new XMLHttpRequest();
    xhttp.onreadystatechange=function()
    {
        if (this.readyState==4 && this.status==200 && processing_function!=null)
        {
            processing_function(this);
        }
    }
    
    if (method=="POST" || (method=="GET" && url.length>2000))
    {
        method="POST";
        
        if (method=="GET" && url.length>2000) 
        {
            var query_start=url.indexOf("?");
            if (query_start!=-1) 
            {
                data=url.slice(query_start+1);
                url=url.slice(0,query_start);
            }
        }
    }

    xhttp.open(method,url,asynchronous);
    if (method=="POST")
        xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhttp.send(data);
}
function bx(fn_name,parameters,processing_function,method="GET",data=null,return_url=false)
{
    var p="";
    if (typeof parameters==="object")
    {
        if (parameters.constructor.name=="Map")
        {
            for (var e of parameters.entries())
            {
                p+=e[0]+"="+e[1]+"&";
            }
        }
        else if (Array.isArray(parameters)==true)
        {
            for (var i=0;i<parameters.length;i++)
            {
                p+="param"+i+"="+parameters[i]+"&";
            }
        }
    }
    else    
        p=parameters;

    if (p.slice(-1)=="&") p=p.slice(0,p.length-1);
    if (p.slice(0,1)=="&") p=p.slice(1,p.length);

    var url="basex";
    

    if (return_url==true)
        return url+"?function="+fn_name+"&"+p;
    else
       ajax(url+"?function="+fn_name+"&"+p,processing_function,method,data);
}
function dispatch_event(e)
{
    //document.getElementById("base").dispatchEvent(e);
    document.dispatchEvent(e);
}
function kb_click(e) //if (!(kb_click(e))) return false;
{//keyboard click? tj. enter nebo mezerník
    if (typeof(e)=="undefined")
        return true
    else if (e==null)
        return true;
    else if (e.type=="keypress")
    {
        if (e.keyCode ==13 || e.keyCode==32)
            return true;
        else
            return false;
    }
    else
        return true;
}

function load_script(path,class_name)
{
    var scripts=document.getElementsByTagName("script");
    for (var i=0;i<scripts.length;i++)
    {
        if (scripts[i].getAttribute("src")==path)
        {
            clsname=class_name;
            window.setTimeout(after_script_loaded,200);
            
            return 1;
        }
    }
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", path);
    document.getElementsByTagName("head")[0].appendChild(script);
    clsname=class_name;
    window.setTimeout(after_script_loaded,200);
}
function after_script_loaded(e)
{
    var e=new CustomEvent("script_loaded",{detail:{class_name:clsname}});
            document.dispatchEvent(e);
}

function generate_text_file(text,wnd=null)
{
    if (wnd==null)
        wnd=window;
    var textFile = null;
    
    var data = new Blob([text], {type: 'text/plain'}); 
    if (textFile !== null) {  
      wnd.URL.revokeObjectURL(textFile);  
    }  
    
    textFile = wnd.URL.createObjectURL(data);
    
    var link=wnd.document.createElement("a");
    link.href=textFile;
    link.target="_blank";
    wnd.document.body.appendChild(link);
    link.click();
    link.remove();
    
    //return textFile; 
    
}
function select_nodes_between(A,Z,filter=null)
{//funkce, která najde všechny uzly jak jdou za sebou mezi dvěma zadanými krajními uzly (A a Z)
/* tj. pro
<a><b><c>=A</c><d/></b><e/><f><g/></f><h><i/><j>=Z</j></h></a>
vrátí:d,e,f,i (g nikoliv, protože vrací "největší" možný uzel - nesestupuje do elementů ležících zcela mezi A a Z
(tj. když ani A, ani Z nejsou jejich dětmi)
*/
    var isin=function(what,where)
    {
        for (var i=0;i<where.items.length;i++)
            if (what.isSameNode(where.items[i]))
            {
                where.items=where.items.slice(0,i);
                return true;
            }
            
        return false;
    }
    
    var Z_ancestors={items:Array()};
    var ac=Z.parentNode;
    while (ac.nodeName!="BODY")
    {//najdeme všechny předky konečného prvku
        Z_ancestors.items.push(ac)
        ac=ac.parentNode;
    }
    var A_ancestors={items:Array()};
    
    ac=A;
    ac=ac.parentNode;
    while (isin(ac,Z_ancestors)==false)//a pokud najdeme první prvek, který se nachází i u Z, našli jsme posledního společného předka
    {//a všechny předky začátečního
        
        A_ancestors.items.push(ac)
        ac=ac.parentNode;
    }
    //v Z i A_ancestors jsou na posledním indexu elementy, které mají stejného rodiče
    
    var selected=[];
    
    ac=A.nextSibling;
    while (ac!=null)
    {
        if (filter!=null)
        {
            if (filter(ac))
                selected.push(ac);    
        }
        else
            selected.push(ac);
        ac=ac.nextSibling;
    }
    for (var i=0;i<A_ancestors.items.length;i++)
    {
        ac=A_ancestors.items[i].nextSibling;
        while(ac!=null)
        {
            if (i==A_ancestors.items.length-1)//jsme na úrovni nejbližšího společného předka, tj. tady narazíme na předka Z
                if (ac.isSameNode(Z_ancestors.items[Z_ancestors.items.length-1])==true)//a u toho se musíme zastavit
                    break;
            
            if (filter!=null)
            {
                if (filter(ac))
                    selected.push(ac);    
            }
            else
                selected.push(ac);
            ac=ac.nextSibling;
        }
    }
    for (var i=Z_ancestors.items.length-2;i>=0;i--)//sourozence posledního nechceme: ten je na stejné úrovni jako A_ancestors.item.last a zpracovali jsme je už výše
    {//začneme tedy na další úrovni 
        ac=Z_ancestors.items[i].previousSibling;
        while(ac!=null)
        {
            if (filter!=null)
            {
                if (filter(ac))
                    selected.push(ac);    
            }
            else
                selected.push(ac);
            ac=ac.previousSibling;
        }
    }
    ac=Z.previousSibling;
    while (ac!=null)
    {
        if (filter!=null)
        {
            if (filter(ac))
                selected.push(ac);    
        }
        else
            selected.push(ac);
            
        ac=ac.previousSibling;
    }
    return selected;
}

function ancestors(element,return_cond, end_cond,ancestor_or_self=true)
{
    return ancestor(element,return_cond, end_cond,ancestor_or_self);
}
function ancestor(element,return_cond, end_cond,ancestor_or_self=true)
{
    var ancestors=Array();
    if (ancestor_or_self==false)
        element=element.parentNode;
    
    while (element!=null)
    {
        if (return_cond==null || return_cond(element)==true)
            ancestors.push(element);
        if (end_cond!=null && end_cond(element)==true)
            return ancestors;

        element=element.parentNode;
    }
    return ancestors;
}



function parent(element,class_name,node_name="")
{//funkce najde předka zadaného elementu, který obsahuje zadané classname nebo má zadané nodeName
    if (element.parentNode!=null)
    {
        if (class_name!="" && node_name=="")//we look only for className
        {
            if (element.parentNode.classList.contains(class_name)==true)
                return element.parentNode;
        }
        else if (class_name=="" && node_name!="")//we look only for nodeName
        {
            if (element.parentNode.nodeName.toLowerCase()==node_name.toLowerCase())
                return element.parentNode;
        }
        else//we look for both
        {

        }

        return parent(element.parentNode,class_name,node_name);
    }
    else
        return null;
}
function clean_element(element)
{
    if (element!=null)
        for (var i=element.childNodes.length-1;i>=0;i--)
            element.childNodes[i].remove();
}

function mix_colors(c1, c2, perc)
{
    if (Array.isArray(c1)==true)
        c1={r:Number(c1[0]),g:Number(c1[1]),b:Number(c1[2])};
    if (Array.isArray(c2)==true)
        c2={r:Number(c2[0]),g:Number(c2[1]),b:Number(c2[2])};
    

    var r_add=Math.floor((c2.r-c1.r)*perc);
    var g_add=Math.floor((c2.g-c1.g)*perc);
    var b_add=Math.floor((c2.b-c1.b)*perc);
    
    var rv= {r:c1.r+r_add,g:c1.g+g_add,b:c1.b+b_add};
    return rv;

}




function div(classNames="",parent=null,innerHTML="",display=true)
{
    return create_element("div",classNames,parent,innerHTML,display);
}
function textbox(classNames="",parent=null,value="",display=true,onKeyPressEvent=null,onInputEvent=null,placeholder="")
{
    var t=create_element("input","textbox "+classNames,parent,"",display);
    t.type="textbox";
    t.value=value;
    t.placeholder=placeholder;
    if (onKeyPressEvent!=null)
        t.addEventListener("keypress",onKeyPressEvent);
    if (onInputEvent!=null)
        t.addEventListener("input",onInputEvent);
    return t;
}

function span(classNames="",parent=null,innerHTML="",display=true)
{
    return create_element("span",classNames,parent,innerHTML,display);
}
function info_box(classNames="",parent=null,innerHTML="",display=true)
{
    return create_element("info_box",classNames,parent,innerHTML,display);
}
function info_label(classNames="",parent=null,innerHTML="",display=true)
{
    return create_element("info_label",classNames,parent,innerHTML,display);
}
function info_value(classNames="",parent=null,innerHTML="",display=true)
{
    return create_element("info_value",classNames,parent,innerHTML,display);
}

function cmd(classNames="",parent=null,value="",display=true,onClickEvent=null)
{
    var rv=create_element("input","button "+classNames,parent);
    rv.type="button";
    rv.value=value;
    rv.addEventListener("click",onClickEvent);
    return rv;
}

function def_button(classNames="",parent=null,innerHTML="",onClickEvent=null)
{
    var rv=create_element("button",classNames,parent,innerHTML,true);
    if (onClickEvent!=null)
    {
        rv.addEventListener("click",onClickEvent);
        rv.addEventListener("keypress",onClickEvent);
    }
    rv.tabIndex="0";
    return rv;
}

function button(classNames="",parent=null,innerHTML="",display=true,onClickEvent=null)
{
    var rv=create_element("info_btn",classNames,parent,innerHTML,display);
    if (onClickEvent!=null)
    {
        rv.addEventListener("click",onClickEvent);
        rv.addEventListener("keypress",onClickEvent);
    }
    rv.tabIndex="0";
    return rv;
    
}

function checkbox(classNames="",parent=null,innerHTML="",checked=false,id="",display=true)
{
    var cls="";
    if (id=="")
    {
        var Xchb=document.getElementsByClassName("Xcheckbox");
        id="Xcheckbox_"+Xchb.length;
        cls=" Xcheckbox";
    }
    var l=create_element("label", classNames,parent,"",true);
    l.htmlFor=id;
    var chb=create_element("input",classNames+" checkbox"+cls,l,"",display);
    chb.type="checkbox";
    chb.checked=checked;
    chb.id=id;
    //var l=create_element("label",classNames+" checkbox",parent,innerHTML,display);
    //l.htmlFor=id;
    var s=span("",l,innerHTML);
//    var c=create_element("caption","",l,innerHTML);
    //s.insertAdjacentText("afterend",innerHTML);
    chb.tabIndex="0";
    return chb;
}
function radiobutton(classNames="",parent=null,innerHTML="",checked=false,id="",name="")
{
    var cls="";
    if (id=="")
    {
        var Xchb=document.getElementsByClassName("Xradiobutton");
        id="Xradiobutton_"+Xchb.length;
        cls=" Xradiobutton";
    }
    var l=create_element("label",classNames,parent,"",true);
    l.htmlFor=id;
    var rb=create_element("input",cls,l,"",true);
    rb.type="radio";
    rb.checked=checked;
    rb.id=id;
    rb.name=name;
    var s=span("",l,innerHTML);
    rb.tabIndex="0";
    return rb;
}
class rbtn
{
    static c=0;
    static count(){this.c++;return this.c};
}
function radiobutton2(classNames="",parent=null,innerHTML="",checked=false,id="",name="",onchange=null,rbClass="")
{
    var cls="";
    if (id=="")
    {
        id="rbt2_"+rbtn.count();
        cls=" rbt2";
    } 
    var rb=create_element("input",rbClass+cls,parent,"",true);
    rb.type="radio";
    rb.checked=checked;
    rb.id=id;
    rb.name=name;
    var l=create_element("label",classNames,parent,innerHTML,true);
    l.htmlFor=id;
    if (onchange!=null)
        rb.onchange=onchange;
    return rb;
}
function create_element(tagname="",classNames="",parent=null,innerHTML="",display=true)
{
    if (tagname=="")
        tagname="div";
    var s=document.createElement(tagname);
    if (classNames!="")
        s.className=classNames;
    if (display==false)
        s.style.display="none";
    if (parent!=null)
        parent.appendChild(s);
    if (typeof innerHTML==="string")
        s.innerHTML=innerHTML;
    else if (typeof innerHTML==="object")
        s.appendChild(innerHTML);
    
    return s;
}
function ns(prefix)
{
    if (prefix=="cc")
        return 'http://mlat.uzh.ch/2.0';
    else if (prefix=="tei")
        return 'http://www.tei-c.org/ns/1.0';
    else if (prefix=="xml")
        return 'http://www.w3.org/XML/1998/namespace';
    else if (prefix=="N")
        return '';
}
function xp_a(xml,xpath,context_element=null)
{
    var xml_el=xpei(xml,xpath,context_element);
    var item=null;
    var rv=Array();
    while (item=xml_el.iterateNext())
    {
        if (item!=null)
        {
            if (typeof item=="object")
                rv.push(item.textContent);
            else
                rv.push(item);
        }
    }
    return rv;
}
function xp(xml,xpath,context_element=null)
{
    var rv=xpe(xml,xpath,context_element);
    if (rv!=null)
    {
        if (typeof rv=="object")
            return rv.textContent;
        else
            return rv;
    }
}
function xpe(xml,xpath,context_element=null)
{
    var rv=xpei(xml,xpath,context_element);
    if (rv!=null)
    {
        if (rv.resultType==1)
            rv=rv.numberValue;
        else if (rv.resultType==2)
            rv=rv.stringValue;
        else if (rv.resultType==3)
            rv=rv.boolenValue;
        else
            rv=rv.iterateNext();
    }
    return rv;
}
function xpei(xml,xpath,context_element=null)
{//xpath - element, iterable
    if (context_element==null)
        context_element=xml;
    try
    {
        var rv=xml.evaluate(xpath,context_element,ns);
    }
    catch(err)
    {
        return null;
    }
    
    return rv;
}
function convert_date(events)
{
    var rv="";
    var events;
    var event=null;
    var born="", died="", floruit_from="",floruit_to="",work_composition="",undef="";
    while (event=events.iterateNext())
    {
        if (event.getAttribute("what")=="born")
            born=event_xml_to_string(event);
        else if (event.getAttribute("what")=="died")
            died=event_xml_to_string(event);
        else if (event.getAttribute("what")=="floruit_from")
            floruit_from=event_xml_to_string(event);
        else if (event.getAttribute("what")=="floruit_to")
            floruit_to=event_xml_to_string(event);
        else if (event.getAttribute("what")=="work_composition")
            work_composition=event_xml_to_string(event);
        else
            undef=event_xml_to_string(event);
    }
    if (born!="" && died!="")
        rv=born+" – " + died;
    else if (born!="")
        rv="born "+born;
    else if (died!="")
        rv="died "+died;
    
    if (floruit_from!="" && floruit_to!="")
        rv="fl. "+floruit_from+" – " +floruit_to;
    else if (floruit_from!="")
        rv="fl. "+floruit_from;
    else if (floruit_to!="")
        rv="fl. "+floruit_to;
    
    else if (work_composition!="")
        rv=work_composition;
    else if (undef!="")
        rv=undef;
    return rv;
        
}
function event_xml_to_string(event_xml)
{
    var date1=event_xml.getElementsByTagName("date1")[0];
    if (date1==null)
    {
        date2="";
        date1=event_xml.textContent;
    }
    else   
    {
        var date2=event_xml.getElementsByTagName("date2");
        if (date2.length>0)
            date2=date2[0];
        else
            date2=null;
    }
    if (this.date_to_string(date2)=="")
    {//only one date value set (i. e. no interval)
        if (typeof(date1)!="string")
            var d1_certainty=date1.getAttribute("certainty");
        if (d1_certainty=="certain" || d1_certainty==null)
            return date_to_string(date1);
        else if (d1_certainty=="uncertain")
            return "<uncertain_date>"+date_to_string(date1)+"</uncertain_date>";
        else if (d1_certainty=="circa")
            return "c. "+ date_to_string(date1);
        else if (d1_certainty=="before")
            return "before "+ date_to_string(date1);
        else if (d1_certainty=="after")
            return "after "+ date_to_string(date1);
            
    }
    else
        return "between " +date_to_string(date1) +" and " +date_to_string(date2);
}
function date_to_string(date)
{
    if (date==null)
        return "";
    else if (typeof(date)=="string" || typeof(date)=="number")
    {
        year=date;
        if (year=="10000" || year=="0")
            return "n. d.";
    }
    else
    {
        var year=date.getElementsByTagName("year");
        if (year.length!=0)
            year=year[0].textContent;
        else
            year="";
    }
    if (year!="")
    {
        if (year.startsWith("-")==true)
        {
            year=year.substring(1);
            return year+" BC"
        }
        else
        {
            if (Number(year)<100)
                return "AD "+year;
            else
                return year;
        }
    }
    else
        return "";
}
function info_message(responseXML,when_ok="",when_error="",when_warning="",responseText="")
{
    var message="";
    var status="";
    if (responseXML==null)
    {
            status="error";
            if (responseText=="")
                responseText="no xml data received.";
            var message="ERROR: "+responseText;
    }
    else
    {
        status=xpe(responseXML,"/*").getAttribute("status");
    
        if (status=="ok")
        {
            if (when_ok=="")
                message=xp(responseXML,"/*");
            else
                message=when_ok
        }
        if (status=="warning")
        {
            if (when_warning=="")
                message=xp(responseXML,"/*");
            else
                message=when_warning
        }
        if (status=="error")
        {
            if (when_warning=="")
                message=xpe(responseXML,"/*").getAttribute("error");
            else
                message=when_error;
        }
        
    }
    var message_event=new CustomEvent("info_message",{detail:{status:status,message:message}});
    document.body.dispatchEvent(message_event);
    return status;
}
class cls_sandglass
{
    constructor(parent=null)
    {
        if (parent==null)
            this.div=null;
        else
            this.open(parent);
    }
    open=(parent)=>
    {
        if (this.div==null)
        {
            this.div=div("sandglass",parent);
            this.div.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="sandglass" width="80px" height="80px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><circle cx="50" cy="50" r="32" stroke-width="8" stroke="#a13d10" stroke-dasharray="50.26548245743669 50.26548245743669" fill="none" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="2.941176470588235s" keyTimes="0;1" values="0 50 50;360 50 50"></animateTransform></circle></svg>';
        }
        else
        {
            if (this.parent!=undefined)
            {
                parent.appendChild(this.div);
            }
            this.div.style.display="block";
            
        }

        
        this.div.addEventListener("click", this.close);
        
    }
    close=(e=null)=>
    {
         this.div.style.display="none";
         
    }
    loop=(e)=>
    {
    }
    
}
class cls_fade_element
{

    constructor(element, start_color_rgb=[255,255,128],final_color_rgb="transparent",time=2000,final_alfa=0,final_display="")
    {
        if (start_color_rgb=="yellow" || start_color_rgb=="" || start_color_rgb=="default")
            start_color_rgb=[255,255,128];
        if (final_color_rgb=="0" || final_color_rgb=="")
            final_color_rgb="transparent";
        this.final_color=final_color_rgb;
        this.element=element;
        this.final_display=final_display;
        if (final_color_rgb!="transparent")   
        {
            this.fade_element_step=[];
            this.element.style.backgroundColor="rgb("+start_color_rgb[0]+","+start_color_rgb[1]+","+start_color_rgb[2]+")";
            this.fade_element_step[0]=(final_color_rgb[0]-start_color_rgb[0])/(time/10);
            this.fade_element_step[1]=(final_color_rgb[1]-start_color_rgb[1])/(time/10);
            this.fade_element_step[2]=(final_color_rgb[2]-start_color_rgb[2])/(time/10);
        }
        else
        {
            this.alfa=1;
            this.alfastep=1/(time/10);
            this.element.style.backgroundColor="rgba("+start_color_rgb[0]+","+start_color_rgb[1]+","+start_color_rgb[2]+",1)";
        }
        
        this.final_alfa=final_alfa;
        this.fade_element_ac=start_color_rgb;
        this.final_color_rgb=final_color_rgb;
        this.start_color_rgb=start_color_rgb;
        this.count=0;
        this.max_count=time/10;
        this.timer_id=window.setInterval(this.fade_element_timer,10);
    }
    fade_element_timer=(e)=>
    {
        this.count++;
        if (this.final_color!="transparent")
        {
            this.fade_element_ac[0]+=this.fade_element_step[0];
            this.fade_element_ac[1]+=this.fade_element_step[1];
            this.fade_element_ac[2]+=this.fade_element_step[2];
            var r=Math.floor(this.fade_element_ac[0]);
            var g=Math.floor(this.fade_element_ac[1]);
            var b=Math.floor(this.fade_element_ac[2]);
            if (this.count>=this.max_count)
            {
                r=this.final_color_rgb[0];
                g=this.final_color_rgb[1];
                b=this.final_color_rgb[2];
                window.clearInterval(this.timer_id);
                if (this.final_display=="none")
                    this.element.style.display="none";
            }
            this.element.style.backgroundColor="rgb("+r+","+g+","+b+")";
        }
        else if (this.final_color=="transparent")
        {
            this.alfa-=this.alfastep;
            //var clr="rgba("+this.start_color_rgb[0],this.start_color_rgb[1],this.start_color_rgb[2],this.alfa+")"
            this.element.style.backgroundColor="rgba("+this.start_color_rgb[0]+","+this.start_color_rgb[1]+","+this.start_color_rgb[2]+","+this.alfa+")";
            if (this.alfa<=0 && this.final_alfa==0)
            {
                if (this.final_display=="none")
                    this.element.style.display="none";
                else
                    this.element.style.backgroundColor="transparent";
                window.clearInterval(this.timer_id);
            }
            else if (this.alfa<=this.final_alfa)
            {//necháme to poloprůhledné
                window.clearInterval(this.timer_id);
            }
        }
       
    }
}
class cls_mod
{
    constructor(parent_slot)
    {
        this.taskbar_text="";
        this.taskbar_color="";
        this.taskbar_bckg_color="";
        this.parent_slot=parent_slot;
        this.my_index=null;
        this.module_container=document.createElement("div");
        this.module_container.classList.add("module_container");
        this.module_name="";
        this.module_dscription="";
        this.label="";
        this.display_only_my_slot=false;
        this.real_parent_slot=parent_slot;
        
    }
    destroy()
    {
        this.module_container.remove();
    }
}



class cls_popup_window
{
    constructor(c,width=0,height=0,z_index=0,clean=false)
    {
        //c=container, element, který bude použit jako toto "okno"
        this.container=c;
        this.container.classList.add("cls_popup_window")
        if (width!=0 && height!=0)
        {
            this.container.style.width=width;
            this.container.style.height=height;
        }
        if (z_index!=0)
            this.container.style.zIndex=z_index;
        if (clean==true)
            this.container.style.lineHeight="initial";
        
        var d=div("background",this.container);
        this.btn_close=button("btn_close",this.container,"",true,this.btn_close_clicked);
    }
    btn_close_clicked=(e)=>
    {
        this.container.remove();
    }
}


//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
//******************************************************************cls_base*************************************************************************
//***************************************************************************************************************************************************
//***************************************************************************************************************************************************
class cls_base
{
	constructor()
	{
        this.base=document.getElementById("base");
		this.n_flying_slots=0;
		this.flying_slots=[];
		this.slot=new cls_slot(this,["flex","flex_horizontal"]);
        this.main_slot=null;
        this.host=window.location.hostname;
        this.url_resolver=null;
		
		
		//var fslot=this.add_flying_slot("400px","400px");
				
		this.settings_button=document.createElement("div");
		this.settings_button.classList.add("workspace_settings_btn");
		document.body.appendChild(this.settings_button);
		this.settings_button.addEventListener("click",this.activate_workspace_setting);
		
		this.add_flying_slot_button=document.createElement("div");
		this.add_flying_slot_button.classList.add("add_flying_slot_btn");
		document.body.appendChild(this.add_flying_slot_button);
		this.add_flying_slot_button.addEventListener("click",this.add_flying_slot);
        
        this.add_flying_slot_button.classList.add("display_none");
		this.settings_button.classList.add("display_none");
		
		document.body.addEventListener("mousedown",this.on_mouse_down);
		
		this.wsp_setting_active=false;
        this.sandglass=new cls_sandglass();
		
		
		document.body.addEventListener("show_image_request",this.unheard_request)
		
	}
    open_search_window=(target,fn)=>
    {       
        this.def_search_window_slot=this.add_flying_slot(600,600);
        this.def_search_module=new cls_mod_adminsearch(this.def_search_window_slot)
        this.def_search_module.db_search_module.calling_textbox=target;
        this.def_search_module.db_search_module.results_div.addEventListener("search_result_selected",fn);
    }
	unheard_request=(e)=>
	{
        if (e.type=="show_image_request")
        {
            var sl=this.add_flying_slot("60%","70%");
            var module=new cls_image_viewer(sl);
            var event=new CustomEvent(e.type,{detail:e.detail,bubbles:true});
            this.base.dispatchEvent(event);
        }
        
	}
	
	on_mouse_down=(e)=>
	{
		this.defocus_flying_slots("");
	}
	
	remove_child_slot=(id)=>
	{
		for (var i=0;i<this.flying_slots.length;i++)
			if (this.flying_slots[i].html_id==id)
			{
				this.flying_slots.splice(i,1);
			}
		
	}
	
	defocus_flying_slots(except_id)
	{
		for (var i=0;i<this.flying_slots.length;i++)
		{
			if (this.flying_slots[i].html_id!=except_id)
			{
				if (this.flying_slots[i].just_got_focus==false)//pokud klikneme do slotu, on se aktivuje, ale pak přijde na zpracování metody onmousedown celého objektu body, který spustí tuhle funkci 
					this.flying_slots[i].loose_focus();//čímž by právě aktivovaný slot zase deaktivoval. Tahle proměnná ale této fci řekne, že slot dostal fokus teď a má ho tedy nechat na pokoji, jen 
					//mu tento příznak odebrat
				else
					this.flying_slots[i].just_got_focus=false;
			}
		}
	}
	
	activate_workspace_setting=()=>
	{
		this.wsp_setting_active=! this.wsp_setting_active;
		this.slot.highlight(this.wsp_setting_active,true);
		for (var i=0;i<this.flying_slots.length;i++)
			this.flying_slots[i].highlight(this.wsp_setting_active,true);
			
		
	}
	add_flying_slot=(w=0,h=0,container_element=null,display_bar_and_button=true)=>
	{
		var fs=new cls_slot(this,"","",true,w,h,container_element);
        if (display_bar_and_button==false)
            fs.hide_bar_and_button();
		this.flying_slots.push(fs);
		fs.get_focus();
		return fs;
	}
}











/*####################################################################################################################################################################################
####################################################################################cls_slot##########################################################################################
####################################################################################################################################################################################*/

class cls_slot
{
	constructor(parent_slot,cssclasses,flex_grow="1",flying_slot=false,w=0,h=0,container_element=null)
	{
		this.html_id="";
		this.n_slots=0;
		this.slots=[];
        if (parent_slot.constructor.name=="cls_base")
        {
            this.base=parent_slot;
            if (flying_slot==false)
                parent_slot=null;
        }
        else
            this.base=parent_slot.base;
    
        
		this.parent_slot=parent_slot;
		this.resizing_startX=0;
		this.resizing_startY=0;
		this.resizing_startFlexGrow=0;
		this.resizing_startFlexGrow_of_sibling=0;
		this.resizing_one_pixel_move=0;
        this.modules_counter=0;
		this.modules=Array();
        this.active_module_index=-1;
        this.children_in_main_slot=false;
        this.main_slot_width=0;
        
        
		this.label=document.createElement("div");
		
        if (container_element==null)
            this.container=document.createElement("div");
        else
            this.container=container_element;
		
		if (flying_slot==false)
		{
			this.container.classList.add("slot");
			this.flying=false;
		}
		else
		{
			this.container.classList.add("flying_slot");
			this.flying=true;
		}
		if (parent_slot==null && flying_slot==false)
		{
			this.container.classList.add("base");
			this.html_id="bsl";
			
		}
		else if (flying_slot==false)
		{
			parent_slot.n_slots++;
			this.html_id=parent_slot.html_id+".sl_"+parent_slot.n_slots;
		}
		else
		{
			parent_slot.n_flying_slots++;//zde v takovém případě očekáváme objekt base
			this.html_id="free_slot_"+parent_slot.n_flying_slots;
		}
		
		for (var i=0;i<cssclasses.length;i++)
			if (cssclasses[i]!="")
				this.container.classList.add(cssclasses[i]);
		
		if (this.container.classList.contains("basic_flexed_element"))
			if (flex_grow!="1")
				this.container.style.flexGrow=flex_grow;
		
		this.container.id=this.html_id;
		
		this.taskbar=document.createElement("div");
		this.taskbar.classList.add("slot_modules_taskbar");
		this.container.appendChild(this.taskbar);
		
		this.inner_div=document.createElement("div");
		this.inner_div.classList.add("inner_slot");
		this.container.appendChild(this.inner_div);
		
		
		
		if (this.flying==false)
		{
			var resize_div=document.createElement("div");
			resize_div.classList.add("slot_resize_btn");
			resize_div.addEventListener("mousedown",this.resize_start);
			this.container.appendChild(resize_div);
		}
		else
		{
            this.close_btn=document.createElement("info_btn");
            this.close_btn.innerHTML="&nbsp; x &nbsp;";
            this.close_btn.addEventListener("click",this.remove);
            
            this.taskbar.style.top="22px";
            this.taskbar.style.bottom="0px";
            this.inner_div.top="22px";
            this.inner_div.bottom="0px";
			this.title_bar=document.createElement("div");
			this.title_bar.classList.add("slot_title_bar");
			this.title_bar.addEventListener("mousedown",this.move_start);
			
			this.title_bar.appendChild(this.close_btn);
			this.container.appendChild(this.title_bar);
			if (w!=0 && h!=0)
			{
                this.container.style.width=w;
                this.container.style.height=h;
			}
			
		}
		
		this.container.addEventListener("mousedown",this.on_mouse_down);
		
		if (parent_slot!=null && flying_slot!=true)
			parent_slot.container.appendChild(this.container);
		else
			document.getElementById("base").appendChild(this.container);
		
		this.loose_focus();
		
		this.label.classList.add("slot_label");
		this.label.style.display="none";
		this.container.appendChild(this.label);
        window.addEventListener("resize",this.window_resized);
		
	}
	window_resized=(e)=>
	{
        if (true)
        {
            
            
        if (document.body.clientWidth<1000 && this.children_in_main_slot==false)
        {
            this.move_my_modules_to_main();
            
        }
        
        
        }
        else
        {
        if ((document.body.clientWidth<1000)&& document.body.clientHeight>document.body.clientWidth)
            {

                if (this.base.slot.container.classList.contains("flex_vertical")==false)
                {
                   this.base.slot.container.classList.remove("flex_horizontal");
                   this.base.slot.container.classList.add("flex_vertical");
                }

            }
            else
            {
                if (this.base.slot.container.classList.contains("flex_horizontal")==false)
                {
                   this.base.slot.container.classList.add("flex_horizontal");
                   this.base.slot.container.classList.remove("flex_vertical");
                }
            }
        }

    }
    move_my_modules_to_main()
    {
        //when the window is too narrow, all modules will be moved to one, "main", slot and all ohter slots will be hid.
        var main=this.base.main_slot;
        if (main!=null && main.html_id!=this.html_id)
        {
            this.children_in_main_slot=true;
            for (var j=0;j<this.modules_counter;j++)
                main.add_module(this.modules[j]);
            this.modules_counter=0;
            this.modules=Array();
            main.activate_module(main.active_module_index);
            main.activate_module(0);//activate the first module in the slot
            
            if (this.am_i_container_of_main()==false)
                this.hide();
            
            this.main_slot_width=main.container.offsetWidth;
        }
    }
    
    
    move_my_modules_back_from_main()
    {//reverse process: when the window becomes wider again
        var main=this.base.main_slot;
        if (main!=null)
        {
            for (var j=0;j<main.modules_counter;j++)
            {
                if (main.modules[j].real_parent_slot.html_id==this.html_id)
                {
                    this.add_module(main.modules[j]);
                    main.remove_module(j,false);
                    j--;
                }
            }
            this.children_in_main_slot=false;
            this.show();
            this.activate_module(-1);

        }
    }
    am_i_container_of_main()
    {//check, if this slot is the main slot
        var tmp;
        tmp=this.base.main_slot;
        if (this.html_id==tmp.html_id)
            return true;
        else
            while (tmp.parent_slot!=null)
            {
                tmp=tmp.parent_slot;
                if (tmp.html_id==this.html_id)
                    return true
            }
    
        return false;
        
    }
    
	show_only_me(really=false)
    {//nechá viditelný jen tento slot: to mohou vyžadovat některé moduly (např "home")
        if (this.parent_slot==null)
            return 0;
        var sibling_slots=this.parent_slot.slots;
        
        for (var i=0;i<sibling_slots.length;i++)
        {
            if (!(sibling_slots[i].html_id==this.html_id || sibling_slots[i].flying==true))
            {
                if (really==true)
                    sibling_slots[i].hide();
                else
                    sibling_slots[i].show();
            }
        }
        
    }
    
	hide()
    {
        this.container.style.display="none";
    }
    show()
    {
        if (this.children_in_main_slot==false)
            this.container.style.display="";
    }
	
	hide_bar_and_button()
    {
        this.title_bar.style.display="none";
    }
    hide_resize_button()
    {
        if (this.flying==true)
            this.container.style.resize="none";
    }
	attach_slot_to_element(element)
    {
        element.appendChild(this.container);
        if (this.flying==true)
        {
            this.container.classList.remove("flying_slot");
            this.container.classList.add("slot");
            this.container.style.flex="1 1 auto";
            this.title_bar.remove();
            this.title_bar=null;
            this.close_btn=null;
        }
    }
	
	on_mouse_down=(e)=>
	{
		this.get_focus();
	}
	
	after_slot_added()
	{
		this.inner_div.style.display="none";
		//this.container.style.display="flex";
		for (var i=0;i<this.slots.length;i++)
		{
			this.slots[i].adjust_visibility_of_resize_btn();
		}
		if (this.slots.length>0)
		{
			this.container.classList.add("contains_other_slots");
			this.taskbar.style.display="none";
		}
	}

	after_slot_removed()
	{
		for (var i=0;i<this.slots.length;i++)
		{
			this.slots[i].adjust_visibility_of_resize_btn();
		}
		if (this.slots.length==0)
		{
			this.container.classList.remove("contains_other_slots");
			this.inner_div.style.display="block";
			this.taskbar.style.display="block";
		}
	}
	
	adjust_visibility_of_resize_btn()
	{
		return 0;
		if (this.parent_slot!=null)
			if (this.parent_slot.get_next_child_slot(this.html_id)!=null)
				var rsz_btn=this.container.getElementsByClassName("slot_resize_btn")[0].style.visibility="visible";
			else
				var rsz_btn=this.container.getElementsByClassName("slot_resize_btn")[0].style.visibility="hidden";
	}
	
	get_next_child_slot(slot_id)
	{
		for (var i=0;i<this.slots.length;i++)
		{
			if (this.slots[i].html_id==slot_id)
				if (this.slots.length>(i+1))
					return this.slots[i+1];
				else
					return null;
		}
		return null;
	}
	
	remove=()=>
	{
		if (this.parent_slot!=null)
		{
			var i=0;
			for (i=0;i<this.slots.length;i++)
				this.slots[i].remove();
				
            for (i=0;i<this.modules_counter;i++)
                this.remove_module(i);
			
			this.container.remove();
			this.parent_slot.remove_child_slot(this.html_id);
			
		}
	}
	
	remove_child_slot=(id)=>
	{
		for (var i=0;i<this.slots.length;i++)
			if (this.slots[i].html_id==id)
			{
				this.slots.splice(i,1);
			}
		
		this.after_slot_removed();
	}
	move_start=(e)=>
	{
		this.moving_startX=e.clientX;
		this.moving_startY=e.clientY;
		document.documentElement.addEventListener('mousemove', this.move_drag, false);
		document.documentElement.addEventListener('mouseup', this.resize_and_move_stop, false);		
	}
	move_drag=(e)=>
	{
		var diff_X=e.clientX-this.moving_startX;
		var diff_Y=e.clientY-this.moving_startY;
		this.moving_startX=e.clientX;
		this.moving_startY=e.clientY;
		e.preventDefault();
		
		this.container.style.left=Number(this.container.offsetLeft+diff_X)+"px";
		this.container.style.top=Number(this.container.offsetTop+diff_Y)+"px";
	}
	
	resize_start=(e)=>
	{
		if (this.container.classList.contains("basic_flexed_element"))
		/* Měníme-li velikost pevných slotů, tj. těch zasazených do mřížky, pak musíme měnit hodnotu flex grow toho, u kterého jsme začali 
			se změnou, a následujícího. Pokud žádný následující není, nemáme co měnit: jsme na kraji možného prostoru
		*/
		{
			var next_slot=this.parent_slot.get_next_child_slot(this.html_id);
			if (next_slot!=null)
				var sibling=next_slot.container;
			else
				return 0;
			
			var parent=this.container.parentNode;
			this.resizing_startFlexGrow_of_sibling=Number(sibling.style.flexGrow);
			if (this.resizing_startFlexGrow_of_sibling==0)
				this.resizing_startFlexGrow_of_sibling=1;
			this.resizing_startFlexGrow=Number(this.container.style.flexGrow);
			if (this.resizing_startFlexGrow==0)
				this.resizing_startFlexGrow=1;
			var flex_grow_summa=Number(this.resizing_startFlexGrow)+Number(this.resizing_startFlexGrow_of_sibling);
			
			if (parent.classList.contains("flex_vertical"))
				var pixel_summa=Number(this.container.offsetHeight)+Number(sibling.offsetHeight);
			else
				var pixel_summa=Number(this.container.offsetWidth)+Number(sibling.offsetWidth);
			
			this.resizing_one_pixel_move=Number(flex_grow_summa/pixel_summa).toPrecision(4);
			this.resizing_startX=e.clientX;
			this.resizing_startY=e.clientY;
			document.documentElement.addEventListener('mousemove', this.resize_drag, false);
			document.documentElement.addEventListener('mouseup', this.resize_and_move_stop, false);		
		}

	}
	resize_drag=(e)=>
	{
		var diff_X=e.clientX-this.resizing_startX;
		var diff_Y=e.clientY-this.resizing_startY;
		
		if (this.flying==false)
		{
			if (this.container.parentNode.classList.contains("flex_vertical"))
				var diff=this.resizing_one_pixel_move*diff_Y;
			else
				var diff=this.resizing_one_pixel_move*diff_X;

		
			var sibling=this.container.nextSibling;
			this.container.style.flexGrow=this.resizing_startFlexGrow+diff;
			sibling.style.flexGrow=this.resizing_startFlexGrow_of_sibling-diff;
		}
		else
		{
			//c.style.width+=diff_X;
			//c.style.height+=diff_Y;
		}
	}
	resize_and_move_stop=(e)=>
	{
		document.documentElement.removeEventListener('mousemove', this.resize_drag, false);
		document.documentElement.removeEventListener('mouseup', this.resize_and_move_stop, false);
		document.documentElement.removeEventListener('mousemove', this.move_drag, false);
        
        var e=new CustomEvent("slot_resized",null);
            
        this.inner_div.dispatchEvent(e);
	}
	
	
	highlight(highlight,children_too=true)
	{
		var slot_info_box;
		
		if (highlight==true)
		{
			this.inner_div.style.display="none";

			slot_info_box=document.createElement("div");
			slot_info_box.classList.add("wsp_slot_info_box");
			slot_info_box.appendChild(document.createElement("span")).innerHTML=this.html_id;
			slot_info_box.id=this.html_id+"_slot_info_box";
			
			
			var flex_direction=document.createElement("div");
			flex_direction.classList.add("wsp_inline_btn");
			if (this.container.classList.contains("flex_horizontal"))
			{
				flex_direction.innerHTML=" H -> v";
				slot_info_box.appendChild(flex_direction);
			}
			else if (this.container.classList.contains("flex_vertical"))
			{
				flex_direction.innerHTML=" V -> h";
				slot_info_box.appendChild(flex_direction);
			}
			flex_direction.addEventListener("click",this.change_flex_flow);
			var remove=document.createElement("div");
			remove.classList.add("wsp_inline_btn");
			remove.innerHTML="x";
			remove.addEventListener("click",this.remove);
			slot_info_box.appendChild(remove);
			
			this.container.classList.add("slot_highlighted");
			
			slot_info_box.addEventListener("mouseover",this.info_box_mouseover);
			slot_info_box.addEventListener("mouseout",this.info_box_mouseout);
			
			this.container.appendChild(slot_info_box);
			
			this.show_slot_to_add();
		}
		else
		{
			
			this.container.classList.remove("slot_highlighted");
			slot_info_box=document.getElementById(this.html_id+"_slot_info_box");
			
			if (slot_info_box!=null)
				slot_info_box.remove();
			
			this.hide_slot_to_add();
			
			this.inner_div.style.display="";
		}
		if (children_too==true)
			for (var i=0;i<this.slots.length;i++)
				this.slots[i].highlight(highlight,children_too);
	}
	
	
	info_box_mouseover=()=>
	{
		this.container.classList.remove("slot_highlighted");
		this.container.classList.add("slot_highlighted_2");
	}
	info_box_mouseout=()=>
	{
		this.container.classList.remove("slot_highlighted_2");
		this.container.classList.add("slot_highlighted");
	}
	change_flex_flow=()=>
	{
		this.container.classList.toggle("flex_vertical");
		this.container.classList.toggle("flex_horizontal");
	}
	
	show_slot_to_add=()=>
	{
		if (this.container.classList.contains("flex"))
		{
			var slot_to_add=document.createElement("div");
			slot_to_add.classList.add("wsp_slot_to_add_flex");
			slot_to_add.id=this.html_id+"_slot_to_add";
		}
		if (slot_to_add!=null)
		{
			this.container.appendChild(slot_to_add);
			slot_to_add.addEventListener("click",this.slot_to_add_clicked);
		}
	}
	hide_slot_to_add()
	{
		var slot_to_add_to_remove=document.getElementById(this.html_id+"_slot_to_add");
		if (slot_to_add_to_remove!=null)
			slot_to_add_to_remove.remove();
	}
	
	slot_to_add_clicked=()=>
	{
		this.hide_slot_to_add();
		this.add_slot(["flex"]).highlight(true,true);
		this.show_slot_to_add();
	}

	add_slot(cssclasses,flex_grow="1",container=null)
	{
		
		this.container.getElementsByClassName("inner_slot")[0].style.display="none";
		
		
		var basic_class,resize;
		if (this.container.classList.contains("flex"))
			basic_class="basic_flexed_element";
		if (this.container.classList.contains("flex_horizontal"))
			resize="flexed_horizontally";
		else if (this.container.classList.contains("flex_vertical"))
			resize="flexed_vertically";	
			
		if (Array.isArray(cssclasses)==false)
			cssclasses=[cssclasses];
		cssclasses.push(basic_class);
		cssclasses.push(resize);
		
		var slot=new cls_slot(this,cssclasses,flex_grow,false,0,0,container);
		this.slots.push(slot);
		
		//container.style.borderColor="#f5f5f5";
		this.container.classList.add("contains_other_slots");
		
		
		//if (this.parent_slot!=null)
			this.after_slot_added();
		
		return this.slots[this.slots.length-1];
	}
	loose_focus()
	{
		if (this.flying==true)
		{
			this.container.classList.remove("flying_slot_highlighted");
			this.has_focus=false;
		}
	}
	get_focus()
	{
		if (this.flying==true)
		{
			this.container.classList.add("flying_slot_highlighted");
			this.just_got_focus=true;
			this.has_focus=true;
			this.parent_slot.defocus_flying_slots(this.html_id);
		}

	}

	
	add_module(module)
	{
        this.inner_div.appendChild(module.module_container);
        module.taskbar_item=document.createElement("div");
        this.modules.push(module);
        //module.taskbar_item.style.backgroundColor=module.taskbar_bckg_color;
        module.taskbar_item.style.color=module.taskbar_color;
        module.taskbar_item.innerHTML=module.taskbar_text;
        module.taskbar_item.classList.add("slot_modules_taskbar_item");
        module.taskbar_item.addEventListener("click",this.taskbar_item_clicked);
        module.taskbar_item.addEventListener("mouseenter",this.taskbar_item_onmouseover);
        module.taskbar_item.addEventListener("mouseleave",this.taskbar_item_onmouseout);
        module.taskbar_item.dataset["index"]=this.modules_counter;//ještě přd následující zvýšením o 1, toto je index, tamto počet
        this.taskbar.appendChild(module.taskbar_item);
        
        this.modules_counter+=1;
        if (this.modules_counter<=1)
        {
            this.taskbar.style.display="none";
            this.inner_div.style.left="5px";
        }
        else
        {
            this.taskbar.style.display="block";
            this.inner_div.style.left=this.taskbar.offsetWidth+"px";
        }
        return this.modules_counter;
        
	}
	remove_module(index,destroy=true)
	{
        if (destroy==true)
        {
            this.modules[index].destroy();
            this.modules[index]=null;
        }
        this.modules.slice(index,1);
        this.modules_counter--;
	}
	
	taskbar_item_clicked=(e)=>
	{
        var index=this.get_taskbark_item(e.target).dataset["index"];
        this.activate_module(Number(index));
	}
	get_taskbark_item(el)
	{
        while (el.classList.contains("slot_modules_taskbar_item")==false)
        {
            if (el.tagName=="body")
                return null;
            el=el.parentNode;
        }
        return el;
	}
	taskbar_item_onmouseover=(e)=>
	{
        
        var index=this.get_taskbark_item(e.target).dataset["index"];
        e.target.classList.add("slot_modules_taskbar_item_expanded");
        var div_module_name=document.createElement("div");
        div_module_name.innerHTML=this.modules[Number(index)].module_name;
        div_module_name.classList.add("slot_modules_taskbar_item_module_name");
        var div_module_label=document.createElement("div");
        div_module_label.innerHTML=this.modules[Number(index)].label;
        div_module_label.classList.add("slot_modules_taskbar_item_module_label");
        e.target.innerHTML="";
        e.target.appendChild(div_module_name);
        e.target.appendChild(div_module_label);
        var w=Math.max(div_module_name.scrollWidth,div_module_label.scrollWidth)+10+"px";
        if (w>window.innerWidth*0.9) w=window.innerWidth*0,9;
        e.target.style.width=w;
        //e.target.innerHTML="<div class=''>"+this.modules[Number(index)].module_name+"</div><div class=''>"+this.modules[Number(index)].label+"</div>";
        for (var i=0;i<e.target.childNodes.length;i++)
        {
            e.target.childNodes[i].addEventListener("click",this.taskbar_item_clicked);
        }
	}
	taskbar_item_onmouseout=(e)=>
	{
        var index=this.get_taskbark_item(e.target).dataset["index"];
        e.target.classList.remove("slot_modules_taskbar_item_expanded");
        e.target.innerHTML=this.modules[Number(index)].taskbar_text;
        e.target.style.width="45px";
	}
	
	activate_module(index)
	{
        if (index==-1)
            index=this.modules_counter-1;
        this.active_module_index=index;
        if (index>-1 && index<this.modules_counter)
        {
            for (var i=0;i<this.modules_counter;i++)
            {
                if (i!=index)
                {
                    this.modules[i].module_container.dataset["style_display"]=this.modules[i].module_container.style.display;
                    this.modules[i].module_container.style.display="none";
                    this.modules[i].taskbar_item.classList.remove("active");
                }
                else
                {
                    var d=this.modules[i].module_container.dataset["style_display"];
                    if (d="")
                        d="block";
                    this.modules[i].module_container.style.display=d;
                    this.modules[i].taskbar_item.classList.add("active");
                    if (this.modules[i].display_only_my_slot==true)//modul vyžaduje, aby ostatní sloty byly skryty...
                        this.show_only_me(true);
                    else
                        this.show_only_me(false);
                }
            }
        }
	}
	
	set_label(text)
	{
        if (text=="")
        {
            this.label.style.display="hidden";
        }
        else
        {
            this.label.style.display="block";
            this.label.innerHTML=text;
        }
	}
	/*####################################################################################################################################################################################
######################################################################################################################################################################################
####################################################################################################################################################################################*/
} 
