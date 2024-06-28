module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace html="http://www.w3.org/1999/xhtml/";
declare namespace err="http://www.w3.org/2005/xqt-errors";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "general_functions.xq","mod_cc_data.xq";

(:
možné postupy:
- lemmatizace proces zde vždy přeruší
1) orig->rozdělení na věty, ale už ne export (orit,an1->prep-sent)
2) rozdělené na věty->export (prep-sent -> prep-export)
3) rozdělené a exportované->lematizace (prep-export -> prep)


:)

declare function cc:make_loadable_file($opt)
{
  (:this function performs some last transformations needed to load a text into database:
   1) check, if the cc_idno is already presented, and if not, insert it into all @pid and @parent_pid attributes
   2) calculate fresh statistics
  :)
   let
     $actual_file:=cc:get_state_path($opt/file/text(),"prep"),
     $original_file:=cc:get_original_path($opt/file/text()),
     $output:=$opt/output/text(),
     $def_loaded_path:=cc:get_state_path($actual_file,"loaded"),
     $loaded_path:=
       if ($output="" or not($output) or $output="default") then
         $def_loaded_path
       else
         replace($def_loaded_path,".loaded.xml",".loaded." || $output || ".xml")
     
   return 
   if ($actual_file!="") then
   (
     let
     
     $doc:=doc($actual_file),
     $cc_idno_of_item:=cc:find_cc_idno_by_path($opt),
     (: $dump:=cc:raise_error("","CCIDNO textu:" || $cc_idno_of_item,cc:opt($opt,"error_log_file",""),$opt/file/text()), :)
     $item_exists:=
       if (normalize-space($cc_idno_of_item)="") then 
         cc:raise_error("","It seems, correspondent /cc_texts/item in the corpus_corporum DB doesn't exists! Can not proceed. At this stage, it already must exist! File path: " 
         ||$original_file,cc:opt($opt,"error_log_file",""),$opt/file/text())
       else
         true(),
     $has_cc_idno:=cc:cc_idno_inserted($doc),
     $cc_idno_to_insert:=
       if ($cc_idno_of_item=$has_cc_idno) then (:cc_idno is already inserted and corresponds with /cc_text/item idno, we won't do anything more:)
         "inserted and ok"
       else if ($cc_idno_of_item!=$has_cc_idno and $has_cc_idno!="") then 
           (: item exists, but it's idno doesn't correspond with cc_idno already inserted in the file - error :)
            cc:raise_error("","cc_idno of the /cc_texts/item doesn't correspond with cc_idno already present in the document. Can not proceed!",cc:opt($opt,"error_log_file",""),$opt/file/text())
         
       else if ($has_cc_idno="") then
       (:cc_idno has not yet been inserted:)
         $cc_idno_of_item,
         
      $doc_cc_idno_supplied:=
       if ($cc_idno_to_insert!="inserted and ok") then
         cc:supply_cc_idno($doc,$cc_idno_to_insert)
       else
         cc:insert_xenoData($doc,<cc_idno>{$cc_idno_of_item}</cc_idno>,"loaded",true()),
      $text_cc_idno:=
       if($cc_idno_to_insert!="inserted and ok") then
         $cc_idno_to_insert
       else
         $cc_idno_of_item,
            
     $doc_s_cleaned:=cc:clean_end_s($doc_cc_idno_supplied),
         
     (:########################:)
     $void:=cc:transform_lemmatisation(map{"doc":$doc_s_cleaned,"path":$actual_file,"output":$output}),
     (:########################:)
     $doc_lemmatisation_transformed:=doc($loaded_path),
     
     
     $doc_statistics_written:=cc:insert_onload_text_statistics($doc_lemmatisation_transformed,$opt),
     
     $void:=cc:copy_statistics_to_POS_file(map{"doc":$doc_statistics_written,"path":$actual_file}),
     
     
     $doc_loaded:=$doc_statistics_written
     
    return 
    (
      if (file:exists(file:parent($loaded_path))=false()) then
        file:create-dir(file:parent($loaded_path)),
      file:write($loaded_path,$doc_loaded),
      "Loadable file done successfully; result saved in the file " || $loaded_path || ". cc_idno: " || $text_cc_idno,
      if (cc:opt($opt,"cleanup",true())=true()) then cc:cleanup($opt/file,"loaded")        
    )
    (: $doc_loaded :) 
   )
   else
    "Missing *.prep.xml variant of the file " || $opt/file/text() 
};

declare function cc:cleanup($path,$state)
{
  if ($state="prep" or $state="loaded")then
    (
      if (file:exists(cc:get_state_path($path,"prep-sent"))=true()) then
        file:delete(cc:get_state_path($path,"prep-sent")),
      if (file:exists(cc:get_state_path($path,"prep-export"))=true()) then
        file:delete(cc:get_state_path($path,"prep-export")),
      if (file:exists(cc:get_state_path($path,"sentences"))=true()) then
        file:delete(cc:get_state_path($path,"sentences")),
      (: if (file:exists(cc:get_state_path($path,"sentences.lemmatised"))=true()) then
        file:delete(cc:get_state_path($path,"sentences.lemmatised")), :)
        
      if (file:exists(cc:get_state_path($path,"prep"))=true() and $state="loaded") then
        file:delete(cc:get_state_path($path,"prep"))
    )   
    
};



declare function cc:prepare($options)
{
  let 
  $doc:=doc($options/file),
  $opt:=cc:merge_options($options,$doc//tei:xenoData/prep-instructions),
  $file_status:= cc:get_file_state($opt/file),
  $step:=cc:opt($opt,"step")
  (:prep-sent, prep-export, prep-:)
  return
  (
    if ($step="prep-sent" and ($file_status="orig" or $file_status="an1")) then
    ( (:this ist the most basic step, which can't be divided, so we are not concerned about the state of the input file (basicaly: orig or an1):)
      let
      $doc_sent:=cc:prepare_step1($doc,$opt),
      $saved:=cc:save($doc_sent,$opt,"prep-sent")
      return 
      "Preparation done up to splitting sentences. Modified XML saved to " || $saved || ". Next step: prep-export."
    )
    else if ($step="prep-export" and $file_status="prep-sent") then
    (
   
      let 
      $doc_export:=cc:prepare_step2($doc,$opt),
      $saved:=cc:save($doc_export,$opt,"prep-export")
      return 
      "Modified XML saved to " || $saved || ", sentences exported to " || cc:get_original_path($opt/file) || ".sentences. Next step: run an external lemmatiser, than prep"
      
    )
    else if ($step="prep" and $file_status="prep-export") then
    ( (:inserting of lemmatisation results into the file and some final touches. The file status must be "prep-export":)
      let
        $doc_lemmatisation_inserted:=cc:prepare_step3($doc,$opt),
        $saved:=cc:save($doc_lemmatisation_inserted,$opt,"prep"),
        $cleanup:=cc:cleanup($opt/file,"prep")
      return
      "Preparation completed. Lemmatisation results inserted into the file. Result saved to " || $saved || ". Next step: an2 or load"
      
    )
  )
  
  
};

declare function cc:prepare_step1($doc,$options)
{
    (:
        General function, that prepares some text for being inserted into the database up to splitting into sentences. Than it eiter saves the result, or it returns the changed document for further work.
        It consists of following steps:
        1) renaming like div1...9 to div
        2) numering the hierarchy
        3) splitting into sentences
        
        $options are expected to be a xml object:
        file: path to the source xml file
        cc_idno: cc_idno, if the db-item already exists for this text. If it doesn't, xxx will be used instead
        
    :)
    let 
    $fn_rename_divs:=cc:rename_divs#1,
    $fn_get_paratext_elements:=cc:get_paratext_elements_new#2,
    $fn_mask_paratext_elements:=cc:mask_paratext_elements_new#2,
    $fn_numerate_hierarchy:=cc:numerate_structure#3,
    $fn_tokenize_sentences:=cc:tokenize_sentences#2,
    $fn_unmask_paratext_elements:=cc:unmask_paratext_elements_new#2,
    (: $fn_export_sentences:=cc:export_sentences_for_lemmatiser#2, :)   
    
    (:renaming divs:)
    $doc_divs_renamed:=$fn_rename_divs($doc),
    (:masking paratext:)
    $paratext_elements:=$fn_get_paratext_elements($doc_divs_renamed,$options),
    $doc_pt_masked:=$fn_mask_paratext_elements($doc_divs_renamed,$options),
    (:numerate hierarchy:)
    $doc_numerated:=$fn_numerate_hierarchy($doc_pt_masked,$options/cc_idno,$options),
    (:tokenizing sentences:)
    $doc_s_inserted:=$fn_tokenize_sentences($doc_numerated,$options),
    (:unmasking paratext:)
    $doc_pt_unmasked:=$fn_unmask_paratext_elements($doc_s_inserted,$paratext_elements),
    $doc_xenoData_inserted:=cc:insert_xenoData($doc_pt_unmasked,<prep><step1>{cc:now()}</step1></prep>)
    return $doc_xenoData_inserted
        
    
};

declare function cc:prepare_step2($doc,$options)
{
  let 
  $sentences:=cc:export_sentences_for_lemmatiser($doc,$options),
  $doc_xenoData_inserted:=cc:insert_xenoData($doc,<step2>{cc:now()}</step2>,"prep",true())
  return
  $doc_xenoData_inserted
};

declare function cc:prepare_step3($doc, $options)
{(:inserting lemmatisation results into document:)
  let 
  $doc_lemmatised:=cc:write_lemmatisation_results($doc,cc:get_state_path($options/file,"sentences.lemmatised"),$options),
  $doc_xenoData_inserted:=cc:insert_xenoData($doc_lemmatised,<step3>{cc:now()}</step3>,"prep",true())
  return $doc_xenoData_inserted
  
};

declare function cc:save($doc,$options,$state)
{
  let $filename:=cc:get_state_path($options/file,$state)
  return
  (
    let $parent_path:=file:parent($filename) return
    if (file:exists($parent_path)=false()) then
      file:create-dir($parent_path),
    file:write($filename,$doc),
    $filename
  )
    
};


declare updating function cc:insert_cc_idno_def($doc,$cc_idno)
{
  for $path_id in $doc//(*/@cc:pid|*/@cc:parent_pid) return
    replace value of node $path_id with replace($path_id/text(),"????",$cc_idno)
};

declare function cc:get_dynamic_fn_name($dynfn)
{(: it seems there is no other way to gain the dynamic function name than producing an error and processing the error description:)
  try 
  {
    name($dynfn)
  }
  catch *
  {
    analyze-string($err:description,"\(:\s*Q[^}]*\}(.*):\)")/fn:match/fn:group/text()
  }
};
declare function cc:get_paratext_elements_new($doc,$options)
{(:returns all paratexts from the text, so that they can be stored in a variable
and later, after all transformations of the text that are suppoused not to influence the paratext, could be restored again:)

   let $e:=
      tokenize(cc:opt($options,"paratext_elements"))
  return
  let
  $paratext_elements:=
  (
    let $bfb:=$doc//(tei:body|tei:front|tei:back) return
      for $b at $i in $bfb return
        for $pt_el at $j in $b//*[index-of($e,local-name(.))>0] where $b is $pt_el/ancestor::*[self::tei:body|self::tei:front|self::tei:back][1] return
        (:we must ensure we will work only once with every paratext element - if we have floatingText, we may have one tei:body as descendant of an another,
        than we may work with one note twice (which leads to an error):) 
          <paratext_element i="{$i}" j="{$j}">{element {node-name($pt_el)}{$pt_el/@*,attribute {"cc:paratext"}{"true"},$pt_el/node()}}</paratext_element>
  )
  return $paratext_elements
};
declare function cc:mask_paratext_elements_new($doc,$options)
{
   (:the selection loops must be exactly the same as in the function cc:get_paratext_elements_new !! :)
   let 
   $e:=
      tokenize(cc:opt($options,"paratext_elements"))
  return
  copy $new_doc:=$doc modify
  (
    let $bfb:=$new_doc//(tei:body|tei:front|tei:back) return
      for $b at $i in $bfb 
      return
        for $pt_el at $j in $b//*[index-of($e,local-name(.))>0] where $b is $pt_el/ancestor::*[self::tei:body|self::tei:front|self::tei:back][1] return 
          replace node $pt_el with <paratext_anchor i="{$i}" j="{$j}"/>
  )
  return $new_doc
    
  
};
declare function cc:unmask_paratext_elements_new($doc,$masked_elements)
{
  copy $doc2:=$doc modify
  (
    for $pa in $doc2//paratext_anchor let $i:=$pa/@i, $j:=$pa/@j return
    (
      replace node $pa with $masked_elements[./@i=$i and ./@j=$j]/*
    )
  )
  return $doc2
  
};
declare function cc:rename_divs($doc)
{
  copy $new_doc:=$doc modify
  (
    let $bfb:=$new_doc//(tei:body|tei:front|tei:back) return
      for $b in $bfb return
        for $div in $b//*[matches(local-name(.),"div[0-9]+$")] where $b is $div/ancestor::*[self::tei:body|self::tei:front|self::tei:back][1] return
          rename node $div as QName("http://www.tei-c.org/ns/1.0","div")
  )
  return $new_doc
};



declare function cc:numerate_texts_and_groups($parent,$idno)
{
  let $idno1:=if ($parent/@cc:pid) then $parent/@cc:pid/data() else $idno,
  $sep:=if (matches($idno1,"^[0-9?]+$")) then ":" else "."
  return 
  for $tg at $i in $parent/*[self::tei:text|self::tei:group]
  return
  (
    let 
    $n:=
      count($tg/preceding-sibling::*[local-name(.)=local-name($tg)])+1,
     $m_idno:=$idno1 || $sep || cc:roman($n)
    return
    (
      insert node attribute cc:pid{$m_idno} into $tg,
      cc:numerate_texts_and_groups($tg,$m_idno) 
    )
  )
  
};
declare function cc:numerate_divs($parent,$p_pid)
{
  for $d at $i in $parent/(tei:div)
  let 
    $p_pid2:=if ($parent/@cc:pid) then $parent/@cc:pid else $p_pid,
    $sep:=if (matches($p_pid,"^[0-9?]+$")) then ":" else ".",
    $pid:=$p_pid2 || $sep || $i
  return
  (
    insert node attribute cc:pid{$pid} into $d,
    cc:numerate_divs($d,$pid)
  )
};

declare function cc:numerate_under_div_elements($doc,$struct_el)
{
  for $d in $doc//tei:text//tei:div
  return
  (
    for $e in $d/*
      where not($e[@cc:pid]) and index-of($struct_el,local-name($e))>0
      let $ppid:=$d/@cc:pid/data()
      count $i
    return
      insert node attribute cc:pid{$ppid || ";" || $i} into $e
  )
};

declare function cc:numerate_structure($doc,$cc_idno,$opt)
{
  let $idno:=if ($cc_idno!="") then $cc_idno else "????"
  return
  copy $doc1:=$doc modify
  (
     let $t:=$doc1/tei:TEI/tei:text
     return      
     insert node attribute cc:pid{$idno} into $t
  )
  return 
  copy $doc2:=$doc1 modify
  (
    cc:numerate_texts_and_groups($doc2/tei:TEI/tei:text,"")
  )
  return
  copy $doc3:=$doc2 modify
  (
    cc:numerate_bodies($doc3)    
  )
  return
  copy $doc4:=$doc3 modify
  (
     cc:numerate_body_children($doc4,tokenize(cc:opt($opt,"hierarchy_elements")))
  )
  return
  copy $doc5:=$doc4 modify
  (
    cc:numerate_under_div_elements($doc5,tokenize(cc:opt($opt,"hierarchy_elements")))
  )
  return
  copy $doc6:=$doc5 modify
  (
    cc:process_floatingTexts($doc6)
  )
  return
  (
     file:write("/var/www/html/data/dump.xml",$doc6),
     $doc6
  )
};
declare function cc:numerate_bodies($doc)
{
  for $t in $doc//(tei:text|tei:floatingText)
  let 
    $p_pid:=if ($t/@cc:pid) then $t/@cc:pid else "####",
    $sep:=if (matches($p_pid,"^[0-9?]+$")) then ":" else "."
  return
  (
    for $fbb in $t/*[self::tei:body|self::tei:front|self::tei:back]
    
    return
    (
      if ($fbb/self::tei:body) then
      (
        insert node attribute cc:pid{$p_pid} into $fbb
      )
      else if ($fbb/self::tei:front) then
        insert node attribute cc:pid{$p_pid || $sep || "F"} into $fbb
      else if ($fbb/self::tei:back) then
        insert node attribute cc:pid{$p_pid || $sep || "B"} into $fbb
      )
    )
};
declare function cc:numerate_body_children($doc,$struct_elements)
{
  for $fbb in $doc//*[self::tei:body|self::tei:front|self::tei:back]
  let 
    $p_pid:=$fbb/@cc:pid,
    $sep:=if(matches($p_pid,"^[0-9?]+$")) then ":" else "."
  return
  (
    for $e in $fbb/*
    where index-of($struct_elements,local-name($e))>0
    count $i
    return 
    (
      insert node attribute cc:pid{$p_pid || $sep || $i} into $e,
      if ($e[self::tei:div]) then
        cc:numerate_divs($e,$p_pid || $sep || $i)
    )
  )
};

declare function cc:process_floatingTexts($doc)
{ 
  (:the floatingText elements are pretty tricky to numerate, because they can occur basically on any place in the structure.
  Thus, they get at first @pid="####", which must be then replaced with parents pid, when the structure is nummerated
:)
  file:write("/var/www/html/data/_dbg_dump.xml",$doc),
  let $get_hierarchy_ancestor:=function($fT)
  {
    $fT/ancestor::*[@cc:pid and not(matches(@cc:pid/data(),";"))][1]
  }
  return
  
  for $fT in $doc//tei:floatingText
    let $hier_ancestor:= $get_hierarchy_ancestor($fT),
    $prev_floatingTexts:=$fT/preceding::tei:floatingText[$get_hierarchy_ancestor(.) is $hier_ancestor],
    $nr:=cc:roman(count($prev_floatingTexts)+1),
    $pid:= $hier_ancestor/@cc:pid || "." || $nr
  return
    for $el in $fT//*[@cc:pid] return
    (
      replace value of node $el/@cc:pid with replace($el/@cc:pid/data(),"####",$pid)
    )
  
};




declare function cc:tokenize_sentences($doc,$options)
{ (:general function dealing with spliting the text into sentences:)
  let 
    $e:=
    tokenize(cc:opt($options,"text_containing_elements")),
    
  $insert_s_in_structural_elements:=function($doc,$elements)
  {
     for $text_e in $doc//* where index-of($elements,local-name($text_e))>0 (: and $text_e/@cc:pid :) return
     (
         insert node <cc:s auto_inserted="1" start="true" parent_pid="{$text_e/ancestor-or-self::*[@cc:pid][1]/@cc:pid}"/> as first into $text_e,
         insert node <cc:s auto_inserted="1" end="true" parent_pid="{$text_e/ancestor-or-self::*[@cc:pid][1]/@cc:pid}"/> as last into $text_e
     )
  },
  $insert_s_on_beginning_of_text:=function($doc)
  {(:this function inserts <cc:s/> elements on beginning of every piece of text, that is not inside of "text-containing-elements" like p,lg,head,div. I. e., if there is some textoutside of this elements, it would be otherwise ignored. Typical example: <l> element after <head>
<div>
<head></head>
<l>some verse</l>
<p>blabla</p>
</div>
In this example, <cc:s/> is inserted into div and p and head and on end of those elements by another function, because these are text-containing-elements: no sentence can "overflow" from one such element into another. But l can't be such an element, thus it would happen to be between endig <cc:s/> in the head and the beginning <cc:s/> in the p - and so it would disappear for the sentence numbering
:)
    for tumbling window $between_sentences in $doc//node()[string(node-name(.))="cc:s" or (local-name(.)="" and normalize-space(data(.))!="")]
     start $se when string(node-name($se))="cc:s" and $se/@end="true"
     end $ee when string(node-name($ee))="cc:s" and not($ee/@end)
    return
      if (normalize-space(string-join($between_sentences))!="") then
        insert node <cc:s auto_inserted="1" parent_pid="{$between_sentences[2]/ancestor-or-self::*[@cc:pid][1]/@cc:pid}"/> before $between_sentences[2]
  },
  $delete_empty_sentences:=function($doc)
  { (:clears empty sentences (removes the <cc:s/> which don't really start a sentence) :)
    for tumbling window $sentence in $doc//node()[string(node-name(.))="cc:s" or (local-name(.)="" and normalize-space(data(.))!="")]
      start $se when string(node-name($se))="cc:s" and not($se/@end)
    return
      if (normalize-space(string-join($sentence))="" or matches(normalize-space(string-join($sentence)),"^[ .]+$")=true()) then
      (
        delete node $se
      )
       (: else insert node <oo></oo> after $se :)
  },
  
  $delete_double_end_sentences:=function($doc)
  { (:clears double <cc:s end="true"/> (eg. one in paragraph, next one in div) :)
    for sliding window $sentence in $doc//node()[string(node-name(.))="cc:s" or (local-name(.)="" and normalize-space(data(.))!="")]
      start $se when string(node-name($se))="cc:s" and $se/@end="true"
      end $ee when string(node-name($ee))="cc:s" and $ee/@end="true" and $se/@parent_pid!=$ee/@parent_pid
    return
      if (normalize-space(string-join($sentence))="") then
        delete node $ee
     
  },
  $clear_s_elements:=function($doc)
  {(:delete temporary working attributes from cc:s:)
    for $s in $doc//cc:s return 
    (
        if ($s/@end) then
          delete nodes ($s/@*)
        else
          delete nodes ($s/@start,$s/@tmp_id,$s/@auto_inserted)
    )
  },
  $tokenize_sentences:=function($doc,$options)
  { (:insert a <cc:s/> element on every potential sentence-brak (.,?,!) :)
      let $tokenization_canceling_elements:=tokenize(cc:opt($options,"tokenization_canceling_elements"))
      return
      for $tn at $i in $doc//(tei:body|tei:front|tei:back)//node()[local-name(.)="" and normalize-space(data(.))!=""] let $split:=analyze-string($tn,"[.?!·]"),
      $ancestors:=$tn/ancestor::*/local-name()
      where every $ancestor in $ancestors satisfies not(index-of($tokenization_canceling_elements,$ancestor)>0)
      return
      let $result:=
      for $all at $i in $split/* return
        (
        if ($i=1 and local-name($all)="match") then
          $all/text(),
        if (local-name($all)="non-match") then
          $all/text() || $all/following-sibling::fn:match[1]
        else
            <cc:s auto_inserted="1" parent_pid="{$tn/ancestor::*[@cc:pid][1]/@cc:pid}"/>)
        
       return 
         replace node $tn with $result
  },
  $remove_empty_sentences:=function($doc)
  {
    
  },
  
  $numerate_s_elements:=function($doc)
  { (: numerate the sentences inside of their respective text containing parents:)
    for $s at $i in $doc//cc:s return 
      (
        insert node attribute tmp_id {$i} into $s(: ,
        delete node $s/@start :)
      )
  } ,
  
  $evaluate_sentences:=function($doc,$options)
  { (:evaluate sentences, i. e. determine, which cc:s really end a sentence and which can be deleted; mey be done by some external program :)
   
   
     cc:evaluate_sentences( cc:get_sentences_NEW($doc,true()),$options)
    
  },
  
  
  
  $delete_sentences:=function($doc,$list)
  {
    for $s in $doc//cc:s return
    (
      if (index-of($list,$s/@tmp_id)>0) then
        delete node $s
      (: else
      (
       delete nodes ($s/@tmp_id,$s/@auto_inserted),
       if ($s/@end) then
         delete nodes ($s/@n,$s/@parent_pid)
      ) :)
    )
  },
  $numerate_sentences:=function($doc)
  {
    file:write("/var/www/html/data/_dbg_dump.xml",$doc/tei:TEI/tei:text/tei:body/tei:figure),
    (: let $tce:=$doc//*[@cc:pid]/@cc:pid,
  $d:=
  for $pid in $tce where count(index-of($tce,$pid))>1
    return $pid
  return
  (
    file:write-text-lines("/var/www/html/data/_dbg_pid_dupl",$d), :)
  
    for $text_containing_element in $doc//*[@cc:pid] let $this_pid:=$text_containing_element/@cc:pid 
    where not($text_containing_element/self::tei:floatingText) (:floatingTexts have body etc. with the same pid, so it woult lead to an error:)
    return
    (
      for $s at $i in $text_containing_element//cc:s[./@parent_pid=$this_pid] return
      (
        (: prof:dump($this_pid || "," || $i || "-" || local-name($s/parent::*)) || (if (local-name($s/parent::*)="head") then string-join($s/parent::*/data())), :)
        
        insert node attribute n {$i} into $s
      )
    )
  } 
  
  return
  copy $doc2:=$doc modify
  ( (:create the basic structure of the <cc:s/> (beginning and end of text-containing-elements (i. e. elements which can't be overflown by a sentence-it always ends with the end of such an element: div, p, lg, head...) :)
    $insert_s_in_structural_elements($doc2,$e)
  )    
  return
  copy $doc3:=$doc2 modify
  ( (:process text nodes between text-containing-elements:)
    $insert_s_on_beginning_of_text($doc3)
  )
  return
  copy $doc_empty_sentences_removed_1:=$doc3 modify
  ( (:clear empty sentences:)
    $delete_empty_sentences($doc_empty_sentences_removed_1)
  )
  return 
  copy $doc_sentences_tokenized:=$doc_empty_sentences_removed_1 modify 
  (
    $tokenize_sentences($doc_sentences_tokenized,$options)
  )
  return 
  copy $doc_sentences_tmp_numerated:=$doc_sentences_tokenized modify
  (
     file:write($cc:dbg,$doc_sentences_tmp_numerated),
    $numerate_s_elements($doc_sentences_tmp_numerated)
  )
  return 
  copy $doc_sentences_evaluated:=$doc_sentences_tmp_numerated modify
  ( (: preserve only those sentence breaks (cc:s), which actually break a sentence :)
    let $sentences_to_delete:=$evaluate_sentences($doc_sentences_tmp_numerated,$options) return
    
    $delete_sentences($doc_sentences_evaluated,$sentences_to_delete)
  )
  return 
  copy $doc_cleared1:= $doc_sentences_evaluated modify
  ( (:clear redundant cc:s :)
     $delete_empty_sentences($doc_cleared1)
  )
  return
  copy $doc_cleared2:= $doc_cleared1 modify
  ( (:clear redundant cc:s :)
     $delete_double_end_sentences($doc_cleared2)
  )
  return 
  copy $doc_numbered:=$doc_cleared2 modify
  ( (:number the sentences:)
    (:file:write("/var/www/html/data/Corpus4_Scientiae/xxxx.xml",$doc_numbered),:)
     $numerate_sentences($doc_numbered)
  )
  return
  copy $doc_cleared3:=$doc_numbered modify
  (
    $clear_s_elements($doc_cleared3)
  )
  return
  $doc_cleared3
  (:here we are finished with inserting, evaluating and numbering sentences:)
  
};


declare function cc:evaluate_sentences($sentences,$opt)
{(:in-built function to analyze the sentences and fidn those, which should be joined together (i. e. finding full stops, which dont end a sentence):)
  let
  $capitalized:=cc:opt($opt,"capitalized",true()),
  $min_length:=cc:opt($opt,"min_sentence_length",2),
  $min_last_word_length:=cc:opt($opt,"min_last_word_length",2),
  $abbr:=cc:opt($opt,"abbreviations"),
  $abbr_plain:=tokenize(string-join($abbr/plain/data()," ")),
  $abbr_rgx:=$abbr/rgx/abbr,
  $abbr_rgx_ext:=$abbr/rgx_ext/abbr,
  $matches_abbr:=function($word,$nword,$abbr_plain,$abbr_rgx)
  {
    let $satisfies_ext:=function($abbr_rgx_ext,$word_last,$word_first)
    {

      let
        $matches_for_last_word:=
       for $l in $abbr_rgx_ext/last where matches($word_last,$l/text())
       
       return ($l/parent::abbr)
      return
      (
        if (some $first_rgx in $matches_for_last_word/first satisfies matches($word_first,$first_rgx)) then 
        (
          true()
        )
     )  
         
    }
    return
    if (index-of($abbr_plain,$word)>0 or count(index-of($abbr_plain,$word))>0) then
      true()
    else if (some $rgx in $abbr_rgx satisfies matches($word,$rgx)=true()) then 
    (
       true()
    )
    else if  ($satisfies_ext($abbr_rgx_ext,$word,$nword)=true()) then
    (
       true()
    )
    else
    (
      false()
    )
  },  
  $x:=file:write(file:parent($opt/file) || "/_dbg_sentences_export.xml",$sentences),
  (: $d:=prof:dump(<d><sn1>{$sentences[1]}</sn1><sn2>{$sentences[2]}</sn2></d>), :)
  $ids_to_delete:=
  
    for $s in $sentences count $j
        let
          $i:=data($s/s/@tmp_id),
          $end:=if ($s/cc:s[@end="true"]) then true() else false(),
          $next:=$sentences[$j+1],
          $next_i:=data($next/s/@tmp_id),
          $next_start:=if ($next/cc:s[@start="true"]) then true() else false(),
          $w:=tokenize(normalize-space($s/text())),
          $next_sentence_w:=tokenize($next/text()),
          $next_sentence_first_w:=if ($next!="") then normalize-space(string-join(analyze-string($next_sentence_w[1],"[\p{L}0-9]+")/fn:match/data())) else "",
          $last_w:=$w[last()],
          $last_w_normalized:=normalize-space(string-join(analyze-string($last_w,"[\p{L}0-9]+")/fn:match/data())),
          $interp:=if (ends-with($last_w,".")) then ".",
          $auto_inserted:=if ($s/cc:s[@auto_inserted="1"]) then true() else false()
          (: ,$e:=prof:dump(<qqqq>{$s,$next}</qqqq>) :)
    return
    if ($next_start=false() and $end=false() and $interp="." and $auto_inserted=true()) then
    (
      
      if (count($w)<$min_length) then
        $next_i (: string-join($next_i,",") || ":1" :)  (:the sentence is too short (1 word):)
      else if (string-length($last_w_normalized)<$min_last_word_length and $last_w_normalized!="") then
        $next_i (: string-join($next_i,",")  || ":2:" || $last_w_normalized :) (:the last word is too short (1 letter):)
      else if ($capitalized=true() and matches($next_sentence_first_w,"^[\p{Ll}]")) then
        $next_i (: string-join($next_i,",")  || ":3" :)  (:sentences are capitalized, but the next sentence starts with lowercase letter:)
      else if ($matches_abbr($last_w_normalized,$next_sentence_first_w,$abbr_plain,$abbr_rgx) =true()) then
        $next_i (: string-join($next_i,",")  || ":4" :)  (:last word is in list of abbreviations:)
      else if (matches($s/data(),".*\([^)]*$") and matches($next/data(),"^[^(]*\)")) then
        $next_i (: string-join($next_i,",") || ":5" :) (:the sentence end in an opened parenthesis and the next sentence beginns with this parenthesis:)
    )
  return
  (
    file:write(file:parent($opt/file) || "/_dbg_ids_to_delete",$ids_to_delete),
    $ids_to_delete
     
  )
};

declare function cc:transform_lemmatisation($opt)
{(: in the DB, we don't need the lemma info in form <w lemma='xy' pos='xy'>xy</w>,
 but we only need the lemmatised sentence as one string. So here we transform the "verbose" lemmatisation
 results of preparation to more concise form: <cc:s lem="lemmatised sentence in one string"/> 
 The verbose form remains in the .POS.xml version of the files
 In that way, we also spend hundreds of milions XML-nodes in the DB, where the maximal
 count of nodes is limited :)
 let $path:=
 if ($opt instance of xs:string) then
   $opt
 else if ($opt instance of map(*)) then
   $opt?path
 ,
 $doc:=
 if ($opt instance of map(*)) then
 (
   if ($opt?doc) then $opt?doc else doc($path)
 )
 else
   doc($path)
 ,
 $output:=
 if ($opt instance of xs:string) then ""
 else
 (
   if ($opt?output) then $opt?output else ""
 ) 
 return
 
 copy $doc2:=$doc modify
 (
   for $s in $doc2//cc:s
     let $lemmatised:=string-join($s/cc:w/@lemma/data()," ")
   return
   (
       if ($lemmatised!="") then 
         insert node attribute lemmatised {$lemmatised} into $s,
       delete nodes $s//node()
   )
 )
 return
 (
   let $def_POS_path:=cc:get_state_path($path,"POS"),
   $def_loaded_path:=cc:get_state_path($path,"loaded"),
   $loaded_path:=
     if ($output="" or not($output) or $output="default") then
       $def_loaded_path
     else
       replace($def_loaded_path,".loaded.xml",".loaded." || $output || ".xml"),
   $POS_path:=
       if ($output="" or not($output) or $output="default") then
         $def_POS_path
       else
         replace($def_POS_path,".POS.xml",".POS." || $output || ".xml")
   return
   (
     file:write($POS_path,$doc),
     file:write($loaded_path,$doc2)
   )
 )
  
};

declare function cc:write_lemmatisation_results($doc,$input_file,$opt)
{
  if (file:exists($input_file)=true() and not($opt/no_lemmatisation)) then
  (
    let 
      $input:=doc($input_file),
      $lemmatise:=$input/text/@lemmatiser
      
    return
    (
      copy $doc2:=$doc modify
      (
          for $sentences in $input/text/sentence 
            let $parent_pid:=$sentences/@parent_pid group by $parent_pid 
              let $parent_el:=$doc2//*[@cc:pid=$parent_pid]
          return
          (
            for $lem_s in $sentences 
              let 
                $n:=$lem_s/@n, 
                $s:=$parent_el//cc:s[@parent_pid=$parent_pid and @n=$n]
            return
            if ($s) then
            (
              for $w in $lem_s/w return
               
                insert node 
                (: element { QName($cc:tei,"w") }{attribute {"orig"}{$w/text()}, attribute {"lemma"}{$w/@lem/data()}, attribute {"pos"}{$w/@pos/data()}} :)
                element cc:w{attribute {"lemma"}{$w/@lem/data()}, attribute {"pos"}{$w/@pos/data()},$w/text()}
                
                (: <w pos="{$w/@pos}" lemma="{$w/@lem}" orig="{$w/text()}"/> :)
                into $s
              (: insert node attribute lemmatised{string-join($lem_s/w/@lem," ")} into $s,
              if (cc:opt($opt,"pos_tagging",true())=true()) then
              (              
                insert node attribute MORH{string-join($lem_s/w/@pos," ")} into $s
              ) :)
            )
          )
      )
      return 
      (
        cc:insert_xenoData($doc2,<lemmatisation lemmatiser="{$input/text/@lemmatiser}">{cc:now()}</lemmatisation>,"prep",false()),
        file:delete($input_file)
      )
    )
    
  )
  else (:lemmatisation file does not exist - maybe was the lemmatisation cancelled:)
  (
      cc:insert_xenoData($doc,<lemmatisation lemmatiser="no lemmatisation">{cc:now()}</lemmatisation>,"prep",false())
  )
};

declare function cc:export_sentences_for_lemmatiser($doc,$options)
{(: export sentences into file that will than used by lemmatiser:)
  let $path:=cc:get_state_path($options/file/text(),"sentences")
  return
  (
    if (not($options/no-lemmatisation) and not($options/no_lemmatisation)) then
    (
      let $sentences:=cc:get_sentences_NEW($doc,true())
      
      return
      (
        file:write($path,<text file="{cc:opt($options,'file')}" timestamp="{cc:now()}">{$sentences}</text>)
        
      )
    )
    else
    (    
 
      file:write($path,"no lemmatisation")
    )  
      
  )
};

declare function cc:pre-analysis($options)
{
  prof:dump("starting pre-analysis"),
  let 
  $doc:=doc($options/file),
  $abbr:=
    if (cc:opt($options,"analyse_abbreviations")=>lower-case()!="false") then
      cc:analyze_abbreviations($doc)
    else
      <!-- Abbreviation analysis not performed -->,
  $tei_problems:=cc:analyze_tei_problems($doc),
  $warning:=if(count($tei_problems/*)>0) then cc:raise_warning("","TEI problems!",cc:opt($options,"error_log_file",""),$options/file/text()),
  $xenoData:=
  <pre-analysis timestamp="{cc:now()}">
    <possible_abbreviations>{$abbr}</possible_abbreviations>
    {
      $tei_problems
    }
  </pre-analysis>,
  
  $instructions:=
  <!-- 
    ### instructions for processing ###
    ### uncomment this node and remove ###-enclosed comments ###
    ### delete any unncessary items and insert right values ###
    ### if you do not need any special options, delete this node completely ###
    <prep-instructions xmlns="http://mlat.uzh.ch/2.0">
      <abbreviations add_or_replace="ADD|replace ###replace=replace default (valid also for all following @add_or_replace. ADD=default) ###">
        <plain ### for simple string abbreviations ###>abbreviation1 abbreviation2 ...</plain>
        <rgx ### regular expression abbreviations ###>
          <abbr>abbreviations</abbr>
          ...
        </rgx>
      </abbreviations>
      <paratext_elements add_or_replace="ADD|replace">### space-separated list of names of paratext elements. Default: app rdg note graphic ###</paratext_elements>
      <hierarchy_elements add_or_replace="ADD|replace">### space-separated list of hierarchy-constructing elements. Default: div p lg head argument table list ### </hierarchy_elements>
      <text_containing_elements add_or_replace="add|replace">### space-separated list elements considered text containers. Default: div p lg head argument table list ### </text_containing_elements>
      <cancel_tokenization>### list of elements, where no sentence tokenization occurs ###</cancel_tokenization>
      <process_front>TRUE|false ### whether tei:front elements should be processed, lemmatised, sphinx-indexed. Can be also inserted as @cc:process="false" into the appropriate node ### </process_front>
      <process_back>TRUE|false ### dtto as for tei:back ### </process_back>
      
      <no_lemmatisation/> ### insert, if you don't want to perform the lemmatisation (e. g. for texts in languages you don't have any lemmatiser). Otherwise remove this element!!! ###
    </prep-instructions>
  
   -->,

  
  $doc_xenoData_inserted:=cc:insert_xenoData($doc,$xenoData),
  $doc_xenoData_instructions:=cc:insert_xenoData($doc_xenoData_inserted,$instructions,"",false())
  (: return $doc_xenoData_instructions :)
  return file:write($options/file,$doc_xenoData_instructions)
};


