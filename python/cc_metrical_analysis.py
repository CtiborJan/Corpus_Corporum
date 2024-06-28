import cc, sys, re, os, xml.etree.ElementTree as ET 
import cc_verse_analysis as ccva


opt=cc.cls_options()

file=opt.get("f")
file="/var/www/html/data/Corpus5_Latinitias_antiqua/Ausonius_Genethliacon-ad-Ausonium-Nepotem_TEST.xml"
if file==None or file=="":
    print("No file specified. Quitting. Use -f <filename>")
    sys.exit()


file=ET.parse(file)
ns={"cc":"http://mlat.uzh.ch/2.0","tei":"http://www.tei-c.org/ns/1.0"}
exists_MA=file.findall("./tei:teiHeader/tei:xenoData/cc:metrical_analysis",ns)
if len(exists_MA)>0:
    
    r=cc.prompt("This file has already been analysed. Do you want to:",[["A","analyse it again"],["b","Go through unidentified verses and correct them"]])
    if r=="b":
        ls=file.findall("./tei:text//tei:l",ns)
        print("Total verses: ",len(ls))
        tbc=0
        ni=0
        for l in ls:
            if ("real" in l.attrib) == False:
                tbc+=1
            if ("met" in l.attrib) == False:
                ni+=1
        print("Verses to be corrected:",tbc, "of which not identified at all:",ni)
    
        for l in ls:
            if ("real" in l.attrib) == False:
                print(cc.f.BOLD + cc.f.YELLOW+ l.text +cc.f.END)
                if ("met" in l.attrib) == False:
                    print(cc.f.RED+"The meter of this verse has not been identified"+cc.f.END)
                else:
                    print(cc.f.PURPLE+"There have been identified more possible metrical variants for this verse"+cc.f.END)
                #cc.BX.run()
                ccva.debug=False
                rv=ccva.run_analysis(l.text)
                ma=ET.fromstring(rv)

                metr_variants=ma.findall("./cc:verse/cc:variant_assessed",ns)

                print(len(metr_variants),"metrical variants")
                i=0
                for mv in metr_variants:
                    i+=1
                    verse_type=mv.find("cc:type",ns)
                    if verse_type==None:
                        verse_type=""
                    else:
                        verse_type=cc.f.BOLD+verse_type.text+cc.f.END
                    print(i,mv.find("cc:text",ns).text,mv.find("cc:schema",ns).text,verse_type)

                action=cc.prompt("What can you do?",
                [
                    ["1-"+str(i),"Select one of possible variants"],
                    ["x","Display metrical variants for single words as retrieved from the DB"],
                    ["+++","Add metrical variant(s) to the DB"],
                    [">>>","Enter metrical schema directly"],
                    ["S","Skip to next verse"],
                    ["end","End the program"]
                ])
                if re.search("^[0-9]+$",action)!=None:
                    #l.set("metr",)
                    print
                    print(mv[int(action)-1].find("cc:type_abbr",ns).text)


                
#read_config_file()
