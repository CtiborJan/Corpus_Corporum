module namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module "http://mlat.uzh.ch/2.0" at "general_functions.xq";
declare variable $cc:mlr:=/;

declare function cc:dictionary_info($dict_name,$entries_too)
{
  
  let $d:=$cc:mlr/dictionary[name=$dict_name] return
  <dictionary>
  {
    $d/*[local-name(.)!="TEI"],$d/tei:TEI/tei:teiHeader,  
    let $entries:=for $e in $d/tei:TEI/tei:text/tei:body/tei:div/(tei:entryFree|tei:superEntry/@tei:entryFree) let $lemma:= if($e/@cc:lemma) then $e/@cc:lemma else $e/@cc:nlemma return 
    if ($e/@cc:hom) then 
      <e h="{$e/@cc:hom}">{data($lemma)}</e>
    else
      <e>{data($lemma)}</e>
    return
    (<entries count="{count($entries)}">{if ($entries_too=true()) then $entries}</entries>,
    
    <letters>{
    for $l in  $d/tei:TEI/tei:text/tei:body/tei:div/@cc:letter
    return
    
    <letter>{data($l)}</letter>}</letters>
    )
    
  }
  </dictionary>
};

declare function cc:dictionary_about($dictionary)
{
  
  let $dict:=db:open("dictionaries"),
  $d:=$dict/dictionary[name=$dictionary] return
  <about_dictionary>
  {
    $cc:accessibility,
    $d/name,
    $d/about,
    $d/author,
    $d/language1,
    $d/language2,
    $d/tei:TEI/tei:teiHeader,
    $d/tei:TEI/tei:text/tei:front,
    $d/tei:TEI/tei:text/tei:back
  }
  </about_dictionary>
};

declare function cc:accessibility($node)
{
  if ($node/accessibility) then
    number($node/accessibility)
  else
    0
};

declare function cc:lemma($node)
{
  if ($node/@cc:lemma) then
    $node/@cc:lemma
  else
    $node/@cc:nlemma
};

declare function cc:dictionary_get_entries($dict_name,$letter)
{
  let $dict:=db:open("dictionaries"),
  $d:=$dict/dictionary[name=$dict_name] return
  if (cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1) then
  (
    <dictionary>
    {
        let $entries:=for $e in $d/tei:TEI/tei:text/tei:body/tei:div[@cc:letter=$letter]/(tei:entryFree|tei:superEntry/@tei:entryFree) let $l:=$e=>cc:lemma() return 
        if ($e/@cc:hom) then 
        <e xmlns="" data-h="{$e/@cc:hom}" data-entry_id="{$e/@id}"><l>{concat($e/@cc:hom," ", data($e=>cc:lemma()))}</l><t>{if (string-length($e/data())>70) then concat(substring($e/data(),1,70),"...") else substring($e/data(),1,70)}</t></e>
        else
        <e xmlns="" data-entry_id="{$e/@id}"><l>{data($e=>cc:lemma())}</l> <t>{if (string-length($e/data())>70) then concat(substring($e/data(),1,70),"...") else substring($e/data(),1,70)}</t></e>
        return
        <entries count="{count($entries)}" xmlns="">{$entries}</entries>
    }
    </dictionary>
  )
};
declare function cc:normalize_letter($l)
{
  switch ($l)
  case "Á" case "Ä" case "À" return "A"
  case "É" case "È" case "Ë" return "E"
  case "Í" case "Ì" case "I" return "I"
  case "Ó" case "Ò" case "Ö" return "O"
  case "Ú" case "Ù" case "Ü" return "U"
  case "Ý" case "Ỳ" case "Ÿ" return "Y"
  default return $l
};

declare function cc:list_available_dictionaries()
(:web_accessible:)
{
  let 
    $dicts:=cc:list_dictionaries(),
    $av_dicts:=
      for $d in $dicts/dictionary where $d/availible="true" return
      $d/name/text()
  return 
    string-join($av_dicts,",")
};

declare function cc:list_dictionaries()

{
  let $dict:=db:open("dictionaries") return
  <dictionaries>{
  for $d in $dict/dictionary let $position:=number($d/position/data()) order by $position where cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1 return 
  <dictionary>{
    $d/name, 
    $d/language1,
    $d/language2,
    
    if (cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1) then
      <availible>true</availible>
    else
      <availible>false</availible>
    }</dictionary>
   }</dictionaries> 
};

declare function cc:get_lemma_from_query_JussenOE($text)
{
  <result_set>
  {
    attribute{"lang"}{"latin"},
    attribute{"query"}{$text},
    attribute{"wordlist_used"}{"Jussen only existing"},
    if ($text!="") then
      for $entry in db:open("latin_parses")/parses[@name="Jussen existing only"]/entry 
      let $lemma:=$entry/lemma
      where $entry/form=$text 
      group by $lemma
      return 
      <entry>
      {
        <headword>{$lemma}</headword>,
        for $e in $entry return
        (
          $e/morph_code
        )
      }
      </entry>
  }      
  </result_set>
};

declare function cc:get_lemma_from_query($text,$language,$regex)
{(:tato funkce vrátí všechna lemmata pro zadaný tvar. 
Tj. pro "canis" to vrátí lemmata canis, -is, m; cano, -ere; a canus, -a, -um:)
  <result_set>
  {
    attribute{"lang"}{$language},
    attribute{"query"}{$text},
    attribute{"regex"}{$regex},
    attribute{"wordlist_used"}{"default"},
    if ($text!="") then
      if ($regex=false()) then
      (
        for $entry in db:open(concat($language,"_parses"))/parses[@default="true"]/entry 
          let $lemma_id:=$entry/lemma_id
          where $entry/form/text()=$text 
          group by $lemma_id
          return 
          <entry>
          { 
            db:open(concat($language,"_lemmata"))/*/entry[lemma_id=$lemma_id]/*,
            for $e in $entry return
            (
                $e/morph_code
            )
          }
          </entry>      
      )
      else
      (
        for $entry in db:open(concat($language,"_parses"))/*/entry 
          let $lemma_id:=$entry/lemma_id
          where matches($entry/form/text(),$text)
          group by $lemma_id
          return 
          <entry>
          { 
            db:open(concat($language,"_lemmata"))/*/entry[lemma_id=$lemma_id]/*,
            for $e in $entry return
            (
              <single_form>
              {
                $e/morph_code,
                $e/form
              }
              </single_form>
            )
          }
          </entry> 
      )
    }
    </result_set>
};
declare function cc:get_lemma_from_query($text,$language)
{
  cc:get_lemma_from_query($text,$language,false())
};
declare function cc:get_lemma_from_query($text)
{
  cc:get_lemma_from_query($text,"latin",false())
};




declare function cc:get_one_dictionary_entry($dictionary,$entry_id)
{
 let $dict:=db:open("dictionaries"),
 $d:=$dict/dictionary[name=$dictionary]
  return 
  if (cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1) then
  (
  let $e:=
    $d/tei:TEI/tei:text/tei:body/tei:div/(tei:entryFree|tei:superEntry/tei:entryFree)[@id=$entry_id]
 
    
  return
  <dictionary_entry dictionary="{$dictionary}" entry="{$e[1]=>cc:lemma()}" hom="{$e/@cc:hom}" entry_id="{$e/@id}">{
  if ($e/parent::tei:superEntry) then 
    $e/parent::tei:superEntry
  else
    $e}</dictionary_entry>
  )
};

declare function cc:get_one_dictionary_entry($dictionary,$lemma,$hom_nr)
{
  let $lemma2:=analyze-string($lemma,"^([0-9]+)\s*(.*)")
  
  let $l:=if ($lemma2/fn:match) then $lemma2/fn:match/fn:group[@nr="2"] else $lemma,
  $h:=if ($lemma2/fn:match) then $lemma2/fn:match/fn:group[@nr="1"] else $hom_nr
  return 
  
  
  let $dict:=db:open("dictionaries"),
  $d:=$dict/dictionary[name=$dictionary]
  return 
  if (cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1) then
  (
    let $e:=
    if ($h="") then
        $d/tei:TEI/tei:text/tei:body/tei:div/(tei:entryFree|tei:superEntry/tei:entryFree)[@cc:nlemma=$l]
    else
        $d/tei:TEI/tei:text/tei:body/tei:div/(tei:entryFree|tei:superEntry/tei:entryFree)[@cc:nlemma=$l and @cc:hom=$h]
        
    return
    <dictionary_entry dictionary="{$dictionary}" entry="{$e[1]=>cc:lemma()}" hom="{$e/@cc:hom}" entry_id="{$e/@id}">{
    if ($e/parent::tei:superEntry) then 
        $e/parent::tei:superEntry
    else
        $e}</dictionary_entry>
    )
};

declare function cc:dict_language1($node)
{
  switch ($node/language1/@xml:lang)
  case "lat"
  case "la"
    return "latin"
  case "gra"
  case "grc"
    return "greek"
  default
    return ""
};

declare function cc:get_dictionary_entry($dictionaries,$query)
{
  let $o:=
  <opt>
    <dictionaries>{$dictionaries}</dictionaries>
    <query>{$query}</query>
  </opt>
  return 
  cc:get_dictionary_entry($o)
};

declare function cc:get_dictionary_entry_old($xml_options as node())
{(:k zadanému heslovému slovu získáme všechny odpovídající slovníkové záznamy:)
  let $dict:=db:open("dictionaries"),
  $query:=concat("^",replace($xml_options/query/text(),"\*",".*"),"$"),
  $dicts_to_use:=
  if ($xml_options/dictionaries/text()="all" or not($xml_options/dictionaries)) then
    $dict/dictionary[(.=>cc:dict_language1()=$xml_options/language/text()) or not($xml_options/language)]
  else
    for $d in tokenize($xml_options/dictionaries,",") return $dict/dictionary[name/text()=$d],
    $lemmata:=data($xml_options/lemmata/lemma)
    
  return 

  
  let $hits:=
  for $d in $dicts_to_use let $p:=data($d/position) order by number($p) where cc:check_accessibility($cc:accessibility,$d=>cc:accessibility())=1 return
    for $e in  $d/tei:TEI/tei:text/tei:body/tei:div/(tei:superEntry/tei:entryFree|tei:entryFree)
    let $nlemma:=lower-case($e/@cc:nlemma)
    where $e/@cc:nlemma where index-of($lemmata,$nlemma)>0 or matches($nlemma,$query) return
    <dictionary_entry dictionary_name="{$d/name}" 
    entry="{$e/@cc:nlemma}"
    hom_nr="{$e/@cc:hom}">
    {
     if (local-name($e/parent::*)!="superEntry") then
       $e
     else
       $e/parent::tei:superEntry
    }
  </dictionary_entry>
  
  return $hits
  
};
declare function cc:get_dictionary_entry($xml_options as node())
{
    let $dict:=db:open("dictionaries"),
    $query:=concat("^",replace($xml_options/query/text(),"\*",".*"),"$"),
    $dicts_to_use:=
    if ($xml_options/dictionaries/text()="all" or not($xml_options/dictionaries)) then
        $dict/dictionary[(.=>cc:dict_language1()=$xml_options/language/text()) or not($xml_options/language)]/name
    else
        tokenize($xml_options/dictionaries,","),
    $lemmata:=distinct-values(data($xml_options/lemmata/lemma))
        
    return 
    
    if (count($lemmata)>0) then  (:query nás tady už nezajímá: to musí zpracovat volající php skript; tady se pracuje jenom s lemmata :)
    (
        for $lemma in $lemmata let $lemma2:=substring-before($lemma,"*") return
            let $nlemma_attrs:=
                if (matches($lemma,".+\*$")) then
                (
                    if (matches($lemma,"^[Α-Ωα-ω]+")) then
                        db:attribute-range("dictionaries",$lemma2,concat($lemma2,"ωωω"),"nlemma")
                    else
                        db:attribute-range("dictionaries",$lemma2,concat($lemma2,"zzz"),"nlemma")
                 )   
                else
                    db:attribute("dictionaries",$lemma,"nlemma") return
                
                for $e in $nlemma_attrs/parent::* let $dict:=$e/ancestor::dictionary where index-of($dicts_to_use,$dict/name/text())>0 order by number($dict/position/data()) return
                (
                        <dictionary_entry n="true" dictionary_name="{$dict/name}" entry="{$e/@cc:nlemma}" hom_nr="{$e/@cc:hom}">
                        {
                            if (local-name($e/parent::*)!="superEntry") then
                                $e
                            else
                                $e/parent::tei:superEntry
                        }
                        </dictionary_entry>
                )
    )
};

declare function cc:load_dictionary($filename)
{
    
};

declare function cc:optimize_dictionaries()
{(: v databázi "dictionaries" využíváme index nad atributem nlemma pro rychlé vyhledávání hesel v jednotlivých slovnících; momentálně nic dalšího;
 Asi bude záhodno tuto operaci provést vždy po nějaké změně v DB:)
 
    db:optimize("dictionaries",false(),map{"attrindex": true(),"attrinclude":"*:nlemma"})
};

(:##############################################################################:)
(:############################ DICTIONARY LOOKUP ###############################:)
(:##############################################################################:)


declare function cc:dictionary_lookup($options)
{(:dostaneme lemmata (ty si musíme zjistit v MySQL) a vrátíme slovníkové záznamy:)
 
  let $opt:=if (namespace-uri($options)!=$cc:ns) then 
    cc:change-element-ns-deep($options,$cc:ns,"")
  else
    $options
  
  let $entries:=cc:get_dictionary_entry($opt) 
  
  return
   
    
  
  <dictionary_lookup_result query="{$opt/query}" lemmata="{count($opt/lemmata/lemma)}">
  {
    <dictionaries_used d="{$opt/dictionaries/text()}">
    {
      let 
        $allowed:=tokenize($opt/dictionaries/text(),","),
        $really_used:=
          for $dict in distinct-values($entries/@dictionary_name) return $dict
      return
      (:we will order the list of used dictionaries acording to the order we were given by the client...:)
      if ($allowed!="all") then
      (
        for $a in $allowed where index-of($really_used,$a)>0
        return
          <dictionary>{$a}</dictionary>
      )
      else
      (
       for $ru in $really_used
        return
          <dictionary>{$ru}</dictionary>
      )
    }
    </dictionaries_used>,

    $entries,
    $opt
  }
  </dictionary_lookup_result>
};
