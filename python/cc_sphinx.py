import cc, sys

print("Exporting data for sphinx indexer and running indexation")


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

cli_args=args

index=""
if "index" in cli_args.keys():
    index=cli_args["index"]

else:
    print ("No index specified. Enter index number or * for all indexes")

export=False
if "export" in cli_args.keys() or "e" in cli_args.keys():
    export=True

indexate=False
if "indexate" in cli_args.keys() or "i" in cli_args.keys():
    indexate=True

if export==True:
    cc.basex.run("export_sphinx_index.xq")
