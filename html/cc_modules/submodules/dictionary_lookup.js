var dictionary_lookup_loaded=true;

/*
 *localhost: 16.2.2022 0:28
 */

class cls_smod_dictionary_lookup
{
    constructor(container,external_input_textbox=null, external_results_div=null,external_options_container=null)
    {
        if (external_input_textbox==null)
        {
            this.wrapper=div("margin_10",container);
            this.title=div("",this.wrapper,"Dictionary lookup:",true);
            this.input_textbox=textbox("textbox",this.wrapper,"",true,this.textbox_key_pressed);
            this.results_div=div("",this.wrapper);
            this.onKeyPress_modification_key="";
            this.submit_btn_label="Find in dictionary";
        }
        else
        {
            this.input_textbox=external_input_textbox;
            this.input_textbox.addEventListener("keypress",this.textbox_key_pressed);
            this.results_div=external_results_div;
            this.onKeyPress_modification_key="ctrl";//shift=16; ctrl=17, alt=18;
            this.submit_btn_label="Find in dictionary (CTRL+ENTER)";
        }
        this.container=container;
        this.group_results="dictionary";
        document.body.addEventListener("word_selected",this.word_in_text_selected);
    }
    word_in_text_selected=(e)=>
    {
        this.submit_query(e.detail.word);
    }
    textbox_key_pressed=(e)=>
    {
        var mk=e[this.onKeyPress_modification_key+"Key"];
        if ((e.keyCode==13 || e.keyCode==10) && ((this.onKeyPress_modification_key=="" && e.ctrlKey==false && e.altKey==false && e.shiftKey==false && e.metaKey==false)
            || (e[this.onKeyPress_modification_key+"Key"]==true)))
        {
            this.submit_query(this.input_textbox.value);
        }
    }
    submit_button_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.submit_query(this.input_textbox.value);
    }
    submit_query=(query)=>
    {
        var me=this;
        var xhttp=new XMLHttpRequest();
        xhttp.onreadystatechange=function()
        {
            if (this.readyState == 4 && this.status == 200)
                me.results_received(this.responseXML);
        }
        var gr=query.match(/^g:(.*)/);//zjistíme, jestli uživatel nechce vyhledávat v řečtině (pomoí g:+latinkou trnaskribovaná řečtina)
        if (gr!=null)
            query=gr[1]+"&language=greek";
        
        //B.sandglass.open(this.container);
        
        xhttp.open("GET",url+"php_modules/dictionary_lookup.php?&query="+query,true);
        xhttp.send(null);
    }
    results_received=(xml)=>
    {
        clean_element(this.results_div);
        
      
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
        var rb=this.results_div.parentNode.parentNode.getElementsByClassName("rbt_switch_results_dict");//aktivujeme případné přepínací políčko
        if (rb.length!=0)
            rb[0].control.checked=true;
        
        if (this.group_results=="dictionary")
        {
            
            var dicts_used=xml.evaluate("/cc:dictionary_lookup_result/cc:dictionaries_used/cc:dictionary",xml,ns);
            var dict_used=null;
            var n=0;
            var info_div=div("border_h3 padding_5",this.results_div,"");
            var query=xp(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:query");
            div("",info_div,"Dictionary lookup for <strong>'"+query+"'</strong>");
            var c_lemmata=xp(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/@count");
            var f_lemmata="lemma";
            if (Number(c_lemmata)>1) f_lemmata="lemmata";
            var c_entries=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionary_entry)");
            var f_entries="entry";
            if (Number(c_entries)>1) f_entries="entries";
            var c_dictionaries=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionaries_used/cc:dictionary)")
            var f_dictionaries="dictionary";
            if (Number(c_dictionaries)>1) f_dictionaries="dictionaries";
            div("",info_div,"Found "+c_lemmata+" "+f_lemmata+" and "+c_entries+" "+f_entries+" in " +c_dictionaries +" "+f_dictionaries);
            
            //morphological analysis
            var m_an=new cls_morphological_analysis();
            var perseus_c=xp(xml,"count(/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes)");
            var total_ma_elements=xp_a(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes");
            total_ma_elements=m_an.count_items(total_ma_elements,"Perseus");
            if (perseus_c>0)//only, if there is MA result from perseus table
            {
                if (total_ma_elements>=2)
                    this.btn_show_ma=button("",info_div,"&nbsp;Display word form analysis&nbsp;",true,this.btn_show_ma_clicked);
                this.div_ma=div("",info_div,"",!(total_ma_elements>=2));
                div("bold",this.div_ma,"Perseus word form analysis");
                var morph_lemmata=xpei(xml,"/cc:dictionary_lookup_result/cc:dictionary_lookup/cc:morphology/cc:morphological_analysis[@source='Perseus']/cc:morph_codes");
                var morph_lemma;
                
                var m_codes=new Array();
                var ma_lines_count=0;
                while (morph_lemma=morph_lemmata.iterateNext())
                {
                    span("font_75p",this.div_ma,m_an.transform("Perseus",morph_lemma.attributes.getNamedItem("lemma").textContent,morph_lemma.attributes.getNamedItem("short_def").textContent,morph_lemma.textContent));
                }
            }
            while (dict_used=dicts_used.iterateNext())
            {
                
                var dd=div("border_h3",this.results_div);
                span("bold",dd,dict_used.innerHTML);
                var entries=xml.evaluate("/cc:dictionary_lookup_result/cc:dictionary_entry[@dictionary_name='"+dict_used.innerHTML+"']",xml,ns);
                var entry=null;
                while(entry=entries.iterateNext())
                {
                    n++;
                    var hom_nr=entry.getAttribute("hom_nr");
                    if (hom_nr!=="")
                        hom_nr=hom_nr+". ";
                    var lemma=entry.getAttribute("entry");
                    var ed=div("margin_3",dd);
                    //span ("bold",ed,lemma+": ");
                    var s=span ("inline-block mod_Dict_truncated_dictionary_entry",ed,hom_nr+entry.innerHTML);
                    var btn=button("mod_Dict_show_full_entry opaque",s,"Show full text...","block",this.show_full_entry);
                }
                
                
            }
            if (n==0)//ve výsledcích nic není...
                span ("inline-block",this.results_div,"&nbsp;No match found.");
            //B.sandglass.close();
        }
    }
    show_full_entry=(e)=>
    {
        if (!(kb_click(e))) return false;
        var span=parent(e.currentTarget,"mod_Dict_truncated_dictionary_entry");
        if (span!=null)
        {
            span.classList.remove("mod_Dict_truncated_dictionary_entry");
            span.classList.add("mod_Dict_full_dictionary_entry");
            e.currentTarget.remove();
        }
        
    }
    btn_show_ma_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        this.btn_show_ma.remove();
        this.div_ma.style.display="block";
    }
    
}
class cls_morphological_analysis
{
    constructor()
    {
        this.p=Array();//Perseus
        this.p[0]=new Map();
        this.p[0].set("a","adjective");
        this.p[0].set("c","conjunction");
        this.p[0].set("d","adverb");
        this.p[0].set("e","interjection");
        this.p[0].set("m","numeral");
        this.p[0].set("n","noun");
        this.p[0].set("p","pronoun");
        this.p[0].set("r","preposition");
        this.p[0].set("t","participle");
        this.p[0].set("v","verb");
        this.p[0].set("-","");
        this.p[1]=new Map();
        this.p[1].set("1","1st");
        this.p[1].set("2","2nd");
        this.p[1].set("3","3rd");
        this.p[1].set("P","participle");
        this.p[2]=new Map();
        this.p[2].set("s","sg.");
        this.p[2].set("p","pl.");
        this.p[3]=new Map();
        this.p[3].set("p","praes.");
        this.p[3].set("r","pf.");
        this.p[3].set("f","fut.");
        this.p[3].set("i","impf.");
        this.p[3].set("l","plqpf.");
        this.p[3].set("t","fut. II");
        this.p[4]=new Map();
        this.p[4].set("p","");//duplicitní informace, je již na první pozici (t)
        this.p[4].set("n","inf.");
        this.p[4].set("s","subj.");
        this.p[4].set("i","ind.");
        this.p[4].set("m","imp.");
        this.p[4].set("g","gerund.");
        this.p[4].set("u","sup.");
        this.p[5]=new Map();
        this.p[5].set("p","pas.");
        this.p[5].set("a","act.");
        this.p[6]=new Map();
        this.p[6].set("f","fem.");
        this.p[6].set("n","neut.");
        this.p[6].set("m","masc.");
        this.p[6].set("c","com.");
        this.p[6].set("x","com.");
        this.p[7]=new Map();
        this.p[7].set("n","nom.");
        this.p[7].set("g","gen.");
        this.p[7].set("d","dat.");
        this.p[7].set("a","acc.");
        this.p[7].set("v","voc.");
        this.p[7].set("b","abl.");
        this.p[8]=new Map();
        this.p[8].set("s","superl.");
        this.p[8].set("c","comp.");
         
    }
    count_items(arr_codes,source)
    {
        if (source=="Perseus")
        {
            if (arr_codes!=null)
            {
                var codes=arr_codes.join("|");
                var count=codes.match(/\|/g);
                if (count!=null)
                    return count.length+1;
                else
                    return 0;
            }
        }
    }
    transform(source,lemma,short_def,morph_codes)
    {
        morph_codes=morph_codes.split("|");
        if (source=="Perseus")
        {
            if (short_def!="")
                short_def=" ("+short_def+")";
            var rv="<strong>"+lemma+"</strong>"+short_def+":<br/>";
            for (var i=0;i<morph_codes.length;i++)
            {
                var mc=morph_codes[i].split("");
                var res=Array(9).fill("");
                for (var j=0;j<=8;j++)
                {
                    if (this.p[j].has(mc[j]))
                        res[j]=this.p[j].get(mc[j]);
                }
                rv+="<span class='l_margin_5'>"+res.join(" ").replace(/\s+/g," ")+"</span><br/>";
            }
            
            
            return rv;
        }
                
    }
}
