import sys,os,re,subprocess,cc,time, multiprocessing,datetime
from threading import Thread

class cls_work:
    def __init__(this,path,args,explicitly_ask_for_context=False):
        this.context=cc.cls_context(path,explicitly_ask_for_context)
        this.cli_args=args

        if "stdin" in this.cli_args.keys(): #ie. read list of files from stdin (eg. from egrep result)
            this.filelist=sys.stdin.readlines()
            sys.stdin.close()
            sys.stdin = open('/dev/tty')
            this.stdin=True
        else:
            this.stdin=False

        this.log=[]

        
    def run_bx(this,opt,script):
        cmd="/opt/basex/bin/basex -b options=\""+opt+"\"  /opt/basex/webapp/CC_admin/"+script
        info="Running command:\n"+cc.f.YELLOW+cmd+cc.f.END
        print(info)
        n_lines=len(info.splitlines())
        #rv=os.system(cmd)
        proc=subprocess.Popen(["/opt/basex/bin/basex", "-b options="+opt, "/opt/basex/webapp/CC_admin/"+script],stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        (out, err) = proc.communicate()
        
        for i in range(n_lines):
            cc.line_up()
        
        if err=="":
            output=cc.f.GREEN+cc.f.BOLD+str(out)+ " ... OK"+cc.f.END
            print("    "+output)
            this.log.append([0,output])
            return 0
        else:
            output=cc.f.RED+cc.f.BOLD+str(out)+ " ... ERROR: "+err +cc.f.END
            print("    "+output)
            this.log.append([err,output])
            return err
        
    
    def opt(this,*opt):
        rv=""
        for o in opt:
            rv+="<"+o[0]+">"+o[1]+"</"+o[0]+">\n"
        return "<opt xmlns='http://mlat.uzh.ch/2.0'>"+rv+"</opt>"
    
    
    
    def work(this):
        base_path=this.context.path.replace("/prep/","/")


        if "list-unprocessed" in this.cli_args.keys() or "lu" in this.cli_args.keys():
            this.context.find_missing(base_path,"loaded",True)
            os.exit()

        n=0
        err=0
        
        insert=False
        insert_only=False
        insert_one_by_one=False
        insert_existing=False
        make_loadable=False

        if "make-loadable" in this.cli_args.keys() or "l" in this.cli_args.keys():
            make_loadable=True
        if "insert" in this.cli_args.keys() or "i" in this.cli_args.keys():
            insert=True

        """if "insert_only" in this.cli_args.keys() or "io" in this.cli_args.keys() :
            insert_only=True
            insert_existing=True
            insert=True
        if "insert_one_by_one" in this.cli_args.keys() or "io" in this.cli_args.keys():
            insert_one_by_one=True
            insert_only=True
            insert=True
            print ("Inserting only already existing loadable files one at a time.") """
        
        if "insert_existing" in this.cli_args.keys() or "insert-existing" in this.cli_args.keys() or "ie" in this.cli_args.keys():
            insert_existing=True
            insert=True
        
        if make_loadable==True and insert_existing==True:
            print(cc.f.RED+"Invalid options: -ie and -l cannot go together")


        print(cc.f.GREEN+"\nWorking with " + this.context.path+" >>> >>> >>>" +cc.f.END)
        loaded_path=""

        #############x
        #this.context.type="--file--"
        #filelist=["/var/www/html/data/Corpus28_Acta_Sanctorum/03.3.xml"]
        #this.context.path="/var/www/html/data/Corpus28_Acta_Sanctorum/03.3.xml"
        #############

        files=[]
        if this.context.type=="--folder--":
            if this.stdin==False:
                if "u" in this.cli_args.keys() or "unprocessed" in this.cli_args.keys():
                    #rv=this.explore_folder(this.context.path)
                    filelist=this.context.find_missing("","loaded",False,True)
                    
                    print("You are about to work with unprocessed files a folder. This folder contains "+str(len(filelist))+" unprocessed files (*.xml).")
                else:
                    filelist=os.listdir(this.context.path)
            else:
                filelist=this.filelist  
                print("You are about to work with a specified list of files ("+str(len(filelist))+")")
                      
            
            
            for f in filelist:

                if f.startswith("/")==False:
                    f=os.path.join(this.context.path,f.strip())        
                if make_loadable==True:
                    f=this.context.get_state_path(f,"prep")
                elif insert_existing==True:
                    f=this.context.get_state_path(f,"loaded")
                files.append(f)
                

            loaded_path=this.context.path.replace("/prep/","/loaded/")
            base_path=this.context.path.replace("/prep/","/")

            folder_path=this.context.path
        else:
            folder_path=os.path.dirname(this.context.path)
            if make_loadable==True:
                files=[this.context.get_state_path(this.context.path,"prep")]
            elif insert_existing==True:
                files=[this.context.get_state_path(this.context.path,"loaded")]

            

        log_file_path=os.path.join(folder_path,"log_loading.txt")
        log_file=open(log_file_path,"w")
        log_file.close()
            
        """print (filelist)"""

        

        if insert_existing==True and this.context.type=="--folder--":
            opt=this.opt(["folder",loaded_path])
            this.run_bx(opt,"insert_loaded_files.xq")

        else:
            
            i=0
            n=len(files)
            for file_path in files:
                
                

                if os.path.split(file_path)[1].startswith("_dbg_")==False:
                
                    i+=1                  
                    
                    loaded_file_path=file_path.replace("/prep/","/loaded/")
                    loaded_file_path=loaded_file_path.replace(".prep.",".loaded.")
                    
                    process=True
                    #print(loaded_file_path)
                    if os.path.exists(loaded_file_path) and re.search("\.prep\.xml$",file_path):
                        if "skip_loaded" in this.cli_args.keys() or "skip_existing" in this.cli_args.keys() or "s" in this.cli_args.keys():
                            print(loaded_file_path,": .loaded.xml version exists: skipping")  
                            continue
                            process=False
                        else:
                            print("(.loaded.xml already exists)")

                    if process==True:    
                        fsize=""
                        if (os.path.exists(file_path)):
                            fstat=os.stat(file_path)
                            fsize=" ("+str(int(fstat.st_size / 1024)) + " kB) "
                        info=str(i)+" (of "+str(n)+"):"+file_path+fsize+ "  ("+str(datetime.datetime.now())+") >>> >>>"+cc.f.END
                        sep=cc.f.BOLD+cc.f.PURPLE+("#"*len(info))
                        print(sep)
                        print(info)
                        

                        if "o" in this.cli_args.keys() or "output" in this.cli_args.keys():
                            output_file=["output",this.cli_args["o"]]
                        else:
                            output_file=["output","default"]
                            
                        opt=this.opt(["file",file_path],["error_log_file",log_file_path],["step","loading"],["cleanup","false"],output_file)
                        if make_loadable==True:
                            rv=this.run_bx(opt,"make_loaded_file.xq")
                        else:
                            rv=0

                        if rv!=0:
                            err+=1
                        else:
                            if insert==True:
                                rv=this.run_bx(opt,"insert_file.xq")
                                
                                if rv==0:
                                    msg="File "+file_path+" successfully loaded in the database."
                                    msg2="#" * len(msg)
                                    print(cc.f.GREEN+cc.f.BOLD+msg2)
                                    print("File "+file_path+" successfully loaded in the database.")
                                    print(msg2+cc.f.END)
                                    n+=1
                                else:
                                    err+=1
                            else:
                                print("    Loadable file prepared, but not loaded into the DB. Run cc_loading [file] -insert_existing to insert it into the DB")
                            
                    print (cc.f.BOLD+cc.f.PURPLE+"<<< <<< "+file_path+cc.f.END)
                    
                    
                    #we give the user an opportunity to stop the loop
                    if process==True:
                        answer = None
                        try:
                            answer=subprocess.run(["python3","/usr/local/sbin/ask.py"],timeout=1)
                        except:
                            answer=""
                        else:
                            answer=cc.prompt("Execution paused. What do you want to do?",[["c","continue"],["e","exit the loop"]])
                            if answer=="e":
                                break
                            elif answer=="c":
                                pass
                        cc.line_up()
                    
                else:
                    print (file_path,"(skipping)")
                    
        
                
            print (str(n) + " files successfully inserted into the DB" +"\nErrors: " + str(err))
            
            if err>0 and this.context.type=="--folder--":
                print("Error log written in",os.path.join(this.context.path,"loading_errors"))

        print(cc.f.GREEN+"Working with " + this.context.path+" <<< <<< <<<" +cc.f.END)
        
        print("Error log:")
        nerr=0
        for l in this.log:
            if l[0]!=0:
                nerr=nerr+1
                print(l[1])
        if nerr==0:
            print("(no errors)")

        try:
            what_now=cc.prompt("What now?",[["C","Open new context"],["exit","End the program"]])
            if what_now=="exit":
                sys.exit()
            else:
                return what_now
        except:
            print("Ending program\n");
            sys.exit()

fname=""
folder=""
if len(sys.argv)>=2:
    if (sys.argv[1].startswith("-")==False):
        folder=sys.argv[1]
if len(sys.argv)>=3:
    if (sys.argv[2].startswith("-")==False):
        fname=sys.argv[2]


args={}
for i in range(len(sys.argv)):
    arg=sys.argv[i]
    if (arg.startswith("-")):
        arg=arg[1:]
        if (i+1<len(sys.argv)):
            v=sys.argv[i+1]
            if v.startswith("-")==False:
                args[arg]=v
            else:
                args[arg]=True
        else:
            args[arg]=True

path=folder+"/"+fname



explicitly_ask_for_context=False
while True:
    os.system("clear")
    print("\nCorpus corporum XML files loading")
    print("##################################################")
    work=cls_work(path,args,explicitly_ask_for_context)
    rv=work.work()
    path=work.context.path
    explicitly_ask_for_context=True #after one working cycle we will automatically ask for context
    print ("")
    
