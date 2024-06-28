import sys,os,re,datetime,subprocess
from threading import Thread
import time

data_path="/var/www/html/data/"
admin_path="/var/www/html/ccadmin/"
rgx_files_to_exclude="(\.prep-sent\.xml$)|(\.prep-export\.xml$)|(\.loaded\.xml$)"

class cls_formatting:
   PURPLE = '\033[95m'
   CYAN = '\033[96m'
   DARKCYAN = '\033[36m'
   BLUE = '\033[94m'
   GREEN = '\033[92m'
   YELLOW = '\033[93m'
   RED = '\033[91m'
   BOLD = '\033[1m'
   UNDERLINE = '\033[4m'
   END = '\033[0m'
f=cls_formatting
    
class cls_options:
    def __init__(this):
        this.options=[]
        for i in range(1,len(sys.argv)):
            if sys.argv[i].startswith("-")==True:
                if i<len(sys.argv)-1:
                    next_argv=sys.argv[i+1]
                else:
                    next_argv=None
                this.set(sys.argv[i],next_argv)
                
    def set(this,opt,value):
        if value==None or value==True:
            value=True
        elif value.startswith("-"):
            value=True
        if opt.startswith("--")==True:
            opt=opt.partition("--")[2]
        elif opt.startswith("-")==True:
            opt=opt.partition("-")[2]
            if len(opt)>1:
                for o in opt:
                    this.set(o,True)
                return 0
        if isinstance(value,str) and value.casefold()=="false":
            value=False
        this.options.append([opt,value])
                      
    def add(this,name, value):
        this.options.append([opt,value])
    def get(this,name):
        for o in this.options:
            if o[0]==name:
                return o[1]
        return None

    def set_options_info(this,lst):
        this.info_list=lst

    
def save_cursor_pos():
    sys.stdout.write("\033[s")
def restor_cursor_pos():
    sys.stdout.write("\033[u")
    
def line_up(clear=True):
    sys.stdout.write("\033[F")
    if clear==True:
        clear_line()
def clear_line():
    sys.stdout.write("\033[K")

