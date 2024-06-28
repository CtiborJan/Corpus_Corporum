var image_viewer=true;
class cls_image_viewer extends cls_mod
{
    constructor(parent_slot,mode=0)
    {//mode=0: jednoduché vyhledávání; 1: rozšířené
        super(parent_slot);
        this.taskbar_text="I";
        this.taskbar_color="black";
        this.taskbar_bckg_color="lightblue";
        this.parent_slot=parent_slot;
        this.module_name="Image viewer";
        this.module_description="Displays images.";
        this.parent_slot=parent_slot;
        this.my_index=this.parent_slot.add_module(this)-1;
        this.image_width=0;
        this.image_height=0;
        document.addEventListener("show_image_request",this.showing_image_requested);
        
    }
    destroy()
    {
        super.destroy();
        document.removeEventListener("show_image_request",this.showing_image_requested);
    }
    showing_image_requested=(e)=>
    {
        e.stopPropagation();
        this.show_image(e.detail.img_html_container);
        this.parent_slot.activate_module(this.my_index);
    }
    show_image(img_container)
    {
        this.module_container.innerHTML="";
        var img=this.create_one_image_container(img_container);
        this.module_container.appendChild(img);
    }
    create_one_image_container(HTML_img_container)
    {
        var url=HTML_img_container.getElementsByTagName("img")[0].dataset["img_url"];
        url=url+"&full_size=true";
        
        var heading=HTML_img_container.getElementsByClassName("img_head")[0].textContent;
        var description=HTML_img_container.getElementsByClassName("img_desc")[0].textContent;
        
        var container=document.createElement("div");
        
        this.img_div=document.createElement("div");
        var meta_div=document.createElement("div");
        var control_div=document.createElement("div");
        control_div.classList.add("mod_ImgVw_controls")
        
        var btn_100p=document.createElement("info_btn");
        var btn_fit=document.createElement("info_btn");
        var plus=document.createElement("info_btn");
        var minus=document.createElement("info_btn");
        btn_100p.innerHTML="original size";
        btn_100p.addEventListener("click",this.full_size);
        btn_fit.innerHTML="fit window";
        btn_fit.addEventListener("click",this.fit_image);
        plus.innerHTML="&nbsp;+&nbsp;"
        plus.addEventListener("click",this.one_step_bigger);
        minus.innerHTML="&nbsp;-&nbsp;"
        minus.addEventListener("click",this.one_step_smaller);

        control_div.appendChild(btn_100p);
        control_div.appendChild(btn_fit);
        control_div.appendChild(plus);
        control_div.appendChild(minus);
        
        this.img=document.createElement("img");
        
        this.img.src=url;
        this.file_name=url.match(/.*\/([^/]*)/)[1];
        this.image_width=this.img.width;
        this.image_height=this.img.height;
                
        meta_div.classList.add("mod_ImgVw_meta_div");
        this.img_div.classList.add("mod_ImgVw_img_div");
        container.classList.add("mod_ImgVw_one_image_container");
        
        this.img_div.appendChild(this.img);
        
        meta_div.innerHTML="<strong>"+heading+"</strong><br/>"+description+"<br/><span class='mod_ImgVw_img_metadata'>"+this.file_name+": "+this.image_width+" x "+this.image_height+" px</span>";
        
        meta_div.appendChild(control_div);
        
        container.appendChild(meta_div);
        container.appendChild(this.img_div);
        return container;
    }
    full_size=(e)=>
    {
        this.img.style.width=this.image_width+"px";
        this.img.style.height=this.image_height+"px";
    }
    fit_image=(e)=>
    {
        var w_ratio=this.img_div.clientWidth/this.image_width;
        var h_ratio=this.img_div.clientHeight/this.image_height;
        var whr=this.image_width/this.image_height;
        if (w_ratio<h_ratio)
        {
            whr=this.image_height/this.image_width;
            this.img.style.width=this.img_div.clientWidth+"px";
            this.img.style.height=(this.img_div.clientWidth*whr)+"px";
        }
        else
        {
            this.img.style.height=this.img_div.clientHeight+"px";
            this.img.style.width=(this.img_div.clientHeight*whr)+"px";
        }
    }
    one_step_bigger=(e)=>
    {
        this.img.style.width=this.img.clientWidth*1.05+"px";
        this.img.style.height=this.img.clientHeight*1.05+"px";
    }
    one_step_smaller=(e)=>
    {
        this.img.style.width=this.img.clientWidth*0.95+"px";
        this.img.style.height=this.img.clientHeight*0.95+"px";
    }
}
