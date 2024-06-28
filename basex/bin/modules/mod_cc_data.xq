(:this module contains functions for management of the corpus_corporum_data database, i. e. inserting the (prepared*) files, their monitoring etc.:)

(:context corpus_corporum_data:)

module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace html="http://www.w3.org/1999/xhtml/";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "general_functions.xq", "mod_text_loading.xq", "provide_text_new.xq";
declare variable $cc:dbg:="/var/www/html/data/_dbg_dump.xml";



declare function cc:cc_data_consistency_check()
{
  let $db:=db:open("corpus_corporum_data") return
  for $f in $db/file_list/file 
    let 
      $last_reload:=try{xs:dateTime($f/last_reload)}catch*{""},
      $file_exists:=file:exists($f/loaded_file),
      $time_diff:=
        if ($file_exists=true()) then
          seconds-from-duration(file:last-modified($f/loaded_file)-$last_reload)
        else
          0
          
  return
  (
    $last_reload,file:last-modified($f/loaded_file),
    $time_diff
  )
  
  
};

declare function cc:update_metadata()
{
  cc:update_metadata(map{"check_if_loaded":true(),"update_counts":true()})
};
declare function cc:update_metadata($opt)
{(:updates DB metadata after rotating the DB:)
  let $loaded_documents:=db:list("corpus_corporum_data"),
  
  (:first, update, which texts are loaded:)
  $upd1:=
  if ($opt?check_if_loaded=true() and false()) then
  (
       for $T in $cc:meta/cc_texts/item 
      let
        $cc_idno:=$T/cc_idno/text(),
        $is_loaded:=index-of($loaded_documents,$cc_idno)>0
    return
      if ($T/is_loaded) then
      (
        (: if ($T/is_loaded/data()!=string($is_loaded)) then :) 
          replace value of node $T/is_loaded with string($is_loaded)
        
      )
      else
        insert node <is_loaded>{string($is_loaded)}</is_loaded> into $T
    )
  ,
  $file_list:=$cc:data/file_list,
  $upd2:=
  if ($opt?update_count=true() or true()) then
  (
    let $files_to_update:=
    if ($opt?after) then 
      for $f in $file_list/file 
        let $last_date:=if ($f/last_reload) then xs:dateTime($f/last_reload) else xs:dateTime($f/first_loaded)
        where $last_date > xs:dateTime($opt?after)
      return $f/cc_idno/data()
    else
      db:list("corpus_corporum_data")
    return
    
      for $D in $cc:data/(* except file_list)
        let $cc_idno:=db:path($D)
        where index-of($files_to_update,$cc_idno)>0
      return
      (
        cc:insert_statistics_into_text_item($D) ,
        $cc_idno
      )
  )
     
  return 
  (
    cc:indexate("corpus_corporum_metadata"),
    cc:export_metadata(""),
    "Update finished, DB indexated and exported. " || count($upd2) || " items updated."
  )
};


