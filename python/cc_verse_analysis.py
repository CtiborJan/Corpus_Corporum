import sys,os,regex,re,datetime,subprocess,copy,cc,json,logging
import xml.etree.ElementTree as ET 

debug=True

class cls_metrical_schemata:
	def __init__(this):
		this.metres=[
			["-(uu/-)|-(uu/-)|-(uu/-)|-(uu/-)|-uu|-x","hexameter","H"],
			["-(uu/-)|-(uu/-)|-(uu/-)|-(uu/-)|--|-x","hexameter (sine clausula heroica)","H2"],
			["-(uu/-)|-(uu/-)|-||-uu|-uu|x","pentameter","P"],
			["-(uu/-)|-(uu/-)|-||(uu/-)|-(uu/-)","Tetrametrum dactylicum plenum","TmDp"],
			["-(uu/-)|-(uu/-)|-||(uu/-)|-(uu/-)","Tetrametrum dactylicum catalectum","TmDa"],
			["-uu-uux","Dimetrum dactylicum hypercatalecticum (Hemiepes)","DDhc"],
			["-u-u--","Dimetrum dactylicum catalectum (Adonius versus)","DDc"],
			["u-u-u||-u|-u-u-ux","Senarius purus","Sp"],
			["(u/uu/-)(uu/-)u(uu/-)x||(uu/-)u(uu/-)x-ux","Trimetrum iambicum","TI"],
			["x-u-x||-u-u-x","Trimetrum iambicum catalectum","TIc"],
			["--u---u-x","Dimetrum iambicum hypercatalectum (versus Alcaicus enneasyllabus)","Alc11"],
			["(u/-)(uu/-)u(uu/-)(u/-)-u(u/-)","Dimetrum iambicum (Archilochium)","DI"],
			["-u-u-ux","Dimetrum trochaicum catalectum (Euripidium)","DTc"],
			["-u-u--","Tripodia (ithyphallicus)","TP"],
			["---uu--","Pherecrateus","Pher"],
			["-uu-u-x","Aristophaneus","Aris"],
			["-uu-u-u-","Glyconeus primus","Gl1"],
			["xx-uu-ux","Glyconeus secundus","Gl2"],
			["-x-x-uu-","Glyconeus tertius","Gl3"],
			["-uu-uu---u","Alcaicus decasyllabus","Alc10"], 
			["x-u---uu-ux","Alcaicus hendecasyllabus","Alc11"],
			["xx-uu-u-u--","Phalaecius hendecasyllabus","Ph10"],
			["---uu--uu-ux","Asclepiadeus minor","AscMi"],
			["xx-uu-||-uu-ux","Asclepiadeus minor graecus (Aeolicus)","AscMiG"],
			["---uu-|-uu-|-uu-ux","Asclepiadeus maior","AscMa"],
			["-uu-x","Adoneus","Ad"],
			["-u-x-uu-u-x","Sapphicus minor","SapMi"],
			["-u---uu--uu-u-x","Sapphicus maior","SapMa"]
		]

	def schema_to_array(this,schema):
		#ja, eigentlich könnte ich die Schemen oben direkt als Array eingeben und diese Methode wäre überflüsig, aber es wäre unübersichtlich
		i=0
		rv=[]
		while i<len(schema):
			ch=schema[i]
			if ch=="-" or ch=="u" or ch=="x":
				rv.append(ch)
			elif ch=="(":
				j=i+1
				s=""
				while j<len(schema):
					ch2=schema[j]
					if ch2==")":
						i=j
						break
					else:
						s=s+ch2
					j+=1
				rv.append(s.split("/"))

			i+=1
		return rv		

	def matches(this,verse,schema):
		schema_array=this.schema_to_array(schema)
		p=1
		for s in schema_array:
			if (verse==""):
				#print('if (verse==""):')
				return False
			if (len(s)==1):
				if verse[0]!=s and s!="x":
					#print('if verse[0]!=s and s!="x":')
					return False
				else:
					verse=verse.partition(verse[0])[2]
			else:
				m=False
				for s2 in s:
					if verse.startswith(s2):
						m=True
						verse=verse.partition(s2)[2]
						break
				if m==False:
					return False

			p+=1
		
		if verse=="":
			#print("RETURN TRUE")
			return True 
		else:
			return False

	def find_schema(this,verse_schema,fullName=True):
		rv=[]
		for m in this.metres:
			if this.matches(verse_schema,m[0])==True:
				if fullName==True:
					rv.append(m[1])
				else:
					rv.append(m[2])
		
		return rv

	def metres_as_XML(this):
		rv="<metres>\n"
		for m in this.metres:
			rv+="<metre name='"+m[1]+"̈́' abbreviation='"+m[2]+"'>"+m[0]+"</metre>\n"
		rv+="</metres>\n"
		return rv


