import cc, sys

print("Rotating corpus_corporum_data and corpus_corporum_data_WORK databases.")

exists=cc.BX.command("list corpus_corporum_data_WORK")

wtd=""
if exists[1]!="":
    print("Database corpus_corporum_data_WORK doesn't exist. It will be now copied from corpus_corporum_data.")
    wtd="create work"    
else:
    print("Rotating WORK to stable.")

proceed=cc.prompt("Do you want to proceed?",[["Y","Yes"],["n","No"]])

if proceed!="Y":
    sys.exit()

if wtd=="create work":
    print("Going to copy the database. This may take several minutes, depending on the size of the database.")
    cc.BX.command("copy corpus_corporum_data corpus_corporum_data_WORK")
else:
    print("Going to index corpus_corporum_data_WORK DB and copy it to corpus_corporum_data. The indexation may take several minutes.")
    cc.BX.run("","rotate.xq")
    print("Updating metadata...")
    cc.BX.run("","update_metadata.xq")
