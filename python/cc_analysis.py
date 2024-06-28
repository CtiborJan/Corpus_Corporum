import sys,os,re,subprocess,cc,datetime
    

class cls_work:
    def __init__(this,path,explicitly_ask_for_context=False):
        this.context=cc.cls_context(path,explicitly_ask_for_context)
        log_file_path=os.path.join(this.context.folder,"log_preparation.txt")
        this.log_file=open(log_file_path,"a")
        this.log_file.writelines(["\n################################\nStarting new analysis, "+str(datetime.datetime.now())+"\n"])
        
    def run_bx(this,opt):
        cmd="/opt/basex/bin/basex -b options=\""+opt+"\"  /opt/basex/webapp/CC_admin/make_pre-analysis.xq"
        print("Running command:\n"+cc.f.YELLOW+cmd+cc.f.END)
        rv=os.system(cmd)
        if rv==0:
            print(" \nExit code: "+cc.f.GREEN+cc.f.BOLD+str(rv)+ " (success)"+cc.f.END+"\n")
            this.log_file.writelines("ok: "+this.context.path)
        else:
            print(" \nExit code: "+cc.f.RED+cc.f.BOLD+str(rv)+ " (probably an error occured, see the output above)"+cc.f.END+"\n")
            this.log_file.writelines(["####","ERROR (return value: "+rv+"): "+this.context.path,"####"])
        return rv
    
    def opt(this,*opt):
        rv=""
        for o in opt:
            rv+="<"+o[0]+">"+o[1]+"</"+o[0]+">\n"
        return "<opt xmlns='http://mlat.uzh.ch/2.0'>"+rv+"</opt>"
    
    
    
    def work(this):
        analyse_abbr=cc.prompt("Do you want to analyze possible abbreviations as well? This can be a very time-consuming, especially for large files.",[["y","Yes"],["n","No"],["C","Change working context"]])
        if analyse_abbr=="C":
            return 0
        elif analyse_abbr=="y":
            analyse_abbr=True
        else:
            analyse_abbr=False
        n=0
        err=0
        print(cc.f.GREEN+"\nWorking with " + this.context.path+" >>> >>> >>>" +cc.f.END)
        if this.context.type=="--folder--":
            log_file_path=os.path.join(this.context.folder,"log_preanalysis.txt")
            log_file=open(log_file_path,"a")
            this.log_file.writelines(["","################################","Starting new analysis, "+str(datetime.datetime.now())])
            log_file.close()
            i=0
            for file_path in os.listdir(this.context.path):
                if re.search("\.xml$",file_path) and re.search(cc.rgx_files_to_exclude,file_path)==None:
                    i+=1
                    file_path=this.context.path+file_path
                    print (cc.f.BOLD+cc.f.PURPLE+str(i)+" (of "+str(this.context.folder_has_xml_files)+"): "+file_path+" >>> >>>"+cc.f.END)
                    opt=this.opt(["file",file_path],["error_log_file",log_file_path],["step","pre-analysis"],["analyse_abbreviations",str(analyse_abbr)])
                    rv=this.run_bx(opt)
                    if rv!=0: err+=1
                    else: n+=1
                    print (cc.f.BOLD+cc.f.PURPLE+"<<< <<< "+file_path+cc.f.END)
                else:
                    print (file_path,"(skipping)")
        else:
            opt=this.opt(["file",this.context.path],["step","pre-analysis"],["analyse_abbreviations",str(analyse_abbr)])   
            this.run_bx(opt)
            n+=1
            
        print ("Analysed file(s): " +str(n) +"\nErrors: " + str(err))
        print(cc.f.GREEN+"Working with " + this.context.path+" <<< <<< <<<" +cc.f.END)
        what_now=cc.prompt("What now?",[["C","Open new context"],["exit","End the program"]])
        if what_now=="exit":
            sys.exit()
        else:
            return what_now
            
        
        
        
    


if len(sys.argv)>=2:
    folder=sys.argv[1]
if len(sys.argv)>=3:
    fname=sys.argv[2]
    
path=folder+"/"+fname

explicitly_ask_for_context=False
while True:
    os.system("clear")
    print("\nCorpus corporum XML files pre-preparation analysis")
    print("##################################################")
    work=cls_work(path,explicitly_ask_for_context)
    rv=work.work()
    path=work.context.path
    explicitly_ask_for_context=True #after one working cycle we will automatically ask for context
    print ("")
    