class cls_syllable:
	def __init__(this,value,vocal,word,lengths_set=False):
		this.value=value.casefold()
		this.vocal=vocal.casefold()
		this.quantity="?"
		this.quantity_type=""
		this.is_elided=False
		this.is_elided_to=""
		this.flags={"start_of_word":False,"end_of_word":False,"consonants_after":"","consonants_after_next":""}
		this._lengths_set=lengths_set
		if regex.search("^(ae|oe|œ|æ|au|eu|ei|ui)$",this.vocal)!=None:
			this.quantity_type="Ld"
			this.quantity="L"
		elif regex.search("[āēīōū]",this.vocal)!=None or this.vocal=="ȳ":
			this.quantity_type="Ln"
			this.quantity="L"
		#N.B.: neither re or regex can't really tell the difference between ȳ and y. They fail here.
		#str.find() also returns 0 for "ȳ".find("y"), but -1 for e. g. "ā".find("a") and "y".find("ȳ")			
		elif regex.search("[aeiouyëäï]",this.vocal)!=None and lengths_set==True and word.lengths_set==True:
			this.quantity_type="Bn"
			this.quantity="B"

		this.flags["consonants_after"]=regex.findall(this.vocal+"(.*)",this.value)[0]

		this.word=word;		
		this.next_syllable=None
		this.previous_syllable=None


		
	def assess_elision(this,flags):
		if this.next_syllable==None:
			return False
		score=0
		ca=this.flags["consonants_after"]
		can=this.flags["consonants_after_next"]
		
		if this.flags["end_of_word"]==True:
			if ca=="":
				score=0
			elif ca=="m":
				score=1
			else:
				score=10
			
			if can=="":
				score+=0
			elif can=="h":
				score+=1
			else:	
				score=10
			if this.vocal==this.word.value:
				score+=5

			if score<3:
				if this.next_syllable.word.value=="est":
					this.next_syllable.is_elided=True
					this.next_syllable.is_elided_to="<"
					return True
				this.is_elided=True
				this.next_syllable.is_elided_to=">"
				#print(this.value,this.word.value)
				return True

	
	def next_syllable_set(this,next_syllable):
		
		this.next_syllable=next_syllable
		
		what_follows=""
		#print("####### this.value",this.value)
		what_follows_this=this.flags["consonants_after"]#regex.findall(this.vocal+"(.*)",this.value)[0]
		#print("###### what_follows_this:",what_follows_this)
		if (next_syllable!=None):
			next_syllable.syllable_syllable=this
			this.flags["consonants_after_next"]=regex.findall(r"(.*?)[aeiouyœæäëïöüÿāēīōūȳ]+",next_syllable.value)[0].strip();
		#	print("####### what_follows_next",what_follows_next)
		else:
			this.flags["consonants_after_next"]="";

		
		what_follows=this.flags["consonants_after"].strip()+this.flags["consonants_after_next"].strip()
		what_follows=what_follows.replace("x","ks")
		
			
		
		what_follows_l=len(what_follows)
		what_follows_H=what_follows_l-what_follows.count("h")
		what_follows_CH=what_follows_l-what_follows.count("ch")
		
		#muta cum liquida, h, ch
		if this.quantity!="L":
			if what_follows_l==1 and what_follows=="j":
				this.quantity="?"
				this.quantity_type="?vIv-pos"		
			elif what_follows_l==2:
				if regex.search("[pbdtgck][lr]",what_follows)==None:
					if what_follows_H==2:
						this.quantity="L"
						this.quantity_type="Lp"
					else:
						this.quantity="?"
						this.quantity_type="?H-pos"
				else:
					this.quantity="?"
					this.quantity_type="?mcl"
			elif what_follows_l>=3:
				if what_follows_H<2 or what_follows_CH<2:
					this.quantity="?"
					this.quantity_type="?H-pos"
				else:
					this.quantity="L"
					this.quantity_type="Lp"

		this.assess_elision(None)

	def dump(this):
		print("cls_syllable dump")
		print("[")
		print(" value:",this.value)
		print(" word:",this.word)
		print(" vocal:",this.vocal)
		print(" quantity:",this.quantity)
		print(" quantity_type:",this.quantity_type)
		print(" is_elided:",this.is_elided)
		print(" flags:",this.flags)
		print("]")

