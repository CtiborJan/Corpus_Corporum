#this scripts goes through basex scripts in opt/basex/bin/modules, collects informations about usage of every function and writes them after function header 
import os,datetime,re,subprocess

dir="/opt/basex/bin/modules/test"
files=[]

for file in os.listdir(dir):
    fpath=os.path.join(dir,file)
    if os.path.isfile(fpath):
        f=open(fpath)
        while True:
            l=f.readline()
            if not l:
                break
            if l.startswith("declare function cc:")==True or l.startswith("declare updating function cc:")==True:
                fname=re.search("(cc:[^ (]*)",l).group()
                print(fname)
                print("grep -n /opt/basex/bin/modules/* -e '"+fname+"'")
                process=subprocess.Popen(["grep -n /opt/basex/bin/modules/* -e '"+fname+"'"],stdout=subprocess.PIPE,text=True)
                
                result = process.communicate()
                print(result)
                
        f.close()            

          
