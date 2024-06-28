import cc, sys, re, os

class cls_folder_to_copy:
    def __init__(this,lines,d="P>T"):
        

        flds=lines[0].partition("\t")
        this.folder_P=flds[0]
        this.folder_T=flds[2]

        Ffrom=this.folder_P
        Fto=this.folder_T
        this.dest_folder=Fto
        if d=="T>P":    
            Ffrom=this.folder_T
            Fto=this.folder_P

        this.replacements=[]
        this.files_to_copy=[]
        lines.pop(0)

        reading_settings=False
        filelist=[]
        for l in lines:
            l=l.strip()
            if l=="{":
                reading_settings=True
                continue
            elif l=="}":
                reading_settings=False
                continue
            
            if reading_settings==True:
                if l.startswith("s/")==True:
                    r=l.partition("\t")
                    if d=="P>T":
                        this.replacements.append(r[0])
                    else:
                        this.replacements.append(r[2])
            else:
                
                if l=="*":
                        filelist=os.listdir(Ffrom)
                elif l.startswith("- "):
                    fname=l.partition("- ")[2]
                    for f in filelist:
                        if f==fname:
                            filelist.remove(f)
                            break
                else:
                    this.files_to_copy.append([os.path.join(Ffrom,l),os.path.join(Fto,l)])

        if len(filelist)>0:
            for i in range(len(filelist)):
                filelist[i]=[os.path.join(Ffrom,filelist[i]),os.path.join(Fto,filelist[i])]
            this.files_to_copy=filelist
        
        m=this.folder_P+" <-> "+this.folder_T
        print("#"*(len(m)))
        print (m)
        print("#"*(len(m)))
        
        #print(this.replacements)
        this.copy()

    def copy(this):
        os.makedirs(this.dest_folder,0o777,True)
        for f in this.files_to_copy:
            cmd="cp "+f[0]+" "+f[1]
            print(cmd)
            os.popen(cmd)
            for r in this.replacements:
                cmd="sed -i '"+r+"' "+f[1]
                print (cmd)
                os.popen(cmd)



flds=[]


def read_config_file(cfile):
    cf=open(cfile,"r")
    cfl=cf.readlines()
    lb=[]
    reading_folder=False
    for l in cfl:
        l=l.partition("#")[0].strip()
        if l!="":
            if l.startswith("/"):
                if reading_folder==False:
                    reading_folder=True
                else:
                    flds.append(cls_folder_to_copy(lb))
                    lb=[]
            lb.append(l)
    if reading_folder==True:
        flds.append(cls_folder_to_copy(lb))

cdef="/etc/corpus_corporum/test_cloning.conf"

options=[
    ["-c, --config","Path to configuration file. Default is "+cdef,""],
    ["-d, --direction","Direction of cloning: P>T = public to test, T>P = test to public",""],
    ["-f, --file", "Specify one file to clone",""]
    ["-fld, --folder", "Specify one folder to clone",""]
]


for i in range(1,len(sys.argv)):
    a=sys.argv[i]
    if a.startswith("-"):
        v=sys.argv[i+1]
        i+=1
        


#read_config_file()