class cls_word:
	def __init__(this,value,previous=None,lengths_set=False):
		this.value=value
		this.previous=previous
		this.syllables=[]
		this.metr=[]
		this.end_of_verse=False
		this.lengths_set=lengths_set
	def dump(this,syllables_too=False):
		print("cls_word dump")
		print("[")
		print(" value:",this.value)
		print("lengths_set:",this.lengths_set)
		print(" metr:",this.metr)
		if syllables_too==True:
			print(" syllables:")
			for s in this.syllables:
				s.dump()
		print("]")
		
class cls_metrical_variant:
	def __init__(this,words,syllables):
		this.words=words
		this.syllables=syllables
		
	def clone(this):
		clone=cls_metrical_variant(copy.deepcopy(this.words),copy.deepcopy(this.syllables))
		return clone
	def schema(this,elided_too=False,as_str=False):
		rv=[]
		for s in this.syllables:
			if s.is_elided==False or elided_too==True:
				if s.quantity.startswith("B"):
					rv.append("u")
				elif s.quantity.startswith("L"):
					rv.append("-")
				else:
					rv.append("?")

				if s.is_elided==True:
					rv.append("(E)")
		if as_str==True:
			return "".join(rv)
		return rv
	def vocal_schema(this,elided_too=False,as_str=False):
		rv=[]
		for s in this.syllables:
			if s.is_elided==True:
				rv.append("[")
				
			if s.quantity.startswith("B"):
				rv.append(s.vocal.lower())
			elif s.quantity.startswith("L"):
				if len(s.vocal)==1:
					rv.append(s.vocal.upper())
				else:
					rv.append("("+s.vocal.upper()+")")
			else:
				rv.append(s.vocal+"?")
				
			if s.is_elided==True:
				rv.append(s.is_elided_to)
				rv.append("]")
			
		if as_str==True:
			return "".join(rv)
		return rv

	def text(this):
		rv=""
		for w in this.words:
			rv+=" "+w.value
		
		return rv.strip()
	
	def dump(this,single_words=True):
		print ("Metrical variant dump:")
		print ("[[")
		print(this.text())
		print("".join(this.schema(True)))
		print("".join(this.vocal_schema(True)))
		print("word count:",len(this.words))
		if single_words==True:
			for w in this.words:
				w.dump()
		print ("]]")
		
