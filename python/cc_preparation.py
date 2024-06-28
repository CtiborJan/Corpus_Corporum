import sys,os,re,subprocess,cc,datetime

class cls_work:
    def __init__(this,path,args,explicitly_ask_for_context=False):
        this.errors=[]
        this.cli_args=args
        
        if "stdin" in this.cli_args.keys(): #ie. read list of files from stdin (eg. from egrep result)
            this.filelist=sys.stdin.readlines()
            sys.stdin.close()
            sys.stdin = open('/dev/tty')
            this.stdin=True
        else:
            this.stdin=False

        this.context=cc.cls_context(path,explicitly_ask_for_context)
        this.basex=cc.basex()
        
        this.process_from=0
        this.process_to=0
        this.lemmatiser_to_use="treetagger.py" #"latincy.py" 
        
        log_file_path=os.path.join(this.context.folder,"log_preparation.txt")
        this.log_file=open(log_file_path,"a")
        this.log_file.writelines(["\n################################\nStarting new preparation, "+str(datetime.datetime.now())+"\n"])
        
    
    def opt(this,*opt):
        rv=""
        for o in opt:
            rv+="<"+o[0]+">"+o[1]+"</"+o[0]+">\n"
        return "<opt xmlns='http://mlat.uzh.ch/2.0'>"+rv+"</opt>"
    
    
    
    def state_0_to_1(this,filepath):#start with original file (with or without the preanalysis...) and bring it to the state of splited sentences (prep-sent)
        opt=this.opt(["file",filepath],["step","prep-sent"])
        rv=this.basex.run(opt,"make_prep_file.xq")
        if rv==0:
            this.log_file.writelines(["\n"+filepath+": (sentences ok)"])
            this.log_file.flush()
            #print ("(writing log)")
        else:
            this.errors.append(["01",filepath])
            this.log_file.writelines(["\n########\n",filepath+": SENTENCE SPLIT ERROR (return value: "+str(rv)+")\n","####"])
            this.log_file.flush()

            
        return this.context.get_state_path(filepath,"prep-sent")
        
    def state_1_to_2(this,filepath):#start with file with sentences ->export sentences for lemmatisatin -> run lemmatisation ->insert results into file...
        opt=this.opt(["file",filepath],["step","prep-export"])
        this.basex.run(opt,"make_prep_file.xq")
        #now the sentences are exported, we can run the lemmatiser

        sentences_path=this.context.get_state_path(filepath,"sentences")
        lemmatisation_canceled=False
        if os.path.exists(sentences_path):
            sentences_file=open(sentences_path,"r")
            if sentences_file.read()=="no lemmatisation":
                print("Lemmatisation prevented by the file settings.")
                lemmatisation_canceled=True
        if clopt.get("L")==True:
            lemmatisation_canceled=True
            print("Lemmatisation canceled.")
        
        if lemmatisation_canceled==False:
            print("Running lemmatisation (using "+this.lemmatiser_to_use+")")
            subprocess.run(["python3",cc.admin_path+"lemmatisers/"+this.lemmatiser_to_use,sentences_path])
        #now now the text is lemmatised...
        
        filepath=this.context.get_state_path(filepath,"prep-export")
        opt=this.opt(["file",filepath],["step","prep"])
        rv=this.basex.run(opt,"make_prep_file.xq")
        if rv==0:
            this.log_file.writelines(["\n"+filepath+": (lemmatisation ok)"])
            this.log_file.flush()
        else:
            this.errors.append(["12",filepath])
            this.log_file.writelines(["\n########\n",filepath+": LEMMATISATION ERROR (return value: "+str(rv)+"): ","\n####"])
            this.log_file.flush()
        #now, the results are written in the *.prep.xml file. We have finished!
        return this.context.get_state_path(filepath,"prep")
        
        
    def state_0_to_2(this,filepath):#start with file with sentences and export the sentences for lemmatisation
        print (filepath)
        filepath=this.state_0_to_1(filepath)
        print (filepath)
        filepath=this.state_1_to_2(filepath)
        
    def explore_folder(this,folder,stdinfilelist=None):
        count_state0=0
        count_state1=0
        filelist=[]

        if stdinfilelist!=None:
            for file_path in stdinfilelist:
                    
                    file_path=os.path.join(folder,file_path.strip())
                    
                    if "use_status" in this.cli_args.keys():
                        
                        file_path=this.context.get_state_path(file_path,this.cli_args["use_status"])
                    filelist.append(file_path)
        else:


            for file_path in os.listdir(folder):
                if os.path.isfile(os.path.join(folder,file_path)):
                    filelist.append(os.path.join(folder,file_path))
                    if re.search("\.xml$",file_path) and re.search(cc.rgx_files_to_exclude,file_path)==None: #pure .xml (state 0)
                        count_state0+=1
                    elif re.search("\.prep-sent\.xml$",file_path):
                        count_state1+=1 #with sentences split
        return [count_state0,count_state1,filelist]
   
    
    def work(this):
        
        """
        We must decide, what to do - to which state do we want to process the file? Only to state prep-sent, when the file is split into sentences, so that we can control it manually,
        or process it completely, i. e. split into sentences and lemmatise as well.
        When working with a folder, we must chose not only, to which state should the files be processed, but also, with which files should we start (for a case, there are .prep-sent.xml and ---.xml as well)
        """
        
        print(cc.f.GREEN+"\nWorking with " + this.context.path+" >>> >>> >>>"+cc.f.END)
        files=[]

        to_state=""

        if "2" in this.cli_args.keys():
            to_state="2"
        elif "1" in this.cli_args.keys():
            to_state="1"

        if this.context.type=="--folder--": 
            
            if this.stdin==False:
                if "u" in this.cli_args.keys() or "unprocessed" in this.cli_args.keys():
                    unprocessed_state=this.cli_args["u"]
                    if unprocessed_state=="":
                        unprocessed_state="prep"
                    rv=this.explore_folder(this.context.path)
                    unprocessed_states=unprocessed_state.split("+")#můžeme chtít víc stavů. Typicky prep+loaded
                    unprocessed_state=unprocessed_states[0]
                    files=this.context.find_missing("",unprocessed_states[0],False,True)
                    for ui in range(1,len(unprocessed_states)):
                        files=this.context.find_missing("",unprocessed_states[ui],False,True,files)

                    print("You are about to work with unprocessed files a folder. This folder contains "+str(len(files))+" unprocessed files (*.xml).")
                else:
                    rv=this.explore_folder(this.context.path)
                    files=rv[2]
                    print("You are about to work with a folder. This folder contains "+str(rv[0])+" original file (*.xml) and "+str(rv[1])+" files after sentence-splitting (*.prep-sent.xml).")
            else:
                rv=this.explore_folder(this.context.path,this.filelist)
                for f in this.filelist:
                    
                    f=os.path.join(this.context.path,f.strip())
                    
                    if "use_status" in this.cli_args.keys():
                        
                        f=this.context.get_state_path(f,this.cli_args["use_status"])
                    files.append(f)
                print("You are about to work with a specified list of files ("+str(len(files))+")")
                
            
            """
            special cases: missing + status: print all files, that don't have the /status/ state file (prep,loaded)
            """
            
            if "list" in this.cli_args.keys() or "l" in this.cli_args.keys():
                print("Total selected files:",len(files))
                for f in files:
                    print (f)
                sys.exit()
        
            
            if to_state=="":
            
                prompt_state=[["C","Change working context"],["1","Use original files (*.xml) and process them up to splitting into sentences (*.prep-sent.xml)"],["2","Use original files and process them completelly (*.xml -> *.prep.xml)"]]
                if (rv[1]>0):
                    prompt_state.append(["3", "Use files with sentences splitted (*.prep-sent.xml) and finish their preparation (=>*.prep.xml)"])
                    
                to_state=cc.prompt("What do you want to do?",prompt_state)
            
            
            use_sent="0"
            if to_state=="2" and rv[1]>0:
                use_sent=cc.prompt("There are " + str(rv[1]) + " *.prep-sent.xml file(s) in the folder. Should they be also processed? In case, there is a *.prep-sent.xml state file for a *.xml file, which one should be used?", \
                    [["1","Processed, bud not prefered"],["2","Processed and prefered"],["3","Not processed"]])
        else:
            use_sent="0"
            files=[this.context.path]
            if to_state=="":
                if this.context.type=="orig":
                    to_state=cc.prompt("What do you want to do with the file?",[["C","Change working context"],["1","Split into sentences and stop (for manual control)"],["2","Process it completelly without stoping"]])
            
        
        
        if to_state=="C":
            return "C"
        
        
            """missing_state=this.cli_args["lu"]
            if missing_state==True: missing_state="prep"
            this.context.find_missing("",missing_state,True,True)"""
            


        i=0
        n=len(files)
        for f in files:
            i+=1
            if os.path.basename(f)=="sentences.xml" or os.path.basename(f).startswith("_dbg"):
                print("DBG FILE")
                continue
            ftype=this.context.get_type(f)

            
                
            process=False
            if to_state=="1" or to_state=="2":
                if ftype=="orig":
                    if use_sent=="2":
                        if os.path.isfile(this.context.get_state_path(f,"prep-sent")):
                            process=False
                        else:
                            process=True
                    else:
                        process=True
            elif to_state=="3" and ftype=="prep-sent":
                process=True

            if "skip_existing" in this.cli_args.keys():
                if to_state=="2" and  os.path.isfile(this.context.get_state_path(f,"prep")):
                    process=False
            
            
            
            if process==True:
                fsize=""
                if (os.path.exists(f)):
                    fstat=os.stat(f)
                    fsize=" ("+str(int(fstat.st_size / 1024)) + " kB) "
                info=str(i)+" (of "+str(n)+"):"+f+fsize+ "  ("+str(datetime.datetime.now())+") >>> >>>"+cc.f.END
                sep=cc.f.BOLD+cc.f.PURPLE+("#"*len(info))
                print(sep)
                print(info)
                if this.context.get_type(f):
                    if to_state=="1":
                        this.state_0_to_1(f)
                    elif to_state=="2":
                        this.state_0_to_2(f)
                else:
                    this.state_1_to_2(f)        
                print(cc.f.BOLD+cc.f.PURPLE+"<<< <<<"+f+"\n"+cc.f.END)
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
            else:
                if this.context.type=="--folder--":
                    print(str(i)+" (of " + str(n)+"):",f,"(skipping)\n")
                    
                    
                                
        
        print(cc.f.GREEN+"<<< <<< <<< Working with " + this.context.path + " Result: " +str(len(this.errors)) + " errors." +cc.f.END)
        what_now=cc.prompt("What now?",[["C","Open new context"],["exit","End the program"],["*command*","Run any command ('missing')"]])
        if what_now=="exit":
            this.log_file.close();
            sys.exit()
        else:
            return what_now
            

fname=""
folder=""
if len(sys.argv)>=2:
    if (sys.argv[1].startswith("-")==False):
        folder=sys.argv[1]
if len(sys.argv)>=3:
    if (sys.argv[2].startswith("-")==False):
        fname=sys.argv[2]

i=0

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

clopt=cc.cls_options()
path=folder+"/"+fname


while True:
    os.system("clear")
    print("\nCorpus corporum XML files preparation")
    print("#####################################")
    work=cls_work(path,args)
    rv=work.work()
    if rv=="C":
        path=""
        continue
    elif rv=="end":
        break
