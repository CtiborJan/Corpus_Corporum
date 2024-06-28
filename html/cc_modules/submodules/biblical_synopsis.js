class cls_smod_biblical_synopsis
{
    constructor(synopsis_manager)
    {
        this.synopsis_mode=1;
        this.name="Biblical synopsis";
        this._synopsis_manager=synopsis_manager;
        this._documents_=Array();
        this.leading_doc=null;
        this.synopsis_mode=1;
        var me=this;
        this.control_panel=new cls_control_panel(this._synopsis_manager.TxVw,this._synopsis_manager.TxVw.cp_strip,"",0);
        //this.control_panel.no_opacity();

        var add_document=function()
        {
            if (me._synopsis_manager.TxVw.documents.length<5)
                me._synopsis_manager.TxVw.add_new_document("","",1);
            me.align();
        }
        var open_help=function()
        {
            window.open("https://mlat.uzh.ch/help.html#biblical_synopsis","_blank");
        }
        var align_texts=function()
        {
            me.align();
        }
        var tmp=this.control_panel.add_item(null,"+","Open another synoptic column",add_document);
        tmp=this.control_panel.add_item(null,"⥮","Synchronize columns",align_texts);
        tmp=this.control_panel.add_item(null,"?","Help and about synoptic Bible",open_help);
        

        var versions=function(json)
        {
            me.bible_data=JSON.parse(json.responseText);
            for (var i=0;i<me.bible_data.versions.length;i++)
            {
                me.bible_data.versions[i].get_book=function(identifier,index=null)
                {
                    for (var j=0;j<this.books.length;j++)
                    {
                        if (typeof(identifier)=="string")
                        {
                            if (this.books[j].id==identifier || this.books[j].name==identifier || this.books[j].pid==identifier)
                            {
                                if (index!=null) 
                                    index[0]=j; //pokud nás zajímá i index knihy, získáme ho referencí, ale ta funguje jen s poli nebo objekty
                                return this.books[j];
                            }
                        }
                        else if (typeof(identifier)=="number" || identifier.match(/[0-9]+/))
                            return this.books[Number(identifier)];
                    }
                    return null;
                }
                me.bible_data.versions[i].get_chapter=function(book,identifier)
                {
                    for (var j=0;j<book.chapters.length;j++)
                    {
                        
                        if (book.chapters[j].n==identifier)
                        return book.chapters[j];
                        
                    }
                    return null;
                }
                me.bible_data.position_add=function(pos,add)
                {//pos=objekt pozice {version,book,chapter,verse},add=to samé, ale místo absolutních hodnot obsahuje, kolik se má přidat. 
                 //!!! číselné hodnoty v chapter a verse nejsou indexy! Tj. Gen 1,1={book:"gen",chapter:1,verse:1}!!!
                    if (pos.chapter=="")
                        pos.chapter=0;
                    if (pos.verse=="")
                        pos.verse=0;
                    pos.chapter=Number(pos.chapter);
                    pos.verse=Number(pos.verse);
                    var new_pos={version:pos.version,book:pos.book,chapter:pos.chapter,verse:pos.verse};
                    var b_index=[-1];
                    var v=this.versions[this.version_abbr_to_index(pos.version)];
                    var b=v.get_book(pos.book,b_index);
                    
                  
                    if (add.book==0 && add.chapter==0)
                    {
                        var ch=v.get_chapter(b,pos.chapter);
                        var max_v=ch.v;

                        if (pos.verse+add.verse>max_v)//přetekli jsme do následující kapitoly
                        {
                            if (pos.chapter==Number(b.count))
                            {//přetékáme i do následující knihy!
                                new_pos.chapter=1;
                                new_pos.verse=1;
                                var b_index2=Array();
                                v.get_book(pos.book,b_index2).id;
                                new_pos.book=v.get_book(b_index2[0]+1).id;
                            }
                            else
                            {
                                new_pos.chapter++;
                                new_pos.verse=add.verse;
                            }
                        }
                        else//zůstali jsme uvnitř kapitoly
                        {
                            new_pos.verse++;
                        }
                    }
                    else if (add.book==0)
                    {
                        new_pos.chapter+=add.chapter;
                        if (new_pos.chapter>Number(v.get_book(pos.book).count))//přetekli jsme do další knihy
                        {
                            b_index[0]++;
                            new_pos.chapter=1;
                        }
                        else if (new_pos.chapter<=0)//přetekli jsme do další knihy
                        {
                            b_index[0]--;
                            if (b_index[0]>=0)
                                new_pos.chapter=v.books[b_index[0]].count;
                            else
                                return null;//jsme mimo rozsah
                        }
                        if (new_pos.book>=v.books.length || new_pos.book<=0)//přetekli jsme zcela mimo rozsah knih...
                                new_pos=null;
                        else
                            new_pos.book=v.books[b_index[0]].id;
                    }
                    else
                    {
                        b_index[0]+=add.book;
                        if (b_index[0]<0 || b_index[0]>v.books.length-1)//přetekli jsme mimo verzi...
                            return null;
                        new_pos.book=v.books[b_index[0]].id;
                    }
                    return new_pos;
                }
                me.bible_data.version_abbr_to_index=function(abbr)
                {
                    if (typeof(abbr)=="number" || abbr.match(/^[0-9]+$/))
                        return Number(abbr);//nejde o zkratku, ale o index
                    for (var i=0;i<this.versions.length;i++)
                        if (this.versions[i].abbr==abbr)
                            return i;
                }
                me.bible_data.version_index_to_abbr=function(index)
                {
                    if (typeof(index)=="number" || index.match(/^[0-9]+$/))
                        return this.versions[index].abbr;
                    else//nějakým nedopatřením jsme už asi dostali rovnou zkratku
                        return index;

                }
            }
        }
        ajax(url+"php_modules/biblical_synopsis.php?function=get_bible_versions",versions,"GET",null,false);
    }
  
    
    add_document=(d)=>
    {
        d.close_document();
        this._documents_.push(d);
        this.create_control_bar(d);
        if (this.leading_doc==null)
        {
            this.leading_doc_changed(d);
        }
        d.synopsis=this;
        d.set_layout(2);
        d.vnavigation.hide();
        d.bs={
            lock_scrolling:true,
            div_scroll_lock:null,
            finished_loading:false,
            version:-1,
            pos:null
        };
    }
    version_selected=(doc,version_index)=>
    {/*v nějakém ze synoptických oken byla změněna/vybrána verze bible, která se má zobrazovat. Chování se liší podle toho,
        zda k tomu došlo v řídícím dokumentu, anebo v jiném: v prvním případě zatím neděláme nic, protože čekáme, až bude skutečně otevřena nějaká
        pasáž. V případě neřídícíh dokumentů ale musíme nahrát příslušnou pasáž, která je otevřena v dokumentu řídícím
     */
        if (doc===this.leading_doc)
        {
            //neděláme nic...
        }
        else
        {
            
        }
        
        
    }
    align=(align_by="verse")=>
    {//funkce, která zarovná verše na správnou výšku, aby byly na stejné úrovni s dalšími odpovídajícími
        
        var me=this;
        var normalize_headers=function()
        {/*funkce, která sjednotí úroveň hlaviček (protože některé verze mají o úroveň víc [VT+NT], tedy mají úrovně posunuté)
            Výsledek bude, že hlavičky knih budou h1, hlavičky kapitol h2
            */
            for (var i=0;i<me._documents_.length;i++)
            {
                //někdy nedostaneme hlavičku třeba pro knihu. Tady to zkontrolujeme a doplníme
                var divs=me._documents_[i].__tpages[0].text_body.getElementsByClassName("text_section");
                for (var j=0;j<divs.length;j++)
                {
                    if (divs[j].children[0].classList.contains("head")==false)
                    {
                        var div_xml_id=divs[j].getAttribute("xml-id");
                        if (div_xml_id!=null && div_xml_id!="" && div_xml_id!="VT")
                        {
                            var title=me.bible_data.versions[Number(me._documents_[i].bs.version)].get_book(div_xml_id).name;
                            var h1=create_element("h1","head",null,title);
                            divs[j].insertBefore(h1,divs[j].children[0]);
                        }
                    }
                }
                var heads=me._documents_[i].__tpages[0].text_body.getElementsByClassName("head");
                for (var j=0;j<heads.length;j++)
                {
                    var pdiv=get_first_parent_div(heads[j]);
                    var pdiv_xml_id=pdiv.getAttribute("xml-id");
                    if (pdiv_xml_id!=null && pdiv_xml_id!="")//xml-id mají uvedeno knihy (je to zkratka konkrétní knihy)
                    {//tedy se jedná o hlavičku knihy
                        if (heads[j].tagName.toLowerCase()!="h1")
                        {
                            var h1=create_element("h1","head");
                            h1.innerHTML=heads[j].textContent;
                            var pn=heads[j].parentNode;
                            var ns=heads[j].nextSibling;
                            heads[j].remove();
                            pn.insertBefore(h1,ns);
                        }
                    }
                    else
                    {//hlavička kapitoly
                        if (heads[j].tagName.toLowerCase()!="h2")
                        {
                            var h2=create_element("h2","head");
                            h2.innerHTML=heads[j].textContent;
                            var pn=heads[j].parentNode;
                            var ns=heads[j].nextSibling;
                            heads[j].remove();
                            pn.insertBefore(h2,ns);
                        }
                    }
                }
            }
        }
        var find_corresponding_element=function(d1,d1_book,d1_chapter,d1_verse,d2,d2_ms)
        {//funkce, která najde odpovídající elementy 
            if (d2.synopsis_correspondences==undefined || d2.synopsis_correspondences.length==1)//žádné zvláštnosti
            {
                for (var i=d2_ms.index;i<d2_ms.ms.length;i++)
                {
                    var d2_chapter=get_first_parent_div(d2_ms.ms[i]).getAttribute("xml-n");
                    var d2_verse=d2_ms.ms[i].getAttribute("value");
                    if (d2_chapter==d1_chapter && d2_verse==d1_verse)
                    {
                        d2_ms.index=i;
                        return d2_ms.ms[i];
                    }
                    else if(Number(d2_chapter)>Number(d1_chapter))
                    {//chtěný verš z d1 nemá svůj protějšek v d2
                        d2.index=i;
                        return null;
                    }
                }
            }
            else
            {//musíme spočítat, co odpovídá...
                var d2_book=d1_book;
                var d2_chapter=Number(d1_chapter);
                var d2_verse=Number(d1_verse);
                for (var i=0;i<d2.synopsis_correspondences.length;i+=2)
                {
                    if ((d2.synopsis_correspondences[i].from.book==d1_book || d1_book==null/*  */) &&
                         d2.synopsis_correspondences[i].from.chapter<=Number(d1_chapter) && d2.synopsis_correspondences[i].to.chapter>=Number(d1_chapter) &&
                         d2.synopsis_correspondences[i].from.verse<=Number(d1_verse) && d2.synopsis_correspondences[i].to.verse>=Number(d1_verse))
                         {//jsme uvnitř nějaké diskrepance
                            d2_book=d2.synopsis_correspondences[i+1].from.book;
                            d2_chapter+=Number(d2.synopsis_correspondences[i+1].from.chapter-d2.synopsis_correspondences[i].from.chapter);
                            d2_verse+=Number(d2.synopsis_correspondences[i+1].from.verse-d2.synopsis_correspondences[i].from.verse);
                            break;                            
                         }
                }
                return d2_ms.get_ms(d2_book,d2_chapter,d2_verse);
            }
        }
        var get_first_parent_div=function(ms)
        {
            var tmp=ms.parentNode;
            while (tmp.tagName.toLowerCase()!="div")
            {
                tmp=tmp.parentNode;
                if (tmp==null)
                    return null;
            }
            return tmp;
        }

        normalize_headers();

        var doc_texts=Array();
        for (var j=0;j<this._documents_.length;j++)
        {
            var text_element=this._documents_[j].__tpages[0].text_body.getElementsByClassName("text")[0];
            if (text_element!=undefined)    
                text_element.classList.add("synopsis_align_by_milestone");
            else
                text_element=null;
            doc_texts.push(text_element);
        }


        if (align_by=="verse")
        {
            if (doc_texts[0]==null)
                return 0;
            //nejprve si vytvoříme objekty s milestone a jejich "indexy"
            //(ukazujícími na počátky jednotlivých kapitol/knih), aby to celé mohlo proběhnout aspoň trochu rychleji
            var d0_ms=doc_texts[0].getElementsByTagName("milestone");
            var d_ms=Array();
            for (var i=0;i<this._documents_.length;i++)
            {  
                if (doc_texts[i]!=null)//pokud je text nahrán...
                {
                    var ms=doc_texts[i].getElementsByTagName("milestone");
                    var indices=Array();
                    var book_index=Array();
                    var prev_b="";
                    var prev_ch="";
                    for (var j=0;j<ms.length;j++)
                    {//vytvoříme indexy: tzn. zaznamenáme index v poli ms na začátku každé nové kapitoly a knihy
                        var ch=get_first_parent_div(ms[j]);
                        var ch_n=ch.getAttribute("xml-n");
                        var b=get_first_parent_div(ch);
                        var b_id=b.getAttribute("xml-id");
                        
                        if (prev_b!=b_id && prev_b!="")
                        {//změnila se kniha: uložíme tedy do objektu informace o indexech v právě "dokončené" knize
                            indices.push({book_id:prev_b,ch_indices:book_index});
                            book_index=Array();
                        }
                        
                        if (prev_ch!=ch_n)//změnila se kapitola:uložíme informace o aktuální (protože ty, na rozdíl
                        //od knihy, nesbíráme postupně, ale máme je všechny k dispozici teď)
                            book_index.push({chapter:ch_n,ms_index:j});
                        prev_ch=ch_n;
                        prev_b=b_id;
                        
                    }
                    
                    indices.push({book_id:b_id,ch_indices:book_index});

                    d_ms.push({ms:ms,index:0,indices:indices,get_ms:function(b,ch,v)
                    {//funkce pro vyhledání příslušného milestone po zadání pozice (kniha, kapitola, verš)
                        for (var i=0;i<this.indices.length;i++)
                        {
                            if (this.indices[i].book_id==b || this.indices[i].book_id==null)
                            {/*je-li nahrána jen jedna kapitola, chybí nám div s knihou, tedy ani nemůže být v indexech, a proto = nulll */
                                for (var j=0;j<this.indices[i].ch_indices.length;j++)
                                {
                                    if (this.indices[i].ch_indices[j].chapter==ch)
                                    {
                                        var next_ch_ms_index=this.ms.length;//zjistíme si, jakým indexem začíná příští kapitola (či kniha)
                                        //protože pokud by ms-index+v bylo větší než tato hodnota, znamenalo by to,
                                        //že příslušný verš neexistuje!
                                        if (this.indices[i].ch_indices.length-1>j)//příští kapitola
                                            next_ch_ms_index=this.indices[i].ch_indices[j+1].ms_index;
                                        else if (this.indices.length-1>i)//příští kniha
                                            next_ch_ms_index=this.indices[i+1].ch_indices[0].ms_index;
                                        
                                        
                                        for (var k=this.indices[i].ch_indices[j].ms_index;k<next_ch_ms_index;k++)
                                        {//nyní začneme od indexu kapitoly procházet milestony, dokud nenarazíme na ten s value=požadovaný verš
                                            if (this.ms[k].getAttribute("value")==v)
                                                return this.ms[k];
                                        }
                                        return null;//pokud jsme ho nenašli
                                        
                                    }
                                }
                            }
                        }
                        return null;
                    }
                    });

                    var bs=this._documents_[i].bs;
                    //přidáme zámeček pro uzamčení/odemčení skrolování
                    this._documents_[i].bs.div_scroll_lock=div("mod_TxVw_synopsis_scroll_lock",this._documents_[i].text_section.section_container);
                    this._documents_[i].bs.div_scroll_lock.title="";
                    this._documents_[i].bs.div_scroll_lock.dataset["index"]=i;
                    var me=this;
                    this._documents_[i].bs.div_scroll_lock.onclick=function()
                    {
                        var index=this.dataset["index"];
                        var bs=me._documents_[index].bs;

                       bs.lock_scrolling=!bs.lock_scrolling;
                        if (bs.lock_scrolling==false)
                            this.classList.add("unlocked");
                        else
                            this.classList.remove("unlocked");
                    }
                }
            }



            for (var i=0;i<d0_ms.length;i++)
            {//začneme procházení milestonů z řídícího elementu, jednoho po druhém, a budeme s ním srovnávat příslušené ms v ostatních dok.
                var chapter=get_first_parent_div(d0_ms[i]);
                if (chapter!=null)
                {//najdeme si číslo kapitoly a zkratku knihy...
                    var book_id=get_first_parent_div(chapter).getAttribute("xml-id");
                    var chapter_n=chapter.getAttribute("xml-n");
                    var verse_n=d0_ms[i].getAttribute("value");

                    //nalezneme odpovídající milestony v ostatních dokumentech
                    var corresponding_html_element=Array();
                    corresponding_html_element.push(d0_ms[i]);//ten z řídícího přidáváme rovnou, ten je jasnej
                    for (var j=0;j<this._documents_.length;j++)
                    {
                        if (this._documents_[j]!==this.leading_doc && doc_texts[j]!=null)
                        {//ověříme pro případ, že je tento sloupec momentálně neobsazený, anebo jde o řídící dokument
                            corresponding_html_element.push(find_corresponding_element(this._documents_[0],book_id,chapter_n,verse_n,
                                this._documents_[j],d_ms[j]));//a přidáme do pole odpovídající ms
                        } 
                    }
                    //nejdřív musíme zarovnat případné hlavičky
                    var heads=Array();
                    var max_h_top=0;
                    for (var k=0;k<corresponding_html_element.length;k++)
                    {
                        if (corresponding_html_element[k]!=null)
                        {
                            if (corresponding_html_element[k].getAttribute("value")==1)
                            {
                                var d=get_first_parent_div(corresponding_html_element[k]);

                                var h=d.getElementsByClassName("head");
                                if (h.length>0)
                                    heads.push(h[0]);
                                if (h[0].offsetTop>max_h_top)
                                    max_h_top=h[0].offsetTop;
                            }
                        }
                    }
                    if (heads.length>1)
                    {
                        for (var k=0;k<heads.length;k++)
                        {
                            heads[k].style.paddingTop=Number(max_h_top-heads[k].offsetTop)+"px";
                        }
                    }

                    //nyní upravíme pozici samotných veršů
                    var max_top=0;
                    for (var k=0;k<corresponding_html_element.length;k++)
                    {//nejprve najdeme ten sahající nejníže
                        if (corresponding_html_element[k]!=null)
                        {
                            if (corresponding_html_element[k].offsetTop>max_top)
                                max_top=corresponding_html_element[k].offsetTop;
                        }
                    }
                   
                    for (var k=0;k<corresponding_html_element.length;k++)
                    {//a pak ostatní upravíme tak, aby se s ním srovnaly...
                        if (corresponding_html_element[k]!=null)
                        {
                            corresponding_html_element[k].style.paddingTop=Number(max_top-corresponding_html_element[k].offsetTop)+"px";
                            
                        }
                    }
                    
                }
            }
        }
        B.sandglass.close();
    }

    

    leading_text_changed=()=>
    {/*
        když je zadán požadavek na nahrání nového textu v řídícím dokumentu
        */
        
    }
   
    on_after_document_loaded=(e)=>
    {//byl nahrán nějaký dokument ze synopse
        for (var i=0;i<this._documents_.length;i++)
        {
            if (e===this._documents_[i])
            {
                this._documents_[i].bs.loading_finished=true;
                
                
            }
        }
        var all_loaded=true;
        for (var i=0;i<this._documents_.length;i++)
        {
            if (this._documents_[i].bs.loading_finished!=true)
                all_loaded=false;
        }
        if (all_loaded==true)
        {//toto byl poslední dokument, na který jsme při aktuálním nahrávání čekali
            window.setTimeout(this.align,200);
            for (var i=0;i<this._documents_.length;i++)
            {
                this._documents_[i].bs.loading_finished=false;
            }
            
        }
        if (e===this.leading_doc)
        {//jde o řídící dokument. Přidáme tlačítka pro následující a předcházející 
            var pp,np;
            pp=this.previous_position();
            np=this.next_position();
            var me=this;
            var load_previous=function()
            {
                me.load_text(e,pp)
            }

            var load_next=function()
            {
                me.load_text(e,np)
            }

            var what="";
            if (pp!=null)
            {
                if (pp.verse!=0)
                    what="verse";
                else if (pp.chapter!=0)
                    what="chapter";
                else
                    what="book";
            }

            var d=div("mod_TxVw_bs_next_prev",e.address_bar);
            if (pp!=null)
            {
                var s=div("mod_TxVw_bs_position previous",d," ←  ");
                s.title="Previous "+what;
                s.addEventListener("click",load_previous);
            }
            if (np!=null)
            {
                var s=div("mod_TxVw_bs_position next",d," → ");
                s.title="Next "+what;
                s.addEventListener("click",load_next);
            }  
           
        }
        
    }
    load_text=(triggering_document,position,only_on_index=-1)=>
    {/*dostali jsme požadavek nahrát do synoptického zobrazení nějaký text.
       Zjistíme si tedy pro jednotlivé verze (v jednolivých dokumentech), jaká pasáž v nich odpovídá zadané, 
       tu převedeme na path_id a to nahrajeme...
      */

        B.sandglass.open(this._synopsis_manager.TxVw.module_container);

        var orig_position=position;
        position=this.normalize_position(position);
        if (only_on_index==-1)
        {//nahráváme všechny dokumenty
            var start_i=0;
            var end_i=this._documents_.length;
        }
        else
        {//nahráváme jenom jeden (třeba jsme vybrali jinou verzi k zobrazení)
            var start_i=only_on_index;
            var end_i=only_on_index+1;
        }
            
        for (var i=start_i;i<end_i;i++)
        {
            
            var path_id_to_load="";
            if (this._documents_[i]===triggering_document)
            {//nahrajeme prostě to, co je zadáno
                path_id_to_load=this.position_to_pid(orig_position);
            }
            else
            {//musíme zjistit, co odpovídá...
                var version=this._documents_[i].synopsis_controls.version_selected;
                if (version!=-1)
                {
                    this._documents_[i].bs.loading_finished=false;
                    var cs=this.get_corresponding_sections(position,version);
                    this._documents_[i].synopsis_correspondences=cs;//uložíme si seznam odpovídajících se verzí pro pozdější zarovnání
                    var cs_to_load=Array();//vybereme si z odpovídajícíh jenom ty, které budeme nahrávat (tj. verzi tohoto dokumentu)
                    var me=this;
                    if (Array.isArray(cs))
                       cs_to_load=cs.filter(function(value){if (me.bible_data.version_abbr_to_index(value.version)==me.bible_data.version_abbr_to_index(version)) return value});
                    else
                        cs_to_load.push(cs);
                    path_id_to_load=this.position_to_pid(cs_to_load);
                }
                
            }
            if (path_id_to_load!="")
            {
                this._documents_[i].bs.pos=orig_position;
                this._documents_[i].bs.version=version;
                this._documents_[i].load_document(path_id_to_load,"");
            }
            else
            {//v tomto sloupci nyní nic nenahráváme
                this._documents_[i].bs.loading_finished=true;
                this._documents_[i].close_document();
                if (version!=-1)
                {
                   this._documents_[i].show_info_banner("No corresponding section in this version.")
                }
            }
        }
    }
    position_to_pid=(position)=>
    {
        if (Array.isArray(position))
        {//pokud dostaneme pole odpovídajících sekcí, projdeme ho a navazjící sekce spojíme do jedné.
            for (var i=1;i<position.length;i++)
            {
                
                var one_verse_up=this.bible_data.position_add(position[i-1].to,{book:0,chapter:0,verse:1});
                if (one_verse_up.book==position[i].from.book && one_verse_up.chapter==position[i].from.chapter && one_verse_up.verse==position[i].from.verse)
                {//tato sekce přímo navazuje na předchozí. Sloučíme je tedy do jedné (tú původní nastavíme {to} na {to} té nové)
                    
                    position[i-1].to.book=position[i].to.book;
                    position[i-1].to.chapter=position[i].to.chapter;
                    position[i-1].to.verse=position[i].to.verse;
                    position.splice(i,1);
                    i--;
                }
                
            }
        }
        var point_pos_to_pid=function(pos,b)
        {
            if (pos.chapter<1 && pos.verse<1 || pos.chapter=="")
                return b.pid;
            else if (pos.chapter>=1)
                if (pos.verse<=1)
                    return b.pid+"."+pos.chapter;
                else
                    return b.pid+"."+pos.chapter+"^verse="+pos.verse;
        }
        var pid="";
        if (Array.isArray(position))
        {
            
            if (position.length==1)
        
            {//máme jeden záznam: buďto nahráváme nějaký neproblémový kus, nebo jsme to nahoře sloučili
                position[0].version=this.bible_data.version_abbr_to_index(position[0].version);
                var b1=this.bible_data.versions[position[0].version].get_book(position[0].from.book);
                var b2=this.bible_data.versions[position[0].version].get_book(position[0].to.book);
                if (b2==null || b1==null)//tento kus se v této verzi nenachází
                {
                    pid="";
                }
                else
                {
                    if (b1.id==b2.id && position[0].from.chapter==1 && position[0].from.verse==1 &&
                        position[0].to.chapter==b2.count && position[0].to.verse>=b2.chapters[b2.chapters.length-1].v)
                    {//pokud zadaná pozice obsahuje celou knihu, nebudeme se trápit s nějakými rozsahy a milestony
                        pid=b1.pid;
                    }
                    else if (b1.id==b2.id && position[0].from.chapter==position[0].to.chapter 
                        && position[0].from.verse==1 && position[0].to.verse>=b2.chapters[position[0].to.chapter-1].v)
                    {//chceme celou kapitolu
                        pid=b1.pid + "."+position[0].from.chapter;
                    }
                    else if (b1.id==b2.id && position[0].from.chapter==position[0].to.chapter 
                        && position[0].from.verse== position[0].to.verse)
                    {//chceme jeden verš
                        pid=b1.pid + "."+position[0].from.chapter+"^verse="+position[0].from.verse;
                    }
                    else if (b1.id != b2.id)
                    {//různé knihy
                        pid =point_pos_to_pid(position[0].from,b1)+"~"+point_pos_to_pid(position[0].to,b2);
                    }
                    else if (b1.id==b2.id && position[0].from.chapter!=position[0].to.chapter)
                    {//stejná kniha, ale různé kapitoly
                        pid =point_pos_to_pid(position[0].from,b1)+"~"+point_pos_to_pid(position[0].to,b2);
                    }
                    else if (b1.id==b2.id && position[0].from.chapter==position[0].to.chapter)
                    {//chceme část nějaké kapitoly
                        pid=point_pos_to_pid(position[0].from,b1)+"~"+point_pos_to_pid(position[0].to,b2);
                    }
                }
            }
        }
        else
        {
            if (position.from==undefined)
            {
                var b=this.bible_data.versions[position.version].get_book(position.book);
                pid=point_pos_to_pid(position,b);
            }
                
        }
        return pid;
    }

    normalize_position=(pos)=>
    {/* upravíme pozici tak,aby byla jednotná: aby vždy sestávala z from a to a v těch byly správné počty kapitol a veršů 
        tj. hlavně doplníme koncová čísla veršů a kapitol
        */
        var tmp=null;
        if (pos.from==undefined)
        {//to bude asi vždy tak
            var ch;
            var v;
            var to_ch;
            var to_v;
            var b=this.bible_data.versions[pos.version].get_book(pos.book);
            if (pos.chapter=="" || pos.chapter==0)
            {//chceme celou knihu:doplníme její rozsah
                ch=1;
                v=1
                to_ch=b.count;
                to_v=b.chapters[b.chapters.length-1].v;
            }
            else
            {//je zadána kapitola. 
                ch=pos.chapter;
                to_ch=ch;
                if (pos.verse=="" || pos.verse==0)
                {//není zadán žádný verš, tedy chceme celou kapitolu
                    v=1;
                    to_v=b.chapters[ch-1].v;
                }
                else
                {//je zadán konkrétní verš, tj. chceme jen tento jeden
                        v=pos.verse;
                        to_v=pos.verse;
                }
            }
            tmp={version:pos.version,from:
                                        {book:pos.book/*kniha musí být zadána vždy*/,chapter:ch,verse:v,version:pos.version},
                                    to:
                                        {book:pos.book/*kniha musí být zadána vždy*/,chapter:to_ch,verse:to_v,version:pos.version}};
        }
        return tmp;
    }
    
    get_corresponding_sections=(v1,v2)=>
    {/*
        zásadní funkce celé biblické synopse: zde se dozvíme, jaké sekce v řízené verzi odpovídají zadaným částem ve verzu řídící.
        */
       if (v1.from==undefined)
       {
           
       }
     
        v2=this.bible_data.version_index_to_abbr(v2);
        v1.version=this.bible_data.version_index_to_abbr(v1.version);
        const VMAX=10000;
        const me=this;
     
        
        var d=
        [
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:1,verse:1},to:{book:"Ps",chapter:8,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:1,verse:1},to:{book:"Ps",chapter:8,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:9,verse:1},to:{book:"Ps",chapter:9,verse:21}},
                {version:"H",from:{book:"Ps",chapter:9,verse:1},to:{book:"Ps",chapter:9,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:9,verse:22},to:{book:"Ps",chapter:9,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:10,verse:1},to:{book:"Ps",chapter:10,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:10,verse:1},to:{book:"Ps",chapter:112,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:11,verse:1},to:{book:"Ps",chapter:113,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:113,verse:1},to:{book:"Ps",chapter:113,verse:8}},
                {version:"H",from:{book:"Ps",chapter:114,verse:1},to:{book:"Ps",chapter:114,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:113,verse:9},to:{book:"Ps",chapter:113,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:115,verse:1},to:{book:"Ps",chapter:115,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:114,verse:1},to:{book:"Ps",chapter:114,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:116,verse:1},to:{book:"Ps",chapter:116,verse:9}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:115,verse:1},to:{book:"Ps",chapter:115,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:116,verse:10},to:{book:"Ps",chapter:116,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:116,verse:1},to:{book:"Ps",chapter:145,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:117,verse:1},to:{book:"Ps",chapter:146,verse:VMAX}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:146,verse:1},to:{book:"Ps",chapter:146,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:147,verse:1},to:{book:"Ps",chapter:147,verse:11}}
            ],
            [
                {version:"V,S,Dr",from:{book:"Ps",chapter:147,verse:1},to:{book:"Ps",chapter:147,verse:VMAX}},
                {version:"H",from:{book:"Ps",chapter:147,verse:12},to:{book:"Ps",chapter:147,verse:VMAX}}
            ],
            [
                {version:"S,V,H,Dr",from:{book:"Ps",chapter:148,verse:1},to:{book:"Ps",chapter:150,verse:VMAX}}
            ],
            [
                {version:"S",from:{book:"Ps",chapter:151,verse:1},to:{book:"Ps",chapter:151,verse:VMAX}}
            ],
            [
                {version:"S",from:{book:"Neh",chapter:1,verse:1},to:{book:"Neh",chapter:10,verse:VMAX}},
                {version:"V,Dr",from:{book:"Esd",chapter:1,verse:1},to:{book:"Esd",chapter:10,verse:VMAX}}
            ],
            [
                {version:"S",from:{book:"Neh",chapter:11,verse:1},to:{book:"Neh",chapter:23,verse:VMAX}},
                {version:"V,Dr",from:{book:"Neh",chapter:1,verse:1},to:{book:"Neh",chapter:13,verse:VMAX}}
            ]
        ];
        
        var find_in_discrepancies=function(pos,version2)
        {
            
            var rv=Array();
            for (var i=0;i<d.length;i++)
            {
                for (var j=0;j<d[i].length;j++)
                {
                    var e=d[i][j];
                    if (e.version.indexOf(pos.version)!=-1)
                    {//týká se to naší verze
                        if (pos.from.book==e.from.book)
                        {
                            if ((pos.from.chapter>=e.from.chapter && pos.from.chapter<=e.to.chapter &&
                            pos.from.verse>=e.from.verse && pos.from.verse<e.to.verse) || /*začátek chtěné pozice leží v této disk. */
                            (pos.to.chapter<=e.to.chapter && pos.to.chapter>=e.from.chapter &&
                            pos.to.verse<=e.to.verse && pos.to.verse>=e.from.verse) || /*nebo v ní leží konec pozice */
                            (pos.from.chapter<=e.from.chapter && pos.to.chapter>=e.to.chapter)) //nebo celá disk. leží v pozici
                            {//naše chtěná pozice zasahuje do této diskrepance
                                for (var k=0;k<d[i].length;k++)
                                {
                                    if (d[i][k].version.indexOf(version2)!=-1)
                                    {
                                        /**
                                         * našli jsme tedy jaké rozdílné sekce se týkají našeho požadovaného místa. Teď ještě musíme vypočítat 
                                         * správnou hodnotu v cílové verzi. Tedy když jsou např. žalmy od V,S 10 posunuty o 1 vůči H (tj. V10=H11), a my chceme
                                         * třeba žalm V45, musíme zajistit, že nahrajeme žalm H46. 
                                         * Toto posunutí se týká sekcí, ve kterých naše požadovaná pozice začíná, nebo končí. Nebo oboje.
                                         * Pokud jde ale přes celou sekci, budeme ji stejně nahrávat celou, posuny se budou řešit jinde.
                                         * V zásadě jde o to, že sekce, které nemají být nahrávány celé, nechceme nahrávat celé.
                                         */

                                            var shift={from:{book:0,chapter:0,verse:0},to:{book:0,chapter:0,verse:0}};
                                            var real={from:{book:e.from.book,chapter:e.from.chapter,verse:e.from.verse},
                                                to:{book:e.to.book,chapter:e.to.chapter,verse:e.to.verse}};
                                                /*zde bude buďto celá sekce, pokud do ní nezasahuje začátek či konec pozice,
                                                příp. se začátek/konec nastaví na požadovanou hodnotu. A oproti tomuto 
                                                skutečnému rozahu sekce, který chceme, se poté posune i výsledek pro řídící sekci
                                                */
                                            var shift_ch=e.from.chapter-d[i][k].from.chapter;//posunutí řídící a řízené verze
                                            var shift_v=e.from.verse-d[i][k].from.verse;
                                            if ((pos.from.chapter>=e.from.chapter) 
                                                && (pos.from.verse>=e.from.verse))
                                            {/*zamýšlená pozice začíná v této sekci, tedy musíme začátek posunout
                                              *tj. např. chceme žal V45. Pozice tedy začíná (i končí) uvnitř sekce 
                                              V10-112. Tedy musíme začátek sekce posunout na 45 (a pomocí posunutí na 46 v H, chceme-li H)
                                              */
                                                real.from.chapter=pos.from.chapter;
                                                real.from.verse=pos.from.verse;       
                                            }
                                            if ((pos.to.chapter<=e.to.chapter) 
                                            && (pos.to.verse<=e.to.verse || e.to.verse==VMAX))
                                            {///zamýšlená pozice končí v této sekci, tedy musíme posunout konec
                                                real.to.chapter=pos.to.chapter;
                                                real.to.verse=pos.to.verse;
                                            }
                                            
                                            //v řídící verzi se nic neposouvá
                                            rv.push({version:pos.version,
                                                from:{version:pos.version,book:real.from.book,chapter:real.from.chapter,verse:real.from.verse},
                                                to:{version:pos.version,book:real.to.book,chapter:real.to.chapter,verse:real.to.verse}});
                                            
                                            //a pak v řízení
                                            rv.push({version:version2,
                                                from:{version:version2,book:d[i][k].from.book,
                                                    chapter:Number(real.from.chapter)-Number(shift_ch),verse:Number(real.from.verse)-Number(shift_v)},
                                                to:{version:version2,book:d[i][k].to.book,
                                                    chapter:Number(real.to.chapter)-Number(shift_ch),verse:Number(real.to.verse)-Number(shift_v)}});
                                        
                                       
                                    }

                                }
                            }

                        }
               
                    }
                }
            }
            return rv;
        }
      
        var v2_pos=Array();
        var correspondent=find_in_discrepancies(v1,v2);

        

        if (correspondent.length>0)
        {
            v2_pos=correspondent;
        }
        else
        {/*pokud jsme nenašli v tabulce rozdílů pro zadanou pozici nic, znamená to buď, že si pasáže odpovídají, 
            anebo se naopak v porovnávané verzi vůbec nenachází. V takovém případě nám server nic nevrátí, to nemá cenu 
            víc ověřovat tady.
           */
           v2_pos=[{version:v2,from:{book:v1.from.book,chapter:v1.from.chapter,verse:v1.from.verse},
                                to:{book:v1.to.book,chapter:v1.to.chapter,verse:v1.to.verse}}];
        }
        for (var i=0;i<v2_pos.length;i++)
        {
            if (v2_pos[i].from==undefined)
                v2_pos[i].version=this.bible_data.version_abbr_to_index(v2);
            else
            {
                v2_pos[i].from.version=this.bible_data.version_abbr_to_index(v2);
                v2_pos[i].to.version=this.bible_data.version_abbr_to_index(v2);
            }
        }
        
        return v2_pos;
        
    }

    create_control_bar=(d)=>
    {
        
        d.synopsis_controls=
        {
            _container:d.address_bar,
            sel_versions:null,
            sel_books:null,
            txt_chapter:null,
            txt_verse:null,
            cmd_go:null,
            
            version_selected:-1,
            book_selected:-1,
            chapter_selected:-1,
            verse_selected:-1,
            
            show_hide_controls(show)
            {
                if (show==true && this.sel_books!=null)
                {
                    this.sel_versions.classList.remove("width_50p");
                    this.sel_versions.classList.add("width_25p");
                    this.sel_books.classList.remove("display_none");
                    this.txt_chapter.classList.remove("display_none");
                    //this.txt_verse.classList.remove("display_none");
                    this.cmd_make_leading.classList.add("display_none");
                    this.cmd_close.classList.add("display_none");

                }
                else if (show==false && this.sel_books!=null)
                {
                    this.sel_versions.classList.remove("width_25p");
                    this.sel_versions.classList.add("width_50p");
                    this.sel_books.classList.add("display_none");
                    this.txt_chapter.classList.add("display_none");
                    this.txt_verse.classList.add("display_none");
                    //this.cmd_make_leading.classList.remove("display_none");
                    this.cmd_close.classList.remove("display_none");
                }
            },
            on_version_selected(e)
            {//this=document
                var index=e.target.value;//0=výzva k vybrání verze!
                if (index>=0)
                {
                    var o;
                    this.synopsis_controls.sel_books.innerHTML="";
                    o=create_element("option","",this.synopsis_controls.sel_books,"---select a book---");
                    o.value="-1";
                    for (var i=0;i<this.synopsis.bible_data.versions[index].books.length;i++)
                    {
                        o=create_element("option","",this.synopsis_controls.sel_books,this.synopsis.bible_data.versions[index].books[i].name);
                        o.value=i;
                    }
                    this.synopsis.version_selected(d,index);
                    this.synopsis_controls.version_selected=index;
                }
                
            },
            on_book_selected(e)
            {//this=document
                var v_index=this.synopsis_controls.sel_versions.value;
                var index=e.target.value;//0=výzva k vybrání knihy!
                if (index>=0)
                {
                    this.synopsis_controls.txt_chapter.value="";
                    this.synopsis_controls.txt_chapter.placeholder="1-"+this.synopsis.bible_data.versions[v_index].books[index].count;
                }
                this.synopsis_controls.book_selected=index;
            },
            on_go_clicked(e)
            {//this=document
                var leading_doc=this.synopsis.leading_doc;
                    
                var v_index=leading_doc.synopsis_controls.sel_versions.value;
                var b_index=leading_doc.synopsis_controls.sel_books.value;
                var ch=leading_doc.synopsis_controls.txt_chapter.value;
                var v=leading_doc.synopsis_controls.txt_verse.value;
                if (v_index>-1 && b_index>-1)
                {
                    var pos=
                    {
                        version:v_index,
                        book:leading_doc.synopsis.bible_data.versions[v_index].books[b_index].id,
                        chapter:ch,
                        verse:v
                    };
                    leading_doc.synopsis.load_text(leading_doc,pos);
                }
            },
            on_make_leading_clicked(e)
            {//this=document
                this.synopsis.leading_doc_changed(this);
            },
            on_close_document_clicked(e)
            {
                for (var i=0;i<this.synopsis._documents_.length;i++)
                {
                    if (this.synopsis._documents_[i]===this)
                    {
                        this.synopsis._documents_.splice(i,1);
                    }
                }
                for (var i=0;i<this.synopsis._synopsis_manager.TxVw.documents.length;i++)
                {
                    if (this.synopsis._synopsis_manager.TxVw.documents[i]===this)
                    {
                        this.synopsis._synopsis_manager.TxVw.documents.splice(i,1);
                    }
                }
                this.remove();
                this.synopsis.align();
            }
        };
        var o=null;
        d.synopsis_controls.sel_versions=create_element("select","selectbox width_25p height_25",d.address_bar);
        o=create_element("option","",d.synopsis_controls.sel_versions,"---select a version---");
        o.value="-1";
        for (var i=0;i<this.bible_data.versions.length;i++)
        {
            o=create_element("option","",d.synopsis_controls.sel_versions,this.bible_data.versions[i].short_name);
            o.value=i;
        }
        d.synopsis_controls.sel_versions.onchange=d.synopsis_controls.on_version_selected.bind(d);
        
        d.synopsis_controls.sel_books=create_element("select","selectbox width_25p height_25",d.address_bar);
        var o=create_element("option","",d.synopsis_controls.sel_books,"---select a book---");
        o.value="-1";
        
        d.synopsis_controls.sel_books.onchange=d.synopsis_controls.on_book_selected.bind(d);
        
        d.synopsis_controls.txt_chapter=textbox("small width_15p",d.address_bar);
        d.synopsis_controls.txt_verse=textbox("display_none small width_15p",d.address_bar);
        
        d.synopsis_controls.cmd_go=cmd("l_margin_20 r_margin_20",d.address_bar,"load");
        d.synopsis_controls.cmd_go.onclick=d.synopsis_controls.on_go_clicked.bind(d);

        var d2=div("inline_block l_margin_10",d.address_bar,"");
        d.synopsis_controls.cmd_make_leading=cmd("display_none",d2," * ");
        d.synopsis_controls.cmd_make_leading.onclick=d.synopsis_controls.on_make_leading_clicked.bind(d);
        d.synopsis_controls.cmd_make_leading.title="Make this column the leading document"

        d.synopsis_controls.cmd_close=cmd("",d2," x ");
        d.synopsis_controls.cmd_close.onclick=d.synopsis_controls.on_close_document_clicked.bind(d);
        d.synopsis_controls.cmd_close.title="Close this column"
        
        this.leading_doc_changed(this.leading_doc);//abychom vypnuli příslušné ovl. prvky
    }
    
    close_document=(e)=>
    {

    }
    leading_doc_changed=(new_leading_doc)=>
    {
        this.leading_doc=new_leading_doc;
        for (var i=0;i<this._documents_.length;i++)
        {
            this._documents_[i].synopsis_controls.show_hide_controls(this._documents_[i]===new_leading_doc);
        }
    }
    document_scrolled=(d)=>
    {//při skrolování jednoho sloupce posuneme i ostatní
        
        for (var i=0;i<this._documents_.length;i++)
        {
            if (!(this._documents_[i]===d) && d.bs.lock_scrolling==true)
            {
                if (this._documents_[i].bs.lock_scrolling==true)//pokud to pro konkrétní sloupec není vypnuto
                    this._documents_[i].obj_scrolling.scroll_to(d.obj_scrolling.scroll_top);
                
            }
            var top=this._documents_[i].text_section.text_container.scrollTop/
                this._documents_[i].text_section.pages[0].text_body.offsetHeight
                *100;
            var dsl=this._documents_[i].bs.div_scroll_lock;
            /*použitelná výška section_containeru (tj. toho prvku, ve kterém se skroluje) je menší o výšku div_scroll_lock. 
            (kdybychom využívali celých 100%, zajížděl by na konci "pod" okraj prvku). Spočítáme tedy, kolik procent je použitelných 
            (tj. po odečtení výšky tlačítka) a s tou pak budeme pracovat. Max tedy bude třeba 97% namísto 100%, ale min pořád 0%
            */
            top*=(1-(dsl.offsetHeight/this._documents_[i].text_section.section_container.offsetHeight));
            if (dsl!=null)
            {
                dsl.style.top=top+"%";
            }
        }
    }
    next_position=(plusminus=1)=>
    {
        if (this.leading_doc!=null)
        {
            var add_v=0;
            var add_ch=0;
            var add_b=0;
            var p=this.leading_doc.bs.pos;
            if (p.verse!=0 && p.verse!="")
                add_v=plusminus;
            else if (p.chapter!=0 && p.chapter!="")
                add_ch=plusminus;
            else
                add_b=plusminus;
                
            return this.bible_data.position_add(p,{book:add_b,chapter:add_ch,verse:add_v});
        }
    }
    previous_position=()=>
    {
        return this.next_position(-1);
    }


} 
