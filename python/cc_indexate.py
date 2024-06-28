import cc, sys

databases=[]
if len(sys.argv)>=2:
    for i in range(1,len(sys.argv)):
        databases.append(sys.argv[i])
else:
    databases=["corpus_corporum_metadata","corpus_corporum_tmp"]

if databases[0]=="all":
    databases=["corpus_corporum","corpus_corporum_tmp","corpus_corporum_data"]
    print("Indexing all databases: ",databases)
else:
    print("Indexing following databases: ",databases)

for db in databases:
    if db=="corpus_corporum_data":
        print("Indexing " + db + ". This operation may take several minutes.")
    rv=cc.indexate(db)
    print("Return status:", rv[0])
    print(rv[1])