declare function cc:insert_statistics_into_text_item($doc)
{
  (:
    update metadata for a text
  :)
  let
  $true_doc:=if ($doc instance of element(*) or $doc instance of document-node()) then $doc else cc:provide_document($doc),
  
  $insert_value:=function($item,$vname,$value)
  {
    if ($item/*[local-name()=$vname]) then
      replace value of node $item/*[local-name()=$vname] with $value
    else
      insert node element{$vname}{$value} into $item
  },
  $st:=
    if ($true_doc/tei:TEI) then
      $true_doc/tei:TEI/tei:teiHeader/tei:xenoData/statistics
    else
      $true_doc/tei:teiHeader/tei:xenoData/statistics
   , 
  $cc_idno:=db:path($true_doc),
  $void:=prof:dump($cc_idno),
  $T:=cc:item($cc_idno),
  $e:=if ($T=()) then error((),"No text item for " || db:path($doc)),
  $files:= $cc:data/file_list/file[cc_idno=$cc_idno]
  return
  (
   $insert_value($T,"sentence_count",$st/sentences/data()),
   $insert_value($T,"word_count",$st/words/data()),
   if ($files/loaded_file!="") then
     $insert_value($T,"loaded_size",file:size($files/loaded_file))
   else
     error((),$cc_idno || " " || $T/name_data/data()),
   if ($files/original_file!="") then
     $insert_value($T,"original_size",file:size($files/original_file))
   else
     error((),$cc_idno || " " || $T/name_data/data()),
   
   cc:md_last_modification($T)
  )
  
};

declare function cc:check_idno_duplicities($filelist)
{
  let $cc_idnos_and_files:=
    for $f in $filelist where ends-with($f,".loaded.xml")
      let 
        $D:=doc($f),
        $cc_idno:=$D//tei:teiHeader/tei:xenoData/loaded/cc_idno/data()
    return 
      map{"cc_idno":$cc_idno,"file":$f}
  ,
  $cc_idnos:= $cc_idnos_and_files?cc_idno,
  $result:=
  
    for $cc_idno in $cc_idnos_and_files
      let 
        $hits:= count( index-of($cc_idnos,$cc_idno?cc_idno))
      where
        $hits>1
    return
      
      $cc_idno
  return
  if (count($result)>0) then
  (
    prof:dump($result),
    error((), count($result) ||  " duplicities found! Can't proceed, before they are solved!")
  )
  else
    prof:dump("No duplicities found. Loading can proceed.")
    
};

declare function cc:insert_loaded_files($opt)
{(:insert *.loaded.xml files in a folder in one DB call :)
  let
    $data_WORK_exists:=
      if (db:exists("corpus_corporum_data_WORK") =false()) then 
        cc:raise_error("NO_WORK_COPY","Working copy of corpus_corporum_data DB doesn't exists. Run cc_rotate command first.","","")
      else
        true(),
    $folder1:=
    if ($opt instance of xs:string) then
    (
      $opt    
    )
    else
      $opt/folder/text(),
  $folder2:=
    if (ends-with($folder1,"/loaded") or ends-with($folder1,"/loaded/")) then
      $folder1
    else
      file:resolve-path("loaded",$folder1),
  $files:=file:list($folder2),
  $list:=$cc:data_WORK/file_list  
    
  return
  
  
  for $f in $files 
    let $p:=file:resolve-path($f,$folder2)
    where ends-with($f,".loaded.xml")
  return
  
  
  cc:insert_file(<opt><file>{$p}</file><no_filelist_export>true</no_filelist_export></opt>),
  
  cc:export_filelist($cc:data_WORK)
    
};



declare function cc:export_filelist($db)
{
  let $path:=if (db:name($db)="corpus_corporum_data_WORK") then
    $cc:home_folder || "/data/file_list_WORK.xml"
  else
    $cc:home_folder || "/data/file_list.xml"
  return
  (
    file:write($path,<!-- NB: this is only an informational export from the corpus_corporum_data database. Any changes in this file will have no impact on the database! To delete or add data to the DB, use web or command line interface. -->
  ),
    file:append($path,$db/file_list) 
  )
};
declare function cc:insert_file($opt)
{
  let
    $data_WORK_exists:=
      if (db:exists("corpus_corporum_data_WORK") =false()) then 
        cc:raise_error("NO_WORK_COPY","Working copy of corpus_corporum_data DB doesn't exists","","")
      else
        true(),
    $actual_file:=cc:get_state_path($opt/file/text(),"loaded"),
    $original_file:=cc:get_original_path($opt/file/text())     
  return
  (
    if (ends-with($actual_file,".loaded.xml")) then
    (
      let
        $doc:=doc($actual_file),
        $cc_idno:=$doc//tei:teiHeader/tei:xenoData/loaded/cc_idno/text(),
        $list:=$cc:data_WORK/file_list,
        $this_file_entry:=$list/file[original_file/text()=$original_file]
      return
      (
        if ($this_file_entry) then
        (
            if ($this_file_entry/last_reload) then
            (
              replace value of node $this_file_entry/last_reload with cc:now()
            )
            else
            (
              insert node <last_reload>{cc:now()}</last_reload> into $this_file_entry
            ),
            db:replace("corpus_corporum_data_WORK",$cc_idno,$actual_file),
            "File " || $actual_file || " reloaded."           
        )
        else
        (
            insert node 
            <file>
              <original_file>{$original_file}</original_file>
              <loaded_file>{$actual_file}</loaded_file>
              <first_loaded>{cc:now()}</first_loaded>
              <cc_idno>{$cc_idno}</cc_idno>
            </file>
            into $list,
          
          db:add("corpus_corporum_data_WORK",$actual_file,$cc_idno),
          "File " || $actual_file || " inserted into database."
        ),
        (
          if ($opt/no_filelist_export/text()!="true") then
          (
            (: if ($list/@last_db_update) then
              replace value of node $list/@last_db_update with cc:now()
            else
              insert node attribute last_db_update{cc:now()} into $list, :)
            cc:export_filelist($cc:data_WORK)
          )
        )
      )
    )
    else
    "File is not definitivelly prepared for loading. Run BX function cc:make_loadable_file. " || $actual_file
  )
};




declare function cc:insert_onload_text_statistics($doc,$opt)
{
  let 
  $e:=cc:count_entites_of_text($doc,$opt),
  $wc:=$e?words_count,
  $wcp:=$wc div 100,
  $stat_node:=
  <statistics when="{cc:now()}">
    <sentences>{$e?sentences_count }</sentences>
    <tokens>{$e?tokens_count}</tokens>
    <words>{$e?words_count}</words>
    <words_by_language>
    {
      let 
        $wbl:=$e?words_by_language,
        $wcp_lu:=sum(map:for-each($wbl,function($k,$v){$v})) div 100
      return
      
      for $key in map:keys($wbl) let $v:=map:find($wbl,$key),$perc:=if ($wcp_lu!=0) then round($v div $wcp_lu,1) else 0 order by $v descending return
      element {$key}{attribute{"usage"}{$perc},$v}
      
    }
    </words_by_language>
    <words_by_alphabet>
    {
      let $wba:=$e?words_by_alphabet return
      for $key in map:keys($wba) let $v:=map:find($wba,$key),$perc:=if ($wcp!=0) then round($v div $wcp,1) else 0 where $v>0 order by $v descending return
      element {$key}{attribute{"usage"}{$perc},$v}
      
    }
    </words_by_alphabet>
    {
      cc:summarize_lemmata($doc,$opt)
    }
  </statistics>
  return cc:insert_xenoData($doc,$stat_node,"",true())
  (: return $stat_node :)
};


declare function cc:cc_idno_inserted($doc)
{
  let $cc_idno:=$doc/tei:TEI/tei:text/@cc:pid/data() return
  if (matches($cc_idno,"^[0-9]+")) then
    matches($cc_idno,"^[0-9]+")/fn:matches/text()
  else
    ""
  
};


declare function cc:find_cc_idno_by_path($opt)
{
  let 
  
  $Ts:=
    for $T in $cc:meta/cc_texts/item where $T/xml_file_path/text()=cc:get_original_path($opt/file/text()) return 
  $T
  return 
  if (count($Ts)=1) then $Ts/cc_idno/data()
  else if (count($Ts)=0) then 
    cc:raise_error("","No item with corresponding xml_file_path! (" || cc:get_original_path($opt/file/text()) || ")",cc:opt($opt,"error_log_file",""),$opt/file/text())
  else
    cc:raise_error("","More items with corresponding xml_file_path found! (path " ||
     cc:get_original_path($opt/file/text()) || " found in items " || (for $i in $Ts return $Ts/cc_idno/data()),cc:opt($opt,"error_log_file",""),$opt/file/text())
 
};

declare function cc:supply_cc_idno($doc,$cc_idno)
{
  (: let $doc2:=$doc return :)
  
  copy $doc2:=$doc modify
  (
    for $path_id in $doc2//*/(@cc:pid | @parent_pid) return
      replace value of node $path_id with replace($path_id/data(),"\?\?\?\?",$cc_idno)
  )
  return 
  cc:insert_xenoData($doc2,<cc_idno>{$cc_idno}</cc_idno>,"loaded",true())
};
declare function cc:clean_end_s($doc)
{
   copy $doc2:=$doc modify
   (
     for $s in $doc2//cc:s[@end] return
       delete nodes $s/@*
   )
   return $doc2
};

declare function cc:summarize_lemmata($doc,$opt)
{
  let $all_lemmata:= 
  for $s in $doc//cc:s return
  (: $s/cc:w/@lemma/data() :)
    tokenize($s/@lemmatised)
    ,
  $grouped:=
  for $lemma in $all_lemmata let $l:=$lemma group by $l let $n:=count($lemma) order by $n descending 
  return
  (
    <lemma count="{$n}">{distinct-values($lemma)}</lemma>
  )
  return
  <lemmata n="{count($grouped)}">
    {$grouped}
  </lemmata>
  
};

declare function cc:copy_statistics_to_POS_file($opt)
{
  if ($opt instance of map(*)) then
  (
    let
      $doc:=$opt?doc,
      $output:=$opt?output,
      $def_POS_path:=cc:get_state_path($opt?path,"POS"),
      $POS_path:=
        if ($output="" or not($output) or $output="default") then
         $def_POS_path
       else
         replace($def_POS_path,".POS.xml",".POS." || $output || ".xml"),
         
      $POS_doc:=doc($POS_path),
      $sn:=$doc/tei:TEI/tei:teiHeader/tei:xenoData/cc:statistics
    
    return
    copy $POS_doc2:=$POS_doc modify
    (
      insert node $sn as last into $POS_doc2/tei:TEI/tei:teiHeader/tei:xenoData
    )
    return
    file:write($POS_path,$POS_doc2)
  )
  
};

declare function cc:analyze_tei_problems($doc)
{
  let 
    $wrong_body_front_back:=
      for $b in $doc//tei:body where not($b/parent::tei:text)
      return 
      $b,
    $text_nodes_under_div:=
      for $tn in $doc//tei:text//node()[local-name(.)=""] where local-name($tn/parent::*)=>starts-with("div") and normalize-space($tn)!=""
      return 
      $tn,
      
    $divs_under_p:=
      for $p in $doc//tei:text//tei:p[count(.//*[local-name(.)=>starts-with("div")])>0]
      return
      $p,
      
    $missing_bodies:=
      for $t in $doc//tei:text where count($t/tei:body)=0 and count($t/tei:group)=0
      return
      $t
    
  return
  <tei_problems>
  {
    if (count($wrong_body_front_back)>0) then
      <wrong_nested_body_fron_back>{count($wrong_body_front_back)}</wrong_nested_body_fron_back>,
    if (count($text_nodes_under_div)>0) then
      <text_nodes_under_div>{count($text_nodes_under_div)}</text_nodes_under_div>,
    if (count($divs_under_p)>0) then
      <divs_under_p>{count($divs_under_p)}</divs_under_p>,
    if (count($missing_bodies)>0) then
      <missing_body_element>{$missing_bodies}</missing_body_element>
  }
  </tei_problems>  
};




declare function cc:analyze_abbreviations($doc)
{(:this function goes through all possible sentence breaks with fullstop and tries to find, if there are words allways followed by FS - possibly abbreviations:)
  let $node_to_use:=$doc//tei:text
  return
  let $all_words:=
    for $tn in $node_to_use//node()[local-name(.)=""] where normalize-space(data($tn))!="" return tokenize($tn),
    (:to be reevaluated after some experiences, can be counted in a different way... (maybe not as ratio of all words, but as ratio of all end-sentence-words?) idk:)
  $treshhold:=if (floor(count($all_words) div 10000)>3) then floor(count($all_words) div 10000) else 3,
  $before_fs:=
    for $w in $all_words where matches($w,".*[^aeiouyAEIOUY]\.$") return substring-before($w,".") (:NB: conventionally, abbreviations don't end in a vocal!:),
  $not_before_fs:=
    for $w in $all_words where not(matches($w,".+\.$")) return replace($w,"[,?'\[\];:]",""),
  $only_before_fs:=
    for $w in $before_fs where count(index-of($not_before_fs,$w))=0 let $f:=$w, $n:=count($w) group by $f where count($w)>=$treshhold return <word n="{count($w)}">{distinct-values($w)}</word>,
  $results:=
    for $w in $only_before_fs let $n:=number($w/@n),$word:=$w/text()
    where 
      string-length($word)>1
    order by $n descending return $w
  return
  <abbreviations treshold="{$treshhold}">{$results}</abbreviations>

};

declare function cc:merge_options($options1, $options2)
{
  copy $new:=$options1 modify
  (
    for $o in $options2/* 
      let 
        $replace:=if ($o/@add_or_replace/data()=>lower-case()="replace") then true() else false(),
        $existing:=cc:opt($options1,$o=>local-name())
    return
      if ($replace=false()) then
      (
        if ($existing) then
          let $type:=cc:var_type($existing) return
          (
            if ($type="string") then
            (
              if ($new/*[local-name()=$o=>local-name()]) then
                replace value of node $new/*[local-name()=$o=>local-name()] with ($existing || " " || $o/data())
              else
                insert node element{local-name($o)}{$existing || " " || $o/data()} into $new
            )
            else
            (
              if ($new/*[local-name()=$o=>local-name()]) then
                insert node $o into $new
              else
                insert nodes ($o,$existing) into $new
            )
            
          )
        else
          insert node element{local-name($o)}{$existing || " " || $o/data()} into $new
      )
      else if ($replace=true()) then
      (
        let $all_nodes:=$new/*[local-name()=local-name($o)] return
        (
          delete nodes $all_nodes
        ),
        insert node $o into $new
      )
  )
  return $new
};

declare function cc:update_options($options,$option_name,$new_value,$add)
{
  copy $new:=$options modify
  (
    let $option:=
      for $o in $new/* where local-name($o)=$option_name return $o
    return
    if (not($option)) then
    (
      insert node element {$option_name} {$new_value} into $new
    )
    else
    (
      if ($add=true()) then
        replace value of node $option with $option/data() || " " || $new_value
      else
        replace value of node $option with $new_value
    )
  )
  return $new
};

declare function cc:default_options($option_name)
{
  if ($option_name="paratext_elements") then
  (
      "app rdg note graphic"
  )
  else if ($option_name="hierarchy_elements") then
  (
      "div p lg head argument table list opener closer postscript epigraph figure"
  )
  else if ($option_name="text_containing_elements") then
  (
      "div p lg head argument table list opener closer postscript epigraph figure"
  )
  else if ($option_name="abbreviations") then
  (
    doc($cc:admin_folder || "/abbreviations.xml")/abbreviations
  )
   else if ($option_name="tokenization_canceling_elements") then
  (
      ""
  )
};
declare function cc:opt($opt,$option_name)
{
  cc:opt($opt,$option_name,<null/>)
};
declare function cc:opt($options,$option_name,$default)
{
  let $rv:=
  (
    let $option:=
      for $o in $options/* where local-name($o)=$option_name return $o
    return
   
    if (not($option)) then
    (
      if ($default instance of element()) then
        if ($default=<null/>) then
           cc:default_options($option_name)
        else
          $default
      else
        $default
       
    )
    else
    (
      if ($option/*=>count()=0) then
        $option/data()
      else
        $option
  
    )  
  )
  return
  $rv
  
};

declare function cc:insert_xenoData($doc,$xeno)
{
  cc:insert_xenoData($doc,$xeno,"",true())
};

declare function cc:insert_xenoData($doc,$xeno,$on_xpath,$replace)
{
  copy $doc2:=$doc modify
  (
    if ($doc2/tei:TEI/tei:teiHeader/tei:xenoData) then
    (
      let $xeno2:=
      (
        typeswitch($xeno)
        case comment() return
        ( (:in the preanalysis, comment is inserted into xenoData. We don't want it to 
        be inserted multiple times if the analysis runs more than once, but it is rather tricky 
        to detect comment as $xeno and whether the comment already exists in tei:xenoData :)
          let $matching_comments:=
            for $c in $doc2/tei:TEI/tei:teiHeader/tei:xenoData/comment() where $c/data()=$xeno/data() return
            $c (:NB: with text() doesn't work:)
          return
          (
            if (count($matching_comments)>0) then
            ( (:this comment already exists:) 
            ) 
            else
            (
              $xeno
            )
          )
        )
        case element() return
          $xeno
        default return ()
      )
      return 
      if ($xeno2) then
      (
        let $parent_item:=cc:dynamic-path($doc2/tei:TEI/tei:teiHeader/tei:xenoData,$on_xpath )
        return 
          if($parent_item) then
            (
            if (cc:dynamic-path($parent_item,local-name($xeno2)) and $replace=true()) then
            (:replacing already existing node:)
              replace node cc:dynamic-path($parent_item,local-name($xeno2)) with $xeno
            else
              insert node $xeno as last into $parent_item
            )
          else
            insert node (element {$on_xpath}{$xeno2}) as last into $doc2/tei:TEI/tei:teiHeader/tei:xenoData
      )
      
      
    )
    else
      insert node <xenoData xmlns="http://www.tei-c.org/ns/1.0" xmlns:cc="http://mlat.uzh.ch/2.0">{
        if ($on_xpath!="") then
          element {$on_xpath}{$xeno}
        else
          $xeno
      }</xenoData> as last into $doc2/tei:TEI/tei:teiHeader
  )
  return $doc2    
  
};

declare function cc:read_xenoData($doc,$property)
{
  let $xd:=$doc/tei:TEI/tei:teiHeader/tei:xenoData return
  if ($xd) then
  ( (: cc:dynamic-path($parent as node(), $path2 as xs:string ) :)
    cc:dynamic-path($xd,$property)
  )
  else
  ()
};

declare function cc:get_sentences_NEW($doc,$front_and_back)
{
  let 
     $sentences:=
      for sliding window $sentence in $doc//node()[./self::cc:s or (local-name(.)="" and normalize-space(data(.))!=""and count(./ancestor::*[@cc:paratext])=0)]
        start $se when $se/self::cc:s and $se/@parent_pid and not($se/@end)
        end $ee when $ee/self::cc:s and not ($se is $ee)
        where data(data($sentence)!="")
      return
        <sentence  parent_pid="{$se/@parent_pid/data()}" n="{$se/@n/data()}">{$se,string-join($sentence)}</sentence>
    return  
    $sentences
};

declare function cc:export_spinx_index($index)
{
  
};

declare function cc:export_sentences_for_sphinx($doc,$start_id)
{
  
  let $sentences:=cc:get_sentences_NEW($doc,true())
  return
  for $s in $sentences count $i return
  (
    replace(serialize(
    <sphinx-document id="{$start_id+$i}">
      <path>{$s/cc:s/@parent_pid || "," || $s/cc:s/@n}</path>
      <sentence>{$s/text()}</sentence>
      <lemmatised_sentence>{$s/cc:s/@lemmatised}</lemmatised_sentence>
      <work_idno></work_idno>
      <author_idno></author_idno>
      <corpus_idno></corpus_idno>
      <primary_corpus_idno></primary_corpus_idno>
      <author></author>
      <work></work>
      <year></year>
    </sphinx-document>),"sphinx-document","sphinx:document")
    
  )
};
declare function cc:count_words_by_language($doc)
  {
    let $xml_langs:=distinct-values($doc//tei:text//*[@xml:lang]/@xml:lang/data()),
    $def_lang_n:=$doc/tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language[1],
    $def_lang:=
      if ($def_lang_n) then
        $def_lang_n/@ident/data()
      else
        "lat",      
    $used_languages:=distinct-values(($xml_langs,$def_lang)),
    $lang_array:=array{$used_languages},
    $usage_array_seq:= 
      for $tn in $doc//tei:text//node()
      where local-name($tn)="" and not($tn/ancestor::*[@cc:paratext]) and normalize-space(data($tn))!=""
        let 
          $xml_lang:=$tn/ancestor::*[@xml:lang][1],
          $lang:=if ($xml_lang) then $xml_lang/@xml:lang/data() else $def_lang,
          $tokenized_node:=tokenize($tn/data()),
          $w_count:=count(for $tw in $tokenized_node let $w:=analyze-string($tw,"[\p{L}]+")/fn:match=>string-join() where matches($w,"^[\p{L}]+$") return $w),
          $seq:=array{for $i in 1 to array:size($lang_array) return if (array:get($lang_array,$i)=$lang) then $w_count else 0}
      return
        $seq
    ,
    $separate_maps:=
      for $i in 1 to array:size($lang_array) return 
        map:entry(array:get($lang_array,$i),sum(cc:array_column($usage_array_seq,$i)))
    return
    map:merge($separate_maps)
    
};
declare function cc:count_words_by_alphabet($words)
{
  
  let 
   
    $alphabets:=
    for $w in $words return
    (
      if (matches($w,"^[&#x0041;-&#x024F;]+$")) then 
      (:latin - eq. of \p{IsBasicLatin-IsLatinExtendedB} (the unicode blocks can be used in range, so it would be necessary to list them all; this is better:)
        [1,0,0,0]
      else if (matches($w,"^[\p{IsGreekandCoptic}\p{IsGreekExtended}]+$")) then
        [0,1,0,0] (:greek:)
      else if (matches($w,"^[\p{IsHebrew}&#xFB1D;-&#xFB4F;]+$")) then
        [0,0,1,0] (:hebrew:)
      else
        [0,0,0,1] (:any other alphabet:)
    )
    return
    (
      let
        $latin:=sum(cc:array_column($alphabets,1)),
        $greek:=sum(cc:array_column($alphabets,2)),
        $hebrew:=sum(cc:array_column($alphabets,3)),
        $other:=sum(cc:array_column($alphabets,4))
      return
      map{"latin":$latin,"greek":$greek,"hebrew":$hebrew,"other":$other}
    )
};
declare function cc:count_entites_of_text($doc,$opt)
{ (:this function counts different entities of the text: sentences, tokens, words, words by alphabet (latin, greek, hebrew, other - possibly can be added other:)

  let
  $sentences:=cc:get_sentences_NEW($doc,false()),
  $sentences_count:=count($sentences),
  $tokenized_sentences:=
    (
      for $s in $sentences return tokenize($s/text(),"[\s\n]")
    ),
  $tokens_count:=count($tokenized_sentences),
  $true_words:=
    ( (:now we select all true words, i. e. not things like "[1], * etc":)
      for $tw in $tokenized_sentences let $w:=analyze-string($tw,"[\p{L}]+")/fn:match=>string-join() where matches($w,"^[\p{L}]+$") return $w
    ),
  $true_words_count:=count($true_words),
  $count_verses:=count($doc//tei:text//tei:l),
  $words_by_alphabet:=cc:count_words_by_alphabet($true_words),
  $words_by_language:=cc:count_words_by_language($doc)
      
  return
  map
  {
    "sentences_count":$sentences_count,
    "tokens_count":$tokens_count,
    "words_count":$true_words_count,
    "words_by_alphabet":$words_by_alphabet,
    "words_by_language":$words_by_language
  }
};

declare function cc:raise_error($err_name,$err_desc,$log_file,$xml_file_path)
{
  cc:raise_error($err_name,$err_desc,$log_file,$xml_file_path,true())
};

declare function cc:raise_warning($err_name,$err_desc,$log_file,$xml_file_path)
{
  cc:raise_error($err_name,$err_desc,$log_file,$xml_file_path,false())
};



declare function cc:raise_error($err_name,$err_desc,$log_file,$xml_file_path,$raise_error)
{
  if ($log_file!="") then
  (
    let $log_text:=file:name($xml_file_path) || ":    " || $err_name || " (" || $err_desc || ")" 
    return
    file:append-text($log_file,$log_text)
  ),
  if ($raise_error=true()) then
  (
    error((),$err_desc)
  )
  
  
};


declare function cc:fix_filelist()
{
  for $f in $cc:data/file_list/file where not($f/cc_idno) or $f/cc_idno=""
  let $T:=$cc:meta/cc_texts/item[xml_file_path=$f/original_file],
  $cc_idno:=$T/cc_idno/data()
  return
  replace value of node $f/cc_idno with $cc_idno
  
};

declare function cc:create_work_copy()
{ 
 (:production to working:)
  if (db:exists("corpus_corporum_data_WORK")=false()) then
  (
         db:copy("corpus_corporum_data","corpus_corporum_data_WORK"),
         "Working copy created."
  )
  else
    "Working copy already exists."
};

declare function cc:rotate()
{
  if (db:exists("corpus_corporum_data_WORK")) then
  (
    prof:dump("WORK exists."),
    if (db:property("corpus_corporum_data_WORK","attrindex")=false()) then
    (
      prof:dump("No index. Indexing."),
      cc:indexate("corpus_corporum_data_WORK")
    )
    else
      prof:dump("Index exists."),
    db:alter("corpus_corporum_data","corpus_corporum_data_bck"),
    db:alter("corpus_corporum_data_WORK","corpus_corporum_data")
  )
  else
    error((),"The 'corpus_corporum_data_WORK' DB does not exist.")
};