class cls_verse:
	def __init__(this,verse,m=1,lengths_set=False,verse_index=0):
		this.value=verse
		this.verse_index=verse_index
		this.metrical_variants=[]
		if isinstance(verse,list):
			this._words=verse
			if debug==True:
				print("#####",len(verse))
		else:
			if debug==True:
				print("#####","reading from string:",verse)
			this._words=this.string_to_words(verse)
		this.metrical_variants=this.retrieve_possible_metrical_variants(this._words,m,lengths_set)
		
	
		

	def split_to_syllables(this,verse,m=0,lengths_are_set=False):
		if isinstance(verse,list):
			t=""
			for w in verse:
				t+=w.value+" "
				
			t=t.strip()
			words_given=True
		else:
			t=verse.strip()
			words_given=False
		
		t=regex.sub(r"[^\p{L}\s]",r"",t)
		tt=t.casefold();
		tt=regex.sub(r"[#@&]",r"~",tt)
		
		tt=regex.sub(r"[ch]uius",r"&#@&",tt)
		tt=regex.sub(r"qu",r"¶",tt)
		
		tt=regex.sub(r"([aeiouyœæāēīōūȳ]|\s|^)i([aeiouyœæāēīōūȳ])",r"\1j\2",tt);
		
		tt=regex.sub(r"eum",r"#&",tt)
		tt=regex.sub(r"cui",r"&#",tt)
		tt=regex.sub(r"huic",r"&#&",tt)
		tt=regex.sub(r"gu([aeiouyœæëāēīōūȳ])",r"¶\1",tt)
		tt=regex.sub(r"eu(\W)",r"#\1",tt)
		tt=regex.sub(r"(ae|oe|ei|au)",r"#",tt)
		tt=regex.sub(r"[aeiouyœæëāēīōūȳ]",r"@",tt)
		tt=regex.sub(r"\p{L}",r"&",tt)
		tt=regex.sub(r"[^#@&¶]",r"~",tt)
		
		if debug==True:
			print("#####","Schema 1")
			print ("(",t,")")
			print("=",tt)
		
		tt=regex.sub(r"([¶#&@])(~|$)",r"\1|\2",tt);
		
		while regex.sub(r"([¶#&@])(~|$)",r"\1|\2",tt)!=tt:
			tt=regex.sub(r"([¶#&@])(~|$)",r"\1|\2",tt)
		while regex.sub(r"([@#])([#@])",r"\1|\2",tt)!=tt:
			tt=regex.sub(r"([@#])([#@])",r"\1|\2",tt)
		while regex.sub(r"([@#][&¶])([¶&]+[@#])",r"\1|\2",tt)!=tt:
			tt=regex.sub(r"([@#][&¶])([¶&]+[@#])",r"\1|\2",tt)
		while regex.sub(r"([@#])([&¶])([@#])",r"\1|\2\3",tt)!=tt:
			tt=regex.sub(r"([@#])([&¶])([@#])",r"\1|\2\3",tt)
			
		if debug==True:
			print("#####","Schema 2")
			print(tt)
		
		
		j=0;
		rv="";
		vocals=[];
		for ch in tt:
			if ch!="|":
				if ch=="&" and t[j]=="i":
					rv+="j"
				else:
					rv+=t[j]
				
				if ch=="@" or ch=="#":
					vocals.append(t[j])
				j+=1;
				if ch=="#" or ch=="¶":
					rv+=t[j]
					if ch=="#":
						vocals[len(vocals)-1]+=t[j]
					j+=1
			else:
				rv+="|"
		
		s=[]
		
		
		if words_given==False:
			w=[]
			w.append(cls_word("",None))
		else:
			w=verse
			
		arr=rv.split("|")
		arrSch=tt.split("|")
		acw=0
		if debug==True:
			print(rv,arr,vocals)
		for i in range(0,len(arr)):
			if arr[i].strip()!="":		
				new_s=cls_syllable(arr[i],vocals[i],w[acw],lengths_are_set)
				if w[acw].value=="":
					new_s.flags["start_of_word"]=True
				s.append(new_s)
				if words_given==False:
					w[acw].value+=arr[i]
				w[acw].syllables.append(new_s)
				if i>0:
					s[i-1].next_syllable_set(new_s)
				if i<len(arr)-1 and regex.search("^\s",arr[i+1])!=None:
					new_s.flags["end_of_word"]=True
					if words_given==False:
						if acw>1:
							w.append(cls_word("",w[acw-1]))
						else:
							w.append(cls_word("",None))
					acw+=1
		
		s[len(s)-1].next_syllable_set(None)#last syllable - we must call this method to asses the positional length
		
		
		if debug==True:
			print("#####","split_to_syllables -> word count 2:",len(w))
			print("#####","split_to_syllables -> syllables:",len(w))
			
			#for ss in s:
			#	ss.dump()
		return cls_metrical_variant(w,s)
		
	def string_to_words(this,verse):
		t=verse.strip()
		t=regex.sub("[^\p{L}\s]","",t)
		t=t.casefold()
		ww=t.split(" ")
		words=[]
		for w in ww:
			words.append(cls_word(w,None))
		return words

	def retrieve_possible_metrical_variants(this,words,m=0,lengths_set=False):
		m___("retrieve_possible_metrical_variants...")
		line=""
		for w in words:
			line+=w.value+" "
			
		if lengths_set==False:
			if debug==True:
				print("#####","reading metrical data from DB")
			bx=cc.basex()
		
			xml=bx.run("<text xmlns='http://mlat.uzh.ch/2.0'><line>"+line+"</line></text>","get_metrical_variants.xq",False,None,True)
			if debug==True:
				print("#####",xml)
			root=ET.fromstring(xml)
			
			ns={"cc":"http://mlat.uzh.ch/2.0"}
			xml_words=root.findall("./cc:line/cc:word",ns)
			for i in range(len(xml_words)):
				xml_w=xml_words[i]
				w=words[i]
				metr=xml_w.findall("./cc:metr",ns)
				for me in metr:
					w.metr.append(me.attrib["form"])
					w.lengths_set=True
				if len(metr)==0:
					w.metr.append(xml_w.attrib["value"])
					w.lengths_set=False
		
		if debug==True:
			#print("#####","Metrical variants obtained from DB","#####")
			#for w in words:
			#	w.dump()
			pass

		combinations=this.make_combinations(words)
		
		if debug==True:
			print("#####","Possible variants count","#####")
			print(len(combinations))
				
				
		possible_line=""
		possible_variants=[]
		pl_words=[]

		m___("loop to obtain word-combinations")
		for i in range(len(combinations)):
			possible_line=""
			pl_words=[]
			for j in range(len(words)):
				possible_line+=" "+ words[j].metr[combinations[i][j]]
				pl_words.append(cls_word(words[j].metr[combinations[i][j]],None,words[j].lengths_set))
			

			if (m==0):
				possible_variants.append(possible_line)
			else:
				possible_variants.append(this.split_to_syllables(pl_words,1,True))
		
		m___()
		#if debug==True:
		#	print("#####","Possible variants calculated (before unknown wors, McL)","#####")
		#	for pv in possible_variants:
		#		pv.dump(True)
		
		#muta cum liquida and non identified words (=? in metrical schema): here we can go one syllable after another, not by words
		#if there are more syllables with ?, they will be processed, when the loop comes to the newly added variants
			#we  remove all variants with ? left: ie: we have "in nova ? ? animus
			#above, we get:
			#in nova B ? animus
			#in nova L ? animus (both in one step)
			#then, when it comes to those two, we further get:
			#in nova B B animus
			#in nova B L animus
			#in nova L B animus
			#in nova L L animus
			#and we must remove the first two added wit B ?, L ? resp.
		if m==1:
			i=0
			counter=0
			m___("loop to obtain syllable-combinations. Possible variants: "+str(len(possible_variants)))
			while i<len(possible_variants):
				pv=possible_variants[i]
				#for xpv in possible_variants:
				#	print("Před:",xpv.schema())

				#m___(str(i))
				for j in range(len(pv.syllables)):					
					if pv.syllables[j].quantity=="?":
						new=[pv.clone(),pv.clone()]
						new_sch=[]
						new[0].syllables[j].quantity="Bt"
						new[1].syllables[j].quantity="Lt"
						
						
						possible_variants.append(new[0])
						possible_variants.append(new[1]) 
						counter+=1

						
						possible_variants.pop(i)
						
						i-=1
						break
				i+=1
			m___(str(counter))

				#for xpv in possible_variants:
				#	print("Po:",xpv.schema())
		i=0
		while i<len(possible_variants):
			pv=possible_variants[i]
			pv_sc=pv.schema(True,True)
			j=i+1
			while j<len(possible_variants):
				pv2=possible_variants[j]
				pv2_sc=pv2.schema(True,True)
				if (pv_sc==pv2_sc):
					possible_variants.pop(j)
					j-=1
				j+=1
			i+=1

		if debug==True:
			print("#####","Possible variants calculated (after unknown word, muta cum liquida)","#####")
			for pv in possible_variants:
				pv.dump(False)
		
		
		m___("retrieve_possible_metrical_variants...done")
		return possible_variants
		
	def recursive(this,arr,index,combination,combinations):
		if index==0:
			combination=[0]*len(arr)
		
		if index==len(arr):
			combinations.append(combination.copy());
		else:
			for i in range(arr[index]):
				combination[index]=i
				this.recursive(arr,index+1,combination,combinations)
    
	def make_combinations(this,words):
		w_counts=[]
		for w in words:
			w_counts.append(len(w.metr))
		
		combinations=[]
		combination=[]
		
		this.recursive(w_counts,0,combination,combinations);
		
		return combinations
	
	




	def variants(this,m=1,print_as=0):
		rv=[]
		for v in this.metrical_variants:
			if m<1:
				rv.append(v.text())
			if m>0:
				if (print_as==0):
					rv.append(v.schema())
				else:
					schema_str=""
					s=v.schema()
					for f in s:
						schema_str+=f
					rv.append(schema_str)
		return rv
				
	def dump(this):
		for w in this._words:
			w.dump()
		for v in this.metrical_variants:
			v.dump()




