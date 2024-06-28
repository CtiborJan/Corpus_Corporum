module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "log.xq","get_sentence.xq","text_manipulation.xq","general_functions.xq" ;
declare variable $cc:debuging:=false();

(:************** 1 ***************:)
declare updating function cc:load($options_orig)
{
  (: Loading of a text starts.:)
  (:nejprve si zkontrolujeme, že máme všechny informace, případně použijeme defaultní:)
  file:append(concat($cc:home_folder,"/ccadmin/logs/text_loading_BX.txt"),
  concat("
  ","Started loading of text ",$options_orig/text_cc_idno/text()," at ",adjust-dateTime-to-timezone(current-dateTime()))),
  let $sentence_break_rules:=
  <sentence_break_rules>
      <rule><before> [cCkK]al\.$</before></rule>
      <rule><before> Id\.$</before></rule>(:Non pro nonis lze jen sotva...:)
      <rule><before> ms\.$</before></rule>
      <rule><before> [cC]ap\.$</before></rule>
      <rule><before>Cap\.$</before></rule>
      <rule><before> X?L?I?X{0-3}?V?I{1-3}\.$</before></rule>
      <rule><before> v\.$</before></rule> (: vide :)
      <rule><before> M\.$</before></rule>
      <rule><before> Cn\.$</before></rule>
      <rule><before> Gn\.$</before></rule>
      <rule><before> T\.$</before></rule>
      <rule><before> Ti\.$</before></rule>
      <rule><before> V\.$</before></rule>
      <rule><before> L\.$</before></rule>
      <rule><before> Sex\.$</before></rule>
      <rule><before> C\.$</before></rule>
      <rule><before> G\.$</before></rule>
      <rule><before> Sp\.$</before></rule>
      <rule><before> S\.$</before></rule>
      <rule><before> P\.$</before></rule>
      <rule><before>{concat(" M","'","\.$")}</before></rule>
      <rule><before> A\.$</before></rule>
      <rule><before> Au\.$</before></rule>
      <rule><before> Aul\.$</before></rule>
      <rule><before> App\.$</before></rule>
      <rule><before> D\.$</before></rule>
      <rule><before> Mam\.$</before></rule>
      <rule><before> N\.$</before></rule>
      <rule><before> Mam\.$</before></rule>
      <rule><before> Ser\.$</before></rule>
      <rule><before>[ (]Ge?n(es)?\.$</before></rule>
      <rule><before>[ (]Ex\.$</before></rule>
      <rule><before>[ (]Num\.$</before></rule>
      <rule><before>[ (]Le?v\.$</before></rule>
      <rule><before>[ (]Jos\.$</before></rule>
      <rule><before>[ (]Jdc?\.$</before></rule>
      <rule><before>[ (][1-4]?Re?g\.$</before></rule>
      <rule><before>[ (][1-2]?Par\.$</before></rule>
      <rule><before>[ (]Esr\.$</before></rule>
      <rule><before>[ (]Ne?h\.$</before></rule>
      <rule><before>[ (]To?b\.$</before></rule>
      <rule><before>[ (][JI]dt\.$</before></rule>
      <rule><before>[ (]Est\.$</before></rule>
      <rule><before>[ (][IJ]ob\.$</before></rule>
      <rule><before>[ (]Ps(al)?\.$</before></rule>
      <rule><before>[ (]Pr\.$</before></rule>
      <rule><before>[ (]Ecc?l\.$</before></rule>
      <rule><before>[ (]Ecc\.$</before></rule>
      <rule><before>[ (]Ecc?li\.$</before></rule>
      <rule><before>[ (]Sir\.$</before></rule>
      <rule><before>[ (]Ct\.$</before></rule>
      <rule><before>[ (]Sa?p\.$</before></rule>
      <rule><before>[ (][JI]e?r\.$</before></rule>
      <rule><before>[ (]Lam\.$</before></rule>
      <rule><before>[ (]Bar\.$</before></rule>
      <rule><before>[ (]Ez\.$</before></rule>
      <rule><before>[ (]Da?n\.$</before></rule>
      <rule><before>[ (]Os\.$</before></rule>
      <rule><before>[ (]Abd\.$</before></rule>
      <rule><before>[ (][JI]on\.$</before></rule>
      <rule><before>[ (]Mch\.$</before></rule>
      <rule><before>[ (]Nah\.$</before></rule>
      <rule><before>[ (]Hab\.$</before></rule>
      <rule><before>[ (]Soph\.$</before></rule>
      <rule><before>[ (]Agg\.$</before></rule>
      <rule><before>[ (]Zach\.$</before></rule>
      <rule><before>[ (]Mal\.$</before></rule>
      <rule><before>[ (][12]?Mcc\.$</before></rule>
      <rule><before>[ (][12]?Mac\.$</before></rule>
      <rule><before>[ (]Mt\.$</before></rule>
      <rule><before>[ (]Math\.$</before></rule>
      <rule><before>[ (]Mc\.$</before></rule>
      <rule><before>[ (]Marc\.$</before></rule>
      <rule><before>[ (]Lc\.$</before></rule>
      <rule><before>[ (][IJ]o\.$</before></rule>
      <rule><before>[ (][IJ]oan\.$</before></rule>
      <rule><before>[ \[(]Act\.$</before></rule>
      <rule><before>[ (][12]?Cor\.$</before></rule>
      <rule><before>[ (]Gal(at)?\.$</before></rule>
      <rule><before>[ (]Eph(es)?\.$</before></rule>
      <rule><before>[ (]Phlp\.$</before></rule>
      <rule><before>[ (]Phil\.$</before></rule>
      <rule><before>[ (]Col\.$</before></rule>
      <rule><before>[ (][12]?Thes\.$</before></rule>
      <rule><before>[ (][12]?Tim\.$</before></rule>
      <rule><before>[ (]Tit\.$</before></rule>
      <rule><before>[ (]Phlm\.$</before></rule>
      <rule><before>[ (]Hbr\.$</before></rule>
      <rule><before>[ (][IJ]ac\.$</before></rule>
      <rule><before>[ (][12]Ptr\.$</before></rule>
      <rule><before>[ (][1-3][IJ]o\.$</before></rule>
      <rule><before>[ (]Ju?d\.$</before></rule>
      <rule><before>[ (]Apc\.$</before></rule>
      <rule><after>^[)\]]$</after></rule>
  </sentence_break_rules>
  return
  let $options1:=
    if (not($options_orig/sentence_break_rules)) then
      $options_orig transform with {insert node $sentence_break_rules into .}
    else
      $options_orig return 
  
  
  let $options2:=
    if ($options1/sentence_closing_elements/text()="" or not($options1/sentence_closing_elements)) then
      $options1 transform with {insert node <sentence_closing_elements>div,p,lg,head,argument,item,list</sentence_closing_elements> into .}
    else
      $options1 return
  
  
  (:teoreticky může být v jednom dokumentu více textů: pak by měl být kořenový element teiCorpus a jednotlivé elementy být v samostatných TEI. A v TEI může pak být krom teiHeader a text a v něm body ješte front (úvodní text) a back ("doslov"). V text může být ještě leccos dalšího, ale zatím počítejme s variantami body, front, back:)
   let 
   $text_cc_idno:=$options_orig/text_cc_idno/text(),
   $XML_file:=$cc:root/cc_texts/item[data(cc_idno)=$text_cc_idno]/xml_file_path,
   $options3:=$options2 transform with {insert node <file>{$XML_file}</file> into .}
   
   return
   
   (
   (:zjistíme si, jestli nahráváme celý text, nebo jen část XML dokumentu:)
     
     
     let $anchor_SA:=fn:analyze-string($XML_file,"\?(.+)") return
     let $path:=$anchor_SA/fn:non-match return
     let $anchor:=$anchor_SA/fn:match/fn:group/text() return
     (:pokud nahráváme celý dokument...:)
     let $document:=doc($path) return
     let $teiCorpus:=$document/tei:teiCorpus return 
     if ($teiCorpus) then (:více corpusů:)
       ()
     else (:pokud je v souboru jen jeden text:)
     (
       
       
       if (cc:has_tei_namespace($document/*)=false()) then
       (
         error(QName("http://mlat.uzh.ch/2.0","error"),concat("Namespace error: no elements in the TEI namespace (http://www.tei-c.org/ns/1.0) found. Check file ",$options2/file))
       )
       else
       (
         let $TEI:=$document/tei:TEI return
         let $teiHeader:=$TEI/tei:teiHeader,
         $teiText:=
         if (normalize-space($anchor)="") then(:we load whole the file:)
         (
           if (count($TEI/tei:text)>0) then
             $TEI/tei:text
           else
              error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: no tei:text element. Check file ",$options2/file))
         )
         else(:we only load part of the file:)
           cc:get_normalized_fragment($TEI,$anchor)/tei:text
           
         return
         (:varianty: TEI/text/front,body,back; TEI/group/text/...; TEI/(group)/text/body1,body2...:)
         (:zjistíme si, jestli soubor nemá nějaké zvláštní cc nahrávací nastavení:)
         let $options:=cc:adjust_options_from_text_header($options2,$teiHeader)
         return
         let $loaded_text:=
         <cc:text>
         {
         for $text at $i in $teiText return
           if (count($teiText)>1) then(:if there is more tei:text elements under the TEI, they will be numbered with I, II, III...:)
             cc:process_single_TEI_text($text,<options>{$options/*[./name()!="prefix"],<prefix>{concat($text_cc_idno,":",cc:roman($i))}</prefix>}</options>)
           else(:if there is only one tei:text, the roman numbering will be ommited:)
             cc:process_single_TEI_text($text,<options>{$options/*[./name()!="prefix"],<prefix>{concat($text_cc_idno,":")}</prefix>}</options>)
  
         }
         </cc:text> return

          let $loaded_node:=<cc:tdata xmlns="http://www.tei-c.org/ns/1.0" xmlns:cc="http://mlat.uzh.ch/2.0" cc:idno="{$text_cc_idno}"><cc:cc_idno>{$text_cc_idno}</cc:cc_idno><cc:header>{$teiHeader}</cc:header>{$loaded_text}</cc:tdata> 
          return
           (
              if ($loaded_node) then
              (
               
                 if ($cc:debuging=true()) then
                   $loaded_node
                 else
                 (
                   cc:insert_tdata($text_cc_idno,$loaded_node,$options/log_ticket/text()),
                 (: $loaded_node :)
                   cc:xq_result(concat("Text ",$text_cc_idno, " nahrán."),"ok","cc:load()")
                 )
              )
           )
         ) 
       )
     ),
     file:append(concat($cc:home_folder,"/ccadmin/logs/text_loading_BX.txt"),"...finished")
};
(:*********** 1.2 *********:)
declare function cc:get_normalized_fragment($TEI,$anchor)
{
  let $t:=xquery:eval(concat("declare namespace tei='http://www.tei-c.org/ns/1.0';declare variable $t external;$t",$anchor),map{'t':$TEI})
  return
  if (matches(local-name($t),"^div")) then
    <TEI xmlns='http://www.tei-c.org/ns/1.0'><text><body>{$t}</body></text></TEI>  
  
};
declare function cc:adjust_options_from_text_header($options,$teiHeader)
{
  copy $options2:=$options modify
  (
    if ($teiHeader//loading_options/sentence_break_rules) then
    (
      if ($teiHeader//loading_options/sentence_break_rules/@add="true") then
      (
        for $nsbr in $teiHeader//loading_options/sentence_break_rules/rule return
        insert node $nsbr as last into $options2/sentence_break_rules
      )
    )
  )return $options2
};
(:*********** 2 ***********:)
declare function cc:process_single_TEI_text($text,$options)
{(:zpracování elementu tei:text, který může mít tei:body, anebo tei:group s dalšími tei:text:)
    let $prefix:=$options/prefix/text(),
    $options2:=
    if ($options/paratext_elements/text()="" or $options/paratext_elements/text()="auto") then
      $options transform with {replace value of node paratext_elements with cc:analyze_paratext_elements($text)}
    else if (not($options/paratext_elements)) then
      $options transform with {insert node <paratext_elements>{cc:analyze_paratext_elements($text)}</paratext_elements> into .}
    else
      $options,
         
     $has_front_or_back:=count($text/tei:front)+count($text/tei:back) return
     (
       let $front:=cc:load_text($text/tei:front,<options>{$options2/*[./name()!="prefix"],<prefix>{cc:concat($prefix,"F.")}</prefix>,<has_front_or_back>{$has_front_or_back}</has_front_or_back>}</options>) return
       (
         let $back:=cc:load_text($text/tei:back,<options>{$options2/*[./name()!="prefix"],<prefix>{cc:concat($prefix,"Bck.")}</prefix>,<has_front_or_back>{$has_front_or_back}</has_front_or_back>}</options>) return
         (
           let $body_or_group:=cc:load_body_or_group($text,<options>{$options2/*[./name()!="prefix"],<prefix>{$prefix}</prefix>,<has_front_or_back>{$has_front_or_back}</has_front_or_back>}</options>)
            return
            (
         if ($body_or_group | $back | $front) then
         (
          element {QName("http://www.tei-c.org/ns/1.0","text")}{attribute cc:pid{cc:adjust_higher_level_id($prefix,1)},$front,$back,$body_or_group}
         )
       )
     )
   )     
 )
};



(:************** 3 ************:)
declare function cc:load_body_or_group($text,$options)
{(:tei:text může sestávat z front+back a body, anebo group, který pak sestává ze samostatných text:)

  if (count($text/tei:body)=1 and count($text/tei:group=0)) then
  (
    if (count($text/tei:body//tei:text)>0 or count($text/tei:body//tei:group)>0) then
      error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: tei:text or tei:group element inside of tei:body. Check file ",$options/file))
    else
      if (data($options/has_front_or_back)>0) then
        cc:load_text($text/tei:body,<options>{$options/*[local-name(.)!="prefix"],<prefix>{cc:concat($options/prefix/text(),"B.")}</prefix>}</options>) (:the "bd" path identifier we add only when there are tei:front or tei:back elements present:)
      else
        cc:load_text($text/tei:body,$options)      
  )
  
  (:loading of a tei:group element:)
  else if (count($text/tei:body)=0 and count($text/tei:group)=1) then
  (
    if (count($text/tei:group/tei:text)=0) then
      error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: missing tei:text inside tei:group element. Check file ",$options/file))
    else
      <tei:group cc:pid="{cc:adjust_higher_level_id($options/prefix/text(),1)}">
      {
        for $text_in_group at $i in $text/tei:group/tei:text return
        cc:process_single_TEI_text($text_in_group,<options>{$options/*[not(local-name(.)="prefix")],<prefix>{concat($options/prefix/text(),cc:roman($i))}</prefix>}</options>)
      }
      </tei:group>
  )
  else if (count($text/tei:body)=0 and count($text/tei:group=0)) then
  (
    error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: no tei:body or tei:group. Check file ",$options/file))
  )
  else if (count($text/tei:body>1)) then
  (
    error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: more tei:body elements in one tei:text. Use tei:group. Check file ",$options/file))
  )
  else
    error(QName("http://mlat.uzh.ch/2.0","error"),concat("TEI error: some other error. Check file ",$options/file))
    
};




(:************** 4 ************:)
declare function cc:load_text($text,$options)
{(:nahrávání už skutečně textových dat: prvku body, front, back...:)
  if ($text) then
  (
    
  let $el_to_mask:=cc:get_paratext_elements($text,$options/paratext_elements/text())
  return
  let $transform1:=cc:mask_paratext_elements($text,$options/paratext_elements/text())
  return
  let $transform2:=cc:normalize_divs($transform1)
  return
  let $transform3:=cc:numerate_hierarchy($options/text_cc_idno/text(),$options/prefix/text(),$transform2)
  return
  let $transform4:=cc:insert_sentence_tags($transform3)
  return 
  let $transform5:=cc:insert_sentence_tags_in_sc_elements($transform4,$options/sentence_closing_elements/text())
  return 
  let $transform5-2:=cc:insert_sentence_tags_after_sc_elements($transform5,$options/sentence_closing_elements/text())
  let $transform6:=cc:delete_empty_sentences($transform5-2)
  return 
  let $transform7:=cc:normalise_sentences($transform6)
  return
  let $transform8:=cc:normalise_sentences_2($transform7)
  return 
  let $transform9:=cc:delete_empty_sentences($transform8)
  return
  let $transform10:=cc:numerate_sentences($transform9,$options)
  return
  let $transform11:=cc:unmask($el_to_mask,$transform10,$options) 
  return
  $transform11
  )
};

declare function cc:analyze_paratext_elements($text)
{
  if ($text/@cc:paratext_elements) then
    $text/@cc:paratext_elements
  else
  (  
    let $lem:=count($text//tei:lem) return
      if ($lem=0) then
        "app,rdg,note,bibl,ref"
      else
        "rdg,note,bibl,ref"
  )    
};


declare function cc:has_tei_namespace($element)
{(:this function checks, if there is a tei namespace:)
  let $prefixes:=in-scope-prefixes($element) return
  let $ns:=for $prefix in $prefixes return
    namespace-uri-for-prefix($prefix,$element)
  return
  if (index-of($ns,"http://www.tei-c.org/ns/1.0")>=0) then
    true()
  else 
    false()
};


declare function cc:insert_sentence_tags($parent)
{ (:Other possibilities to manage, where cc:s wil or will not be added:
insert cc:s into the XML manually (they will be preserved and used together with the inserted ones)
insert <cc:fs/>, <cc:qm/> or <cc:em/> or <cc:ddd/> instead of the characters .?!... This elements will
not be seen as sentence breaks, but in the displayed text, they will be replace with their respective characters
:)
  element {node-name($parent)}{$parent/@*,
  for $ch in $parent/node() return
    if (count($ch/node())>0) then
      cc:insert_sentence_tags($ch)
      (:=pokud má prvek pod sebou nějaký další prvek,nebude to text. Rekurzivně ho zpracujeme:)
    else 
      if (data($ch)="")then(:samozavírací element - ten vrátíme celý:)
        $ch
      else(:text - ten rozdělím:)
        let $sentences:=analyze-string($ch,"[^ ]?[.?!]+")(:najdeme si tečku atd. ale pouze pokud jim nepředchází mezera - jinak bychom skončili ve zmatku jako u Frontona, kde byly vynechávky značeny " . . . .":)
        return
        copy $result:=cc:strip-ns($sentences)(:odstraníme zbytečné namespacy:)
        modify(
          for $s at $i in $result/* return
          if (local-name($s)="match") then (: a upravíme rozdělený text (v tohle chvíli i s elementy vzešlými z funkce analyze-string:)
          (
            insert node <cc:s xmlns="http://www.tei-c.org/ns/1.0"/> after $s(:za každý konec věty vložíme tag <s/>:)
          )
        )return
        for $result_item in $result/* return 
          if (local-name($result_item)="match") then(:teď si vytahéme text ze zachycených sekvencí:)
            ($result_item/text())
          else if(local-name($result_item)="non-match") then
            ($result_item/text())
          else
          $result_item(:a všechno mezi nimi (tagy s) vrátíme, jak je
          Výsledkem tedy je text, kde je za každou tečkou apod. tag pro zlom věty:)
      }
};

declare function cc:get_paratext_elements($element,$paratext_elements_str)
{
  let $paratext_elements:=tokenize($paratext_elements_str,",") return
  (:funkce vrátí sekvenci elementů určených k zamaskování:)
  <tei:masked>{
    for $ch at $i in $element//* where (index-of($paratext_elements,string(local-name($ch)))>0  
    or $ch/@cc:is_paratext="true") (:the @cc:is_paratext allowes to include/exclude any element amog the paratext elements:)
    return
    <nr n="{$i}">{$ch}</nr>
  }</tei:masked>(::)
  
  
};
declare function cc:get_paratext_elements($element)
{
  
  (:funkce vrátí sekvenci elementů určených k zamaskování:)
  <tei:masked>{
    for $ch at $i in $element//*[@cc:paratext]
    return
      <nr n="{$i}">{$ch}</nr>
  }</tei:masked>
  
  
};
declare function cc:mask_paratext_elements($element,$paratext_elements_str)
{
  if (count($element)>1) then
  (
    let $el_names:=for $e in $element return string(local-name($e))
    return
    error(QName("http://mlat.uzh.ch/2.0","error"),concat("$element in cc:mask:paratext_elements is not a single node: ",count($element),": ",string-join($el_names," ")))
  ),
  let $paratext_elements:=tokenize($paratext_elements_str,",") return
  (:"funkce zamaskuje elementy určené k zamaskování..." :)
  copy $pure_element:=$element
  modify (
    for $ch at $i in $pure_element//* where index-of($paratext_elements,string(local-name($ch)))>0
    return
      if ($ch/following-sibling/node()[1]/text()=" ") then
        replace node $ch with <cc:masked_element n="{$i}" space_after="true"/>
      else
        replace node $ch with <cc:masked_element n="{$i}" space_after="{$ch/following-sibling/node()[1]/text()}"/>
  )
  return $pure_element
  
  
};
declare function cc:mask_paratext_elements($element)
{
  if (count($element)>1) then
  (
    let $el_names:=for $e in $element return string(local-name($e))
    return
    error(QName("http://mlat.uzh.ch/2.0","error"),concat("$element in cc:mask:paratext_elements is not a single node: ",count($element),": ",string-join($el_names," ")))
  ),
  
  (:"funkce zamaskuje elementy určené k zamaskování..." :)
  copy $pure_element:=$element
  modify (
    for $ch at $i in $pure_element//*[@cc:paratext] return
      if ($ch/following-sibling/node()[1]/text()=" ") then
        replace node $ch with <cc:masked_element n="{$i}" space_after="true"/>
      else
        replace node $ch with <cc:masked_element n="{$i}" space_after="{$ch/following-sibling/node()[1]/text()}"/>
  )
  return $pure_element
  
  
};

declare function cc:unmask($masked_elements,$node,$options)
{
  let $semi_paratext:=tokenize($options/semi_paratext_elements/text(),",") return (:semi_paratext_elements: they will not be send to sphinx indexer (as "true" paratext),
  but will be displayed in the text. E. g.: <head>Epist. 1 (<date year='-33'>33 BC</date>)</head> - in such a case, if <date> was a true paratext, the displayed text would
  be: Epist. 1 () - what is not good. But we don't want to index the "33 BC" for full-text search. So we use the "semi_paratext" option:)
  copy $node2:=$node
  modify(
  for $masked in $node2//cc:masked_element return
    let $masked_element:= $masked_elements/nr[@n=$masked/@n]/* return
      let $paratext_str:=
      if (index-of($semi_paratext,local-name($masked_element))>-1) then
        "semi"
      else
        "true"
        
      return
      replace node $masked with element {QName("http://www.tei-c.org/ns/1.0",local-name($masked_element))}
      {attribute cc:paratext{$paratext_str}, $masked_element/@*,$masked_element/node()}
  )
  return $node2
};
declare function cc:unmask($masked_elements,$node)
{
  
  copy $node2:=$node
  modify(
  for $masked in $node2//cc:masked_element return
    let $masked_element:= $masked_elements/nr[@n=$masked/@n]/* return
      replace node $masked with $masked_element
  )
  return $node2
};


declare function cc:insert_sentence_tags_after_sc_elements($parent_node,$elements_str)
{
   let $elements:=tokenize($elements_str,",") return
   copy $new_node:=$parent_node modify
   (
     for $el in $new_node//* where index-of($elements,local-name($el))>0 return
     (
        insert node <cc:s/> after $el 
     )
  )
  return $new_node
};
declare function cc:insert_sentence_tags_in_sc_elements($parent_node,$elements_str)
{(:některé elmenty vždy ukončují větu, bez ohledu na to, zda končí tečkou, nebo ne:
třeba (typicky) div, p, lg apod. - na jejich konec i začátek tedy vložíme příslušný tag pro 
zlom věty:) 
  copy $new_node:=$parent_node modify
  (
 
   let $elements:=tokenize($elements_str,",") return
   
   for $n in $new_node//* let $ename:=local-name($n) where index-of($elements,$ename)>0 return 
    (
     insert node <cc:s/> as first into $n,
     insert node <cc:s end="true"/> as last into $n
    )
   
  )
  return $new_node
};


declare function cc:delete_empty_sentences($parent_node)
{(:funkce, která odstraní přebytečné cc:s - takové, které začínají prázdnou větu:)
copy $parent_node2:=$parent_node modify
 (
  for tumbling window $sentence in $parent_node2//node()[(string(node-name(.))="cc:s" or (data(.)!="" and count(./child::*)=0))]
    start $ss when string(node-name($ss))="cc:s"
   
    return
      let $s:= normalize-space(string-join($sentence)) return
       if ($s="" or matches($s,"^[.)(\[\]]$")) then
      (: if (not($ss/@delete)) then insert node (attribute delete {"true"}) into $ss :)
         delete node $ss
    )return $parent_node2
   
};

declare function cc:delete_hyphentation($parent_node)
{(:funkce, která odstraní rozdělení slov:)
copy $parent_node2:=$parent_node modify
 (
   for $te in $parent_node2//node()[local-name(.)=""] 
     let $words:= for $w in tokenize($te) return <w>{$w}</w> return replace node $te with $words
    
    
 )
 return
 copy $parent_node3:=$parent_node2 modify
 (
   let $words:=$parent_node3//w return
   for $w at $i in $words return
   (
      if (matches($w/text(),"-[\s\t\n\r]*$")) then
      (
        replace value of node $w with concat($words[$i],$words[$i+1]), delete node $words[$i+1]
      )
   )
   
 )
 return 
 copy $parent_node4:= $parent_node3 modify
 (
   
 )
 return $parent_node4
   
};
declare function cc:get_first_word($text)
{
  analyze-string($text,"^[\s\t\n\r]*([^\s$]+)")/fn:match/fn:group/text()
};
declare function cc:strip_first_word($text)
{
  analyze-string($text,"^[\s\t\n\r]*([^\s$]+)")/fn:non-match/text()
};

declare function cc:last_ancestors_pid($s)
{
  if ($s/parent::*/@cc:pid) then
  (
    $s/parent::*/@cc:pid
  )
  else
    if ($s/parent::*) then
      cc:last_ancestors_pid($s/parent::*)
};



declare function cc:numerate_sentences($element,$options)
{
  copy $el:=$element modify(:nejprve si označíme všechny věty úrovní, na kterou patří (tj. @pid jejich nejbližšího "kontajnerového" rodiče:)
  (
    for $s in $el//s return
      insert node (attribute parent_pid {cc:last_ancestors_pid($s)}) into $s
  ) return
  
  copy $el2:=$el modify(:při té příležitosti zkonrolujeme výjimky z rozdělení vět:)
  (
    let $sb_rules:=(:tady máme pravidla, zadaná jako regulérní výrazy - budou se ověřovat pomocí matches:)
    $options/sentence_break_rules return 
     for $d in $el2//*[@cc:pid (: and count(.//*[@cc:pid])=0 :)] return(:vytaháme si věty pomocí tumbling window, které končí vždy na cc:s:)
     (     
       (: error(QName("http://mlat.uzh.ch/2.0","error"),string(count($sb_rules/rule))), :)
       for tumbling window $sentence in $d//node()[(string(node-name(.))="cc:s" or (data(.)!="" and count(./child::*)=0))]
       start $ss when true()(:string(node-name($ss))="cc:s":)
       end $es when string(node-name($es))="cc:s"
        return
        
        let $matches:=
           for $rule at $i in $sb_rules/rule return(:teď projedeme všechna pravidla a uložíme si výsledek:)
           (
             if ($rule/before) then
             (  
            
               if (matches(string-join(data($sentence)),$rule/before/text())) then
                 true()
               else
                false() 
             )
             else if ($rule/after) then
             (
               if (matches(string-join($es/following-sibling::node()[1]=>data()),$rule/after/text())) then
                 true()
               else
                false() 
             ) 
           )
             return 
             if (matches(string-join(data($sentence)),"^\s+\.+$") or (count($matches)>0 and index-of($matches,true())>-1 and not($es/@end))) then(:pokud nějaká pravidla jsou a nějaký výsledek je true, pak koncový element cc:s odstraníme:)
             (
                (:insert node (attribute matches {string-join(data($matches))}) into $es:)
               delete node $es
             )
             (: else
               if (local-name($es)="s") then
                 insert node <f>{string-join($es/following-sibling::node()[1]=>data())}</f> into $es :)
      )
    
  )return
  
  copy $el3:=$el2 modify(:pak je podle toho očíslujeme a tu informaci o @pid rodiče smažeme:)
  (
    for $d in $el3//*[@cc:pid] return
      for $s at $i in $d//s where $s/@parent_pid=$d/@cc:pid return
        (
          insert node (attribute n {$i}) into $s,
          if ($s/ancestor::tei:l) then 
          insert node (attribute verse {"true"}) into $s
        )
  )return $el3
  
};


declare function cc:normalise_sentences_2($parent_node)
{(:přesune tagy cc:s těsně před začátek textu, ke kterému patří 
(jinak jsou hned za koncem předchozí věty):)
 copy $n:=$parent_node modify
  (
    for tumbling window $w in $n//node()
      start $ss when string(node-name($ss))="cc:s" and not($ss/@end)
      end $se when string(local-name($se))="" and normalize-space(data($se))!="" and not($se/ancestor::*[@cc:paratext])
      
      return
      (insert node $ss before $se,delete node $ss)
  )
  return $n
};
declare function cc:normalise_sentences($parent_node)
{(:tato funkce je určena pro případy, kdy se např. elementy <l> objevují bez <lg>
Jiná fce přidá totiž tagy cc:s na konec a začátek určitých tagů (divy, p, head, lg), ale když lg není, není kam přidat. A <l> mezi takovými tagy být nemůže, protože by 
pak nová věta začínala v každém verši, což nechceme. A nastane-li případ např.: 
<head>Nějaký text</head>
<l>verše verše verše</l>...,
pak se na konci head ocitne tag cc:s s @end, ale už se neobjeví tag na začátku <l></l>.
A to právě zařídí tato fce: prochází v oknech text, okno začíná, když narazí na cc:s s @end a končí, když narazí na textový uzel nebo další cc:s. Pokud je to druhý případ, neděje se nic, pokud je to ale první případ, tj. dřív než cc:s se objeví text, přidá to nový cc:s:)
 
 copy $n:=$parent_node modify
  (
    for tumbling window $w in $n//node()
      start $ss when string(node-name($ss))="cc:s" and $ss/@end="true"
      only end $se when (string(node-name($se))="l")
      return
        
        insert node <cc:s/> as first into $se
          
    (: for $l in $n//tei:l where string(node-name($l/preceding::*[1]))!="l" return
    insert node <o>{ string(node-name($l/preceding::*[1]))}</o> as first into $l :)
  )
  return $n
};


declare updating function cc:lemmatise($element)
{
   let $sentences:=cc:get_all_sentences($element) return
   let $output:=
   (
     for $sent in $sentences return
       if (normalize-space($sent/text())!="") then
         concat(" <sl pid='",$sent/@cc:pid,"'/> ",$sent/text())
   )return file:write-text(concat($cc:home_folder,"/lemmatiser/stream.txt"),string-join($output)),
   
   let $l:=parse-xml(fetch:text(concat($cc:server_url,"/ccadmin/lemmatiser.php")))/cc:result return
   
   copy $element2:=$element modify
   (
     for $s_gr in $element2//cc:s group by $pid:=$s_gr/@parent_pid return 
     (
       let $lemmatized_div:=$l/cc:div[@pid=$pid] return
       for $s in $s_gr return
        let $n:=$s/@n
        return
         let $sl:=$lemmatized_div/cc:sl[@n=$n],
         $ccwl:=for $wl in $sl/wl return
         (
           <cc:wl>{$wl/@*}</cc:wl>
         ) return 
          insert nodes $ccwl into $s
     )
   )return $element2
  (:<a>{count ($l/cc:result/cc:sl)}</a>:)
};




declare updating function cc:normalize_divs($node)
{
  copy $node2:=$node modify
  (
    for $div in $node2//* where local-name($div)="div1" or local-name($div)="div2" or local-name($div)="div3" or local-name($div)="div4" or local-name($div)="div5" or local-name($div)="div6" or local-name($div)="div7"
        return
      rename node $div as QName("http://www.tei-c.org/ns/1.0","div")
  )return $node2
  
  (:
  for $div in $node/node() return
    typeswitch ($div)
    case element(tei:div1) | element(tei:div2) | element(tei:div3) | element(tei:div4) | element(tei:div5) return
      <div xmlns="http://www.tei-c.org/ns/1.0" xmlns:cc="http://mlat.uzh.ch/2.0">{$div/@*,cc:normalize_divs($div)}</div>
    default return
      $div:)

};



declare updating function cc:numerate_hierarchy($cc_idno,$text_type_prefix, $body)
{ (:$text_type_prefix: f pro front, b pro back, nic pro body:)
   
   
  copy $body2:=$body modify
  (
    cc:index_divs($body2,$text_type_prefix)
  )return
  
  cc:index_second_level_elements($body2)
  
};


declare function cc:adjust_higher_level_id($higher_level_id,$mode)
{
  if ($mode=0) then
  (
    if (ends-with($higher_level_id,":")=false() and (ends-with($higher_level_id,".")=false())) then
      concat($higher_level_id,".")
    else
      $higher_level_id
  )
  else if ($mode=1) then
  (
    (: error (QName("","e"),$higher_level_id,"(.+)[.:;,]$")/fn:match/fn:group/text()), :)
    analyze-string($higher_level_id,"^(.+?)[.:;,]?$")/fn:match/fn:group/text()
  )
   else if ($mode=2) then
  (
    (: error (QName("","e"),$higher_level_id,"(.+)[.:;,]$")/fn:match/fn:group/text()), :)
    analyze-string($higher_level_id,"^(.+?)[.:;,]?$")/fn:match/fn:group/text()
  )
};


declare updating function cc:index_divs($node,$higher_level_id)
{
  let $higher_level_id2:=cc:adjust_higher_level_id($higher_level_id,0) return
  if (local-name($node)="body" or local-name($node)="front" or local-name($node)="back") then(
     
       insert node attribute cc:pid {cc:adjust_higher_level_id($higher_level_id,1)} into $node,
     if (count($node/tei:Xdiv)>0) then
      for $div at $i in $node/(tei:div) return
        (
            insert node attribute cc:pid {concat($higher_level_id2,$i)} into $div,
            cc:index_divs($div,concat($higher_level_id2,$i))
        )
    else 
      for $el in $node/* where data($el)!="" count $i return
        (
            insert node attribute cc:pid {concat($higher_level_id2,$i)} into $el,
             cc:index_divs($el,concat($higher_level_id2,$i))
          
        )
  )
  else(
    for $div at $i in $node/(tei:div,tei:body,tei:front,tei:back) return
    (
        insert node attribute cc:pid {concat($higher_level_id2,$i)} into $div,
        cc:index_divs($div,concat($higher_level_id2,$i))
    )
    
  )
};


declare updating function cc:index_second_level_elements($element)
{(:očísluje p a lg a head:)
  copy $el:=$element modify
  (
        
    for $s in $el//(tei:p|tei:lg|tei:head|tei:list) return
    
      insert node (attribute parent_pid {cc:last_ancestors_pid($s)}) into $s
  ) return
  copy $el2:=$el modify
  (
    for $d in $el2//*[@cc:pid] return 
    
      for $plg at $i in $d//(tei:p|tei:lg|tei:head|tei:list) where $plg/@parent_pid=$d/@cc:pid return
        (
          if (not($plg/@cc:pid)) then
          (
          insert node (attribute cc:pid {concat($d/@cc:pid,";",$i)}) into $plg, delete node $plg/@parent_pid 
          )
        )
  )return $el2
};





declare function cc:normalize_higher_level_id($id)
{
  let $as:=analyze-string($id,"(.*)\.$") return
    $as/fn:match/fn:group/text()
};


declare function cc:count_length_of_divs($text_id)
{
  let $t:=$cc:root/data/tdata[@cc:idno=$text_id]
  for $d in $t//tei:div return
    insert node (attribute cc:div_length {string-length(data($d))}) into $d
};
declare function cc:concat($old_prefix,$new_part)
{
  if (matches($old_prefix,"[IVXLCDM]$") and starts-with($new_part,".")=false()) then
    concat($old_prefix,".",$new_part)
  else
    concat($old_prefix,$new_part)
};



declare function cc:PoS_tagging_MySQL($idno)
{
  let 
  $T:=$cc:root/cc_texts/item[cc_idno=$idno],
  $TEI_header:=$cc:root/data/tdata[cc_idno=$idno]/cc:header/tei:teiHeader,
  $lemm_data:=doc(concat($cc:php_localhost,"/php_modules/get_wordlist_entry.php?text_idno=",$idno)) 
  return $lemm_data
  (:
    copy $T2:=$T modify
    (
        if (not($T2/entropy)) then
            insert node <entropy>{data($lemm_data/mysql_query/@entropy)}</entropy> into $T2
        else
            replace value of node $T2/entropy with data($lemm_data/mysql_query/@entropy)
    )
    return
    copy $ld2:=$lemm_data modify
    (
        insert node $TEI_header as first into $ld2/mysql_query/tei:TEI,
        insert node $T2 as first into $ld2/mysql_query/tei:TEI
    )
    return 
        file:write(concat($cc:home_folder,"/data/PoS_tagged/MySQL_tagged/",$T/name_data/name/text(),".xml"),$ld2/mysql_query/tei:TEI)
        :)
   
  
};

declare function cc:PoS_tagging($idno)
{
  file:write(concat($cc:home_folder,"/data/PoS_tagged/process.txt"),""),
  let 
  $T:=$cc:root/cc_texts/item[cc_idno=$idno],
  $lemm_data:=doc(concat($cc:php_localhost,"/php_modules/get_wordlist_entry.php?text_idno=",$idno)) return
  
  
  let $t1:=$cc:root/data/tdata[cc_idno=$idno] return 
  let 
  $paratext_elements:=cc:get_paratext_elements($t1),
  $t2:= cc:mask_paratext_elements($t1) return
  (: for $tn in $t2//text/tei:text/node() let $s:=$tn/preceding::cc:s[1] return :)
  copy $t3:=$t2 modify
  (
    for $tn in $t3/text//node() let $s:=$tn/preceding::cc:s[1], $pid:=$s/@parent_pid,$sn:=$s/@n where local-name($tn)="" return
    (
      let $words:=
        for $w at $i in analyze-string($tn/data(),"\w+")/fn:match
          (:  :) return 
            (<w xmlns="http://www.tei-c.org/ns/1.0" pid="{concat($pid,',',$sn)}">{$w/text()}</w>,$w/following-sibling::fn:non-match[1]/text()) return
        if (normalize-space($tn)!="") then
          replace node $tn with $words
    )
  )return
  
  (: copy $t4:=$t3 modify
  (
  for $d in $t4//tei:w 
    let $pid:=$d/@pid
    group by $pid
  return
  (
    let $dlem:=$lemm_data/mysql_query/div[@pid=$pid] return
    for $s in $d 
      let $n:=$s/@n
      group by $n
    return
    (
      let $slem:=$dlem/sentence[@pid=concat($pid,",",$n)]/record return
      for $w at $i in $s 
        let $seq_record:=cc:find_word_in_seq($slem,$w,$i)
      return  
        (
          insert nodes (attribute lemma{$seq_record/lemma/text()}, attribute type{$seq_record/type/text()}) into $w,delete nodes ($w/@pid,$w/@n)
        )
    )
  )
  ) return $t4 :) 
  
  copy $t4:=$t3 modify
  (
    for $s in $t4//tei:w 
      let $pid:=$s/@pid
      group by $pid
        return
        (
          file:append(concat($cc:home_folder,"/data/PoS_tagged/process.txt"),concat($pid,"&#10;")),
          let $lem:=$lemm_data/mysql_query/div/sentence[@pid=$pid]/record
          for $w at $i in $s
            let $seq_record:=cc:find_word_in_seq($lem,$w,$i)
          return
        
          (
          insert nodes (attribute lemma{$seq_record/lemma/text()}, attribute type{$seq_record/pos/text()}) into $w,delete node $w/@pid
          )
        )
  ) return 
  let $t5:=cc:unmask($paratext_elements,$t4)
  return
  (
    copy $T2:=$T modify
    (
        if (not($T2/entropy)) then
            insert node <entropy>{data($lemm_data/mysql_query/@entropy)}</entropy> into $T2
        else
            replace value of node $T2/entropy with data($lemm_data/mysql_query/@entropy)
    )
    return
    copy $t6:=$t5 modify
    (
        insert node $T2 as first into $t6 
    )
    return 
    
    
    file:write(concat($cc:home_folder,"/data/PoS_tagged/",$T/name_data/name/text(),".xml"),$t6),
    file:write(concat($cc:home_folder,"/data/PoS_tagged/process.txt"),concat($idno,":done"))
  )
  
};

declare function cc:find_word_in_seq($seq,$word,$i)
{

    if ($seq[$i]/word/text()=>cc:clear_word()=$word=>cc:clear_word()) then
    (
      $seq[$i]
    )
    else if ($seq[$i+1]/word/text()=>cc:clear_word()=$word=>cc:clear_word()) then
    (
      $seq[$i+1]
    ) 
    else if ($seq[$i - 1]/word/text()=>cc:clear_word()=$word=>cc:clear_word()) then
    (
      $seq[$i - 1]
    ) 
        else if ($seq[$i+2]/word/text()=>cc:clear_word()=$word=>cc:clear_word()) then
    (
      $seq[$i+2]
    ) 
    else if ($seq[$i - 2]/word/text()=>cc:clear_word()=$word=>cc:clear_word()) then
    (
      $seq[$i - 2]
    )
};
declare function cc:clear_word($w)
{
  $w
  (: analyze-string($w,"\w+")/fn:match/text() :)
};