class basex:
    def __init__(this):
        pass
  

    def run(this,opt,script,print_info=True,log=None,capture_output=False):
        cmd="/opt/basex/bin/basex -b options=\""+opt+"\"  /opt/basex/webapp/CC_admin/"+script
        info="Running BX command:\n"+f.YELLOW+cmd+f.END
        if print_info==True:
            print(info)
        n_lines=len(info.splitlines())
        #rv=os.system(cmd)
        proc=subprocess.Popen(["/opt/basex/bin/basex", "-b options="+opt, "/opt/basex/webapp/CC_admin/"+script],stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        (out, err) = proc.communicate()
        
        if capture_output==True:
            return out
            
        for i in range(n_lines):
            line_up()
        
        if err=="":
            output=f.GREEN+f.BOLD+str(out)+ " ... OK"+f.END
            print("    "+output)
            if log != None:
                log.append([0,output])
            return 0
        else:
            output=f.RED+f.BOLD+str(out)+ " ... ERROR: "+err +f.END
            print("    "+output)
            if log!=None:
                log.append([err,output])
            return err

    def command(this,command,print_info=True,print_output=False,log=None):
        cmd="/opt/basex/bin/basex -c "+command
        info="Running BX command:\n"+f.YELLOW+cmd+f.END
        if print_info==True:
            print(info)
        if print_output==False:
            proc=subprocess.Popen(["/opt/basex/bin/basex","-c", command],stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            (out,err)=proc.communicate()
            return [out,err]
        else:
            print(["/opt/basex/bin/basex","-c", command])
            proc=subprocess.Popen(["/opt/basex/bin/basex","-c",command],text=True)

BX=basex()


def prompt(desc,params,delete_all=True):
    
    if desc!="":
        print(desc)
    for p in params:
        print("("+p[0]+")",p[1])
    rv=input("select command: ")
    if delete_all==True:
        for i in range(len(params)+1):
            line_up()
    else:
        line_up()
        
    line_up()
    
    return rv


class cls_delayed_prompt:
    def __init__(this,prompt,time_limit):
        this.start_time=0
        this.answer=None
        this.prompt=prompt
        this.time_limit=time_limit
        t1 = Thread(target=this.ask)
        t2 = Thread(target=this.timing)
        t1.start()
        t2.start()


    def ask(this):
        this.start_time = time.time()
        this.answer = input(this.prompt)
        time.sleep(0.001)


    def timing(this):
        while True:
            time_taken = time.time() - this.start_time
            if this.answer is not None:
                os._exit(1)
            if time_taken > this.time_limit:
                os._exit(1)
            time.sleep(0.001)
            
            




class cls_context:
    def __init__(this,path,explicitly_ask_for_context=False):
        this.process_to=0
        this.path=""
        this.folder_has_xml_files=0
        this.set_context(path,explicitly_ask_for_context)
        
        
    def set_context(this,path,explicitly_ask_for_context=False):
        prev_path=this.path
        if this.path!="":
            def_path=this.path
        else:
            def_path=path
            
        if path=="" or os.path.exists(path)==False or explicitly_ask_for_context==True:
            while True:
                path=this.ask_for_context(def_path)
                if path=="":
                    continue
                if os.path.exists(path)==True:
                    if prev_path!="":
                        print("Working context changed")
                    this.process_to=""
                    break
        
        
        this.path=path
        this.type=this.get_type()             
        this.orig_path=this.get_orig_path()
        
        print("Working context: "+ f.BOLD+this.path + f.END)
        print("type: " + this.type)
        if this.type=="--folder--":
            this.folder_has_xml_files
            for file_path in os.listdir(this.path):
                if re.search("\.xml$",file_path) and re.search(rgx_files_to_exclude,file_path)==None:
                    this.folder_has_xml_files+=1;
            
            print (this.folder_has_xml_files,"file(s) to process")
            
            this.folder=this.path
        else:
            this.folder=os.path.dirname(this.path)
        
        
        
        

    def ask_for_context(this,def_path=""):
        prompt_default=[["~","Shortcut for " + data_path], ["??? >>","List files in given context folder starting with ???"], ["-","or insert absolute path"]]
        if def_path!="":
            prompt_default=[["^", "Shortcut for " + os.path.dirname(def_path)]]+prompt_default
        p=prompt("Enter file or folder to work with.",prompt_default)
        p=p.replace("~",data_path)
        p=p.replace("^",os.path.dirname(def_path))
        #if os.path.exists(p)==False:
            
        
        return p
        
        
    def get_orig_path(this,path=""):
        if path=="":
            rv=this.path
        else:
            rv=path
            
        fname=os.path.basename(path)
        clean_fname=re.sub("\.(loaded|prep|prep-sent|prep-export)\.xml$",".xml",fname)
        folder1=os.path.dirname(path)
        folder2=os.path.basename(folder1)
        if folder2=="prep" or folder2=="loaded":
            rv=os.path.join(os.path.dirname(folder1),clean_fname)
        else:
            rv=os.path.join(folder1,clean_fname)
            
        return rv
    
    def get_state_path(this,path,state):
        orig=this.get_orig_path(path)
        if state=="" or state=="orig":
            return orig
        orig_fname=os.path.basename(orig)
        new_name=orig_fname.replace(".xml","."+state+".xml")
        orig_folder=os.path.dirname(orig)
        
        if state=="prep" or state=="prep-sent" or state=="prep-export":
            rv=os.path.join(orig_folder,"prep",new_name)
        elif state=="loaded":
            rv=os.path.join(orig_folder,"loaded",new_name)
        elif state=="sentences" or state=="sentences.lemmatised":
            rv=os.path.join(orig_folder,"prep",orig_fname)+"."+state
        return rv
    
    def get_type(this,path=""):
        if path=="": path=this.path
        if re.search("\.prep-sent\.xml$",path)!=None:
            return "prep-sent"
        elif re.search("\.prep-export\.xml$",path)!=None:
            return "prep-export"
        elif re.search("\.prep\.xml$",path)!=None:
            return "prep"
        elif re.search("\.xml$",path)!=None:
            return "orig"
        elif os.path.isdir(path):
            return "--folder--"
        else:
            return ""
    
    def find_missing(this,path,status,print_and_exit=False,add_folder_to_path=False,filelist=None):
        if path=="": path=this.path
        if print_and_exit==True:
            print("xml files in "+path+ " missing the '" + status + "' version:")
        files=[]
        rv=[]
        n=0
        if os.path.isdir(path):
            if filelist==None:
                files=os.listdir(path)
            else:
                files=filelist
            print("souborů před filtrací",len(files),status)
            status_path=os.path.join(path,status)
            for f in files:
                f=os.path.basename(f)
                if f.endswith(".xml") and f.startswith("_dbg_")==False and os.path.exists(os.path.join(status_path,f.replace(".xml","."+status+".xml")))==False:
                    if add_folder_to_path==True:
                        f=os.path.join(path,f)

                    if print_and_exit==True:
                        print(f)
                        n+=1
                    else:
                        rv.append(f)
        
        if print_and_exit==True:
            print("Total:",n)
            sys.exit()
        else:
            print("souborů po filtrací",len(rv))
            return rv
                


def indexate(database):
    return BX.run(database,"indexate.xq")

                
                
                
                
                
                
                
                