#verse=cls_verse("Ni faciat maria ac terras caelumque profundum",1)
#verse=cls_verse("In nova fert animus mutatas dicere formas",1)
#msch=cls_metrical_schemata()
#for v in verse.variants(1,1):
#	print(msch.find_schema(v))

class options:
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

def m___(msg=""):
	#monitoring msg
	if opt.get("b") or opt.get("output")=="html":
		lb="<br/>"
	else:
		lb=""
	if opt.get("m") or opt.get("monitor"):
		if msg=="":
			msg="...done"
		msg+=lb
		print("--monitoring:",msg)
		
		
def d___(msg=""):
	if opt.get("b") or opt.get("output")=="html":
		lb="<br/>"
	else:
		lb=""
	if opt.get("d") or opt.get("debug"):
		if msg=="":
			msg="...done"
		msg+=lb
		print("##debuging:",msg)



opt=options()


msch=cls_metrical_schemata()

bx=cc.basex()

	

def run_analysis(data,output="xml"):

	if data.startswith("<"):
		xml=data
	else:
		text="<text xmlns='http://mlat.uzh.ch/2.0'>"
		for l in data.split("\n"):
			text+="<line>"+l+"</line>\n"
		text+="</text>"

		xml=bx.run(text,"get_metrical_variants.xq",False,None,True)
		
	root=ET.fromstring(xml)

	ns={"cc":"http://mlat.uzh.ch/2.0","tei":"http://www.tei-c.org/ns/1.0"}
	xml_lines=root.findall("./cc:line",ns)
	
	verses=[]
	
	
	verse_index=0
	for xml_line in xml_lines:
		if "verse_index" in xml_line.attrib:
			if xml_line.attrib["verse_index"]!="":
				verse_index=int(xml_line.attrib["verse_index"])
			else:
				verse_index+=1
		else:
			verse_index+=1
		

		xml_words=xml_line.findall("./cc:word",ns)
		if len(xml_words)>0:
			
			words=[]
			for i in range(len(xml_words)):
				xml_w=xml_words[i]
				
				metr=xml_w.findall("./cc:metr",ns)
				
				

				w=cls_word(xml_w.attrib["value"],None,True)
				
				for me in metr:
					
					w.metr.append(me.attrib["form"])
					w.lengths_set=True
				if len(metr)==0:
					w.metr.append(xml_w.attrib["value"])
					w.lengths_set=False
					
				words.append(w)
				
			
					
			v=cls_verse(words,1,True,verse_index)
		else:
			v=cls_verse("",1,True,verse_index)
		verses.append(v)
	
		

	
	m___()
		
	verses_results=[]
	rv=""

	for v in verses:
		identified=False
		verse_index=v.verse_index
		r_identified=[]
		r_not_identified=[]
		for mv in v.metrical_variants:
			schema=mv.schema(False,True)
			vocal_schema=mv.vocal_schema(False,True)
			text=mv.text()
			versetype=msch.find_schema(schema)
			versetype_abbr=msch.find_schema(schema,False)
			
			
			if (versetype!=[]):
				identified=True
				r_identified.append({"text":text,"schema":schema,"vocal_schema":vocal_schema,"verse_type":versetype[0],"verse_type_abbr":versetype_abbr[0]})
			else:
				r_not_identified.append({"text":text,"schema":schema,"verse_type":"","verse_type_abbr":""})
			
			

		if identified==True:
			verses_results.append({"identified":r_identified,"not_identified":None,"verse_index":v.verse_index})
		else:
			verses_results.append({"identified":None,"not_identified":r_not_identified,"verse_index":v.verse_index})
			
	
			
	if opt.get("b")==True or opt.get("output")=="basic":
		for r in verses_results:
			if r["identified"]==None:
				for not_identified in r["not_identified"]:
					print("Verse (not identified):",not_identified["text"],not_identified["schema"],not_identified["verse_type"])
			elif r["not_identified"]==None:
				for identified in r["identified"]:
					print("Verse (identified)::",identified["text"],identified["schema"],identified["verse_type"])
	elif opt.get("h")==True or opt.get("output")=="html":
		for r in verses_results:
			if r["identified"]==None:
				print("<p>")
				for not_identified in r["not_identified"]:
					print("<span style='color:red'>Verse (not identified):</span>",not_identified["text"],not_identified["schema"],not_identified["verse_type"],"<br/>")
				print("</p>")
			elif r["not_identified"]==None:
				print("<p>")
				for identified in r["identified"]:
					print("<span style='color:green'>Verse (identified):</span>",identified["text"],identified["schema"],identified["verse_type"],"<br/>")
				print("</p>")
	elif opt.get("output")=="xml" or opt.get("x")==True or output=="xml":
		rv+="<metrical_analysis xmlns='http://mlat.uzh.ch/2.0'>\n"
		ident1=0
		ident2=0
		not_ident=0
		for r in verses_results:
			verse_index=r["verse_index"]
			if r["identified"]==None:
				not_ident+=1
				rv+="<verse identified='false' verse_index='"+str(verse_index)+"'>\n"
				for identified in r["not_identified"]:
					rv+="<variant_assessed>\n"
					rv+="<text>"+identified["text"]+"</text>\n"
					rv+="<schema>"+identified["schema"]+"</schema>\n"
					rv+="</variant_assessed>\n"
				rv+="</verse>"
			elif r["not_identified"]==None:
				rv+="<verse verse_index='"+str(verse_index)+"'>\n"
				if len(r["identified"])==1:
					ident1+=1
				else:
					ident2+=1

				for identified in r["identified"]:
					rv+="<variant_assessed>\n"
					rv+="<text>"+identified["text"]+"</text>\n"
					rv+="<schema>"+identified["schema"]+"</schema>\n"
					rv+="<vocal_schema>"+identified["vocal_schema"]+"</vocal_schema>\n"
					rv+="<type>"+identified["verse_type"]+"</type>\n"
					rv+="<type_abbr>"+identified["verse_type_abbr"]+"</type_abbr>\n"
					rv+="</variant_assessed>\n"
				rv+="</verse>\n"

		rv+="<total_verses>"+str(len(verses))+"</total_verses>\n"
		rv+="<not_identified>"+str(not_ident)+"</not_identified>\n"
		rv+="<total_identified>"+str(ident1)+str(ident2)+"</total_identified>\n"
		rv+="<identified_unambiguous>"+str(ident1)+"</identified_unambiguous>\n"
		rv+="<identified_ambiguous>"+str(ident2)+"</identified_ambiguous>\n"
		rv+=msch.metres_as_XML()
		rv+="</metrical_analysis>\n"
	
	return rv

if sys.stdin.isatty()==False or opt.get("text")!=None: #reading from a pipeline
		
	debug=False
	debug=opt.get("d") or opt.get("debug")

	text=[]
	
	
	if opt.get("input")!="xml":
		if opt.get("text")==None:
			for l in sys.stdin:
				text.append("<line>" + l.replace("\n","") +"</line>\n")
			text="<text xmlns='http://mlat.uzh.ch/2.0'>\n"+"".join(text)+"</text>"
		
		
		m___("querying BX...")
			
		
		xml=bx.run(text,"get_metrical_variants.xq",False,None,True)
		
		m___()
		
		
		m___("parsing xml results")
	else:#we get xml already with metrical variants
		#text=opt.get("text")
		text=""
		for l in sys.stdin:
			text+=l
			
		xml=text
	analysis=run_analysis(xml)	
	print(analysis)