<?php header("Content-type: application/x-javascript"); ?>
var mod_home=true;
class cls_banner_carousel
{
    constructor(parent,w=0,h=0)
    {
        if (w==0)
            this.carousel=div("width_100p v_margin_10 relative",parent);
        
       
        this.transitional=create_element("img","absolute width_100p carousel_transitional",this.carousel);
        this.transitional.style.left="0px";
        this.transitional.style.top="0px";
        
        this.banner=create_element("img","width_100p",this.carousel);
        
        this.bar=div("absolute width_100p height_100",this.carousel);
        this.bar.style.zIndex="10";
        this.bar.style.backgroundColor="rgba(255,255,255,0.8)";
        this.bar.style.bottom="0px";
        this.bar_title=div("font_166p bold h_padding_5",this.bar);
        
        this.bar_title.style.color="var(--highlight2)";
        this.bar_title.style.margin="auto";
        this.bar_description=div("padding_5",this.bar);
        
        this.banners=Array();
        
        this.ac_slide_index=0;
        this.transition_status=0;
    }
    
    add_banner(image_src,title,description,position=-1)
    {
        var b=create_element("img","display_none",this.carousel);
        b.src=image_src;
        var b_obj={img:b,title:title,description:description}
        this.banners.push(b_obj);
    }
    
    start_slideshow(index=0,interval=8000)
    {
        this.slide(index);
        window.setInterval(this.interval_ellapsed,interval);
    }
    slide(index=-1)
    {
        if (index=-1)
            index=this.ac_slide_index+1;
        if (index>=this.banners.length)
            index=0;
        
        this.transitional.src=this.banners[this.ac_slide_index].img.src;
        this.transitional.style.zIndex="2";
        
        
        this.ac_slide_index=index;
        
        this.banner.src=this.banners[index].img.src;
        this.start_transition();
        
        this.bar_title.innerHTML=this.banners[index].title;
        this.bar_description.innerHTML=this.banners[index].description;
    }
    interval_ellapsed=(e)=>
    {
        this.slide();
    }
    start_transition()
    {
        this.transition_status=1;
        this.transitional.style.opacity="1";
        window.setTimeout(this.transition,10);
    }
    transition=(e)=>
    {
        this.transition_status-=0.01;
        if (this.transition_status>=0)
        {
            this.transitional.style.opacity=this.transition_status;
            window.setTimeout(this.transition,10);
        }
        
    }
}
class  cls_mod_home extends cls_mod
{
    
    constructor(parent_slot)
    {
        super(parent_slot);
        
        var about=`<?php include "var/homepage_main_text.html"?>`;
        
        this.display_only_my_slot=true;
        this.taskbar_text="H";
        this.taskbar_color="black";
        this.taskbar_bckg_color=taskbar_btn_color;
        this.module_name="Home";
        this.module_dscription="Homepage of Corpus Corporum";
        this.label="";
        this.img_strip=div("flex margin_auto",this.module_container);
        
        this.img_cc_c=div("CC_imgx width_66p height_m_200",this.img_strip);
        var CC_img=create_element("img","width_100p height_m_200 object-fit_contain",this.img_cc_c);
        CC_img.src="cc_modules/CC.png";
        //this.img_cc=("CC_img width_100p",this.img_cc_c);
        this.img_uzh_c=div("width_34p",this.img_strip);
        //this.img_uzh_c.style.backgroundColor="var(--background9)";
        var UZH_container=div("margin_auto absolute",this.img_uzh_c);
        UZH_container.style.maxWidth="300px";
        UZH_container.style.right="0px";
        var UZH_img=create_element("img","width_100p height_m_200 object-fit_contain width_m_100p",UZH_container);
        UZH_img.src="cc_modules/uzh_logo.png";
        
        this.mp=div("margin_20",this.module_container);
        
       
        
        this.flex_container=div("flex_row width_100p",this.mp);
        
        
        this.about=div("flex_grow_3 width_66p margin_10",this.flex_container);
        
        this.lbl_welcome=div("font_120p b_margin_20 text_align_center",this.about,"Welcome to the Corpus Corporum project, repository of Latin texts.<br/>");
        this.btn_cont=div("flex_row margin_auto relative v_padding_5",this.about);
        this.btn_cont.style.width="max-content";
        this.btn_start_browsing=button("font_166p",this.btn_cont," &nbsp; Browse the database &nbsp; ",true,this.btn_start_browsing_clicked);
        span("h_padding_5",this.btn_cont)
        this.btn_dictionary_module=button("font_166p",this.btn_cont," &nbsp; Open the dictionaries &nbsp; ",true, this.btn_open_dictionaries_clicked);
        this.btn_cont=div("flex_row margin_auto relative v_padding_5",this.about);
        this.btn_cont.style.width="max-content";
        this.btn_synopsis_module=button("font_166p",this.btn_cont," &nbsp; Open synoptic Bible &nbsp; ",true, this.btn_open_biblical_synopsis_clicked);;
        
        
       /* this.carousel=div("width_100p v_margin_10 relative",this.about);
       
        this.carousel=new cls_banner_carousel(this.about);
        this.carousel.add_banner("cc_modules/patrologia.jpg","Corpus 2: Patrologia Latina","Complete Minge's Patrologia Latina containing more than 5000 works and 90'000'000 words.");
        this.carousel.add_banner("cc_modules/mirabile.jpg","Corpus 24: Mirabile","Texts we have from Mirabile.");
        this.carousel.start_slideshow();*/
        
        create_element("h2","",this.about,"About the <em>Corpus Corporum</em> project");
        div("b_margin_10",this.about, about)
        
        div("t_margin_30 font_75p",this.about,"Please report bugs to turicense AT gmail.com");
        
        var right_column=div("flex_grow_1 width_34p padding_10",this.flex_container);
        this.news=div("",right_column);
        create_element("h2","",this.news,"What's new?");
        <?php 
            $sxml=simplexml_load_file("var/news.xml");
            foreach ($sxml->children() as $news)
            {
                echo "div('b_margin_10',this.news, '<strong>".$news->date->__toString().":</strong> ".$news->html->asXML()."');"."\n";
            }
        ?>
        this.new_texts=div("",right_column);
        create_element("h2","",this.news,"Recently added texts");
        var a;
        <?php 
            $sxml=simplexml_load_file("var/new_texts.xml");
            $max=$sxml->attributes()->max_show;
            if ($max==null)
                $max=0;
            $i=1;
            foreach ($sxml->children() as $new_text)
            {
                if ($new_text->author->__toString()!="")
                    $author=' ('.$new_text->author->asXML().')';
                echo 'div("b_margin_10",this.new_texts, "<strong>'.$new_text->date->__toString().'</strong>'.($new_text->date->__toString()!=""?'<br/>':''). '<a href='."'".'https://mlat.uzh.ch/browser?path=/'.$new_text->cc_idno->__toString()."'".'><u>'.$new_text->name->asXML(). $author.'</u></a>");'."\n";
                $i++;
                if ($i>$max && $max!=0)
                    break;
            }
        ?>
        
       
        
        
        
        this.my_index=this.parent_slot.add_module(this)-1;
        //this.parent_slot.set_label("Browsing the database");
    }
    btn_about_click=(e)=>
    {
        if (!(kb_click(e))) return false;
        window.open("about.html","_blank");
    }
    btn_start_browsing_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        window.location.href="browser"
    }
    btn_open_dictionaries_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        window.location.href="dictionaries"
    }
    btn_open_biblical_synopsis_clicked=(e)=>
    {
        if (!(kb_click(e))) return false;
        window.location.href="bible"
    }
}
