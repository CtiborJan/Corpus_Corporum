#this scripts goes through basex scripts in opt/basex/bin/modules and creates a list of web-accessible functions and modules in which they are located
import os,datetime

dir="/opt/basex/bin/modules"
files=[]
f_out=open("/var/www/html/basex/functions","w")
f_out_admin=open("/var/www/html/ccadmin/basex/functions","w")
f_out.write(str(datetime.datetime.now())+"\n");
f_out_admin.write(str(datetime.datetime.now())+"\n");
for file in os.listdir(dir):
    fpath=os.path.join(dir,file)
    if os.path.isfile(fpath):
        module_written_out=False;
        module_written_out_admin=False;
        f=open(fpath)
        #f_out.write("module="+fpath+"\n")
        while True:
            l=f.readline()
            if not l:
                break
            
            if l.startswith("declare function cc:")==True or l.startswith("declare updating function cc:")==True:
                nl=f.readline()
                if nl.find("(:web_accessible:)") != -1:
                    fn_name_start=l.find("cc:")
                    if fn_name_start!=-1:
                        if module_written_out==False:
                            f_out.write("module="+fpath+"\n")
                            module_written_out=True
                        fn_name_end=l.find("(");
                        fn_name=l[fn_name_start:fn_name_end]
                        f_out.write(fn_name+"\n")
                elif nl.find("(:admin_accessible:)") != -1:
                    fn_name_start=l.find("cc:")
                    if fn_name_start!=-1:
                        if module_written_out_admin==False:
                            f_out_admin.write("module="+fpath+"\n")
                            module_written_out_admin=True
                        fn_name_end=l.find("(");
                        fn_name=l[fn_name_start:fn_name_end]
                        f_out_admin.write(fn_name+"\n")
        f.close()            
f_out.close()
f_out_admin.close()
