module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace sphinx="sphinx";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "log.xq","get_sentence.xq","text_manipulation.xq","general_functions.xq","collection_manipulation.xq","provide_text_new.xq";
declare variable $cc:sphinx_folder:="/var/www/html/sphinx/";


declare function cc:get_texts_of_index($index)
{
  cc:get_texts_of_index($index,false())
};

declare function cc:get_index_of_text($cc_idno)
{
    (: let $si:=cc:get_sphinx_indices() return
    for $i in $si/cc:index where number($i/cc:s)<=number($cc_idno) and number($i/cc:e)>=number($cc_idno) return $i/@n :)
    
};

declare function cc:get_sphinx_indices()
{(:2024:)
  if ($cc:config/cc:config/cc:sphinx/cc:indices) then
    $cc:config/cc:config/cc:sphinx/cc:indices
  else
    cc:calculate_sphinx_indices()
  
};


declare function cc:get_texts_of_index($index,$text_informations)
{(:2024:)
  let $indices:=cc:get_sphinx_indices(), 
  $e:=if (number($index)=count($indices/cc:index)) then (:last index has an "open" end :)
    number(cc:next_cc_idno(false()))
  else
    number($indices/cc:index[@n=$index]/cc:e)
  
  return
  (
    if ($text_informations=false()) then
      <cc_idnos from="{$indices/cc:index[@n=$index]/cc:s}" to="{$e}">
      {
        for $T in $cc:meta/cc:cc_texts/cc:item where number($T/cc:cc_idno/text())>=number($indices/cc:index[@n=$index]/cc:s) and number($T/cc:cc_idno/text())<=number($e) return
        <cc_idno>{$T/cc:cc_idno/text()}</cc_idno>
      }
      </cc_idnos>
    else
      <cc_idnos from="{$indices/cc:index[@n=$index]/cc:s}" to="{$e}">
      {
        
        for $T in $cc:meta/cc:cc_texts/cc:item 
          
          
          let $W:=cc:item($T/cc:work_idno),
              $A:=cc:item($W/cc:author_data/cc:primary_author_idno)
          
           where number($T/cc:cc_idno/text())>=number($indices/cc:index[@n=$index]/cc:s) and number($T/cc:cc_idno/text())<=number($e)  return
        <cc_idno 
          primary_corpus_idno="{data($T/cc:primary_corpus_idno)}"
          corpus_idno="{data($T/cc:corpus)}"
          work_name="{$W/cc:name_data/cc:name/data()}"
          work_idno="{$T/cc:work_idno}"
          author_name="{$A/cc:name_data/cc:name/data()}"
          author_idno="{$A/cc:cc_idno/data()}"
          year="{cc:extract_year($W/cc:time_data,$A/cc:time_data)}"
        >{$T/cc:cc_idno/text()}</cc_idno>
      }
      </cc_idnos>
  )
};
declare function cc:extract_year($work_time_data,$author_time_data)
{
  let $w_year:=if ($work_time_data) then data($work_time_data/cc:event[1]/cc:date1/cc:year) else "0",
  
  $a_year1:=if ($w_year="0" and $author_time_data) then
   data($author_time_data/cc:event[@what="floruit_to"]/cc:date1/cc:year) else "0",
  $a_year2:=if ($w_year="0" and $author_time_data) then
   data($author_time_data/cc:event[@what="died"]/cc:date1/cc:year) else "0",
  $a_year3:=if ($w_year="0" and $author_time_data) then
   data($author_time_data/cc:event[@what="floruit_from"]/cc:date1/cc:year) else "0",
  $a_year4:=if ($w_year="0" and $author_time_data) then
   data($author_time_data/cc:event[@what="born"]/cc:date1/cc:year) else "0"
  
  return 
  if ($w_year!="0" and $w_year!="") then $w_year
  else
    if ($a_year1!="0" and $a_year1!="") then $a_year1
    else
      if ($a_year2!="0" and $a_year2!="") then $a_year2
      else
         if ($a_year3!="0" and $a_year3!="") then $a_year3
         else
           if ($a_year4!="0" and $a_year4!="") then $a_year4
           else
             10000
};




declare function cc:export_sentences_of_text_for_sphinx($opt)
{(:2024:)
  let
  $text_info:=$opt?text_info,
  $text_cc_idno:=string($text_info/text()),
  $start_id:=xs:integer(file:read-text($cc:sphinx_folder || "id_counter")),
  $index_type:=if ($opt?index_type) then $opt?index_type else "s",
  $index_file:=$opt?index_file,
  $w_idno:= $text_info/@work_idno/data(),
  $w_name:= $text_info/@work_name/data(),
  $a_idno:= $text_info/@author_idno/data(),
  $a_name:= $text_info/@author_name/data(),
  $c_idno:= $text_info/@corpus_idno/data(),
  $pc_idno:=(:primary_corpus:)
  if ($text_info/@primary_corpus_idno/data()!="") then
    $text_info/@primary_corpus_idno/data()
  else
    $c_idno,
  $y:=$text_info/@year/data() 
  return
  
  if ($index_type="s" or true()) then
  (
    let $s:=cc:provide_all_sentences($text_cc_idno),
    $pos_in_index:=if ($opt?pos_in_index) then $opt?pos_in_index else "??",
    $index_name:=if ($opt?index_name) then $opt?index_name else "???",
    $total_text_in_index:=if($opt?total_text_in_index) then $opt?total_text_in_index else "?",
    $void:=prof:dump("      [" || $index_name || "]:"  || $pos_in_index || "/" || $total_text_in_index || " (" || $a_name || ", " || $w_name || ": " || count($s) || " sentences.)"),
    $export:=
    (
    for $sentence at $i in $s
      let
        $pid:=$sentence/@pid,
        $lemmatised:=
          if ($sentence/s/@lemmatised) then
            $sentence/s/@lemmatised/data()
          else
            string-join($sentence/s/w/@lemmatised/data()," "),
        $sentence_norm1:=replace(string-join($sentence/text()),"&amp;c","etc"),
        $sentence_norm2:=replace($sentence_norm1,"&amp;",""),
        $sentence_norm3:=replace($sentence_norm2,"<",""),
        $sentence_norm4:=replace($sentence_norm3,">",""),
        $sentence_norm:=$sentence_norm4,
        $verse:=if (count($s/lb[@type="verse"])>0) then 1 else 0
    return
     
      if (data($sentence/text())!="") then
      (: <sphinx:document id="{$start_id+$i}">
      {
        element {QName("","path")}{data($pid)},
         element {QName("","work_idno")}{$w_idno},
         element {QName("","work")}{$w_name},
         element {QName("","author_idno")}{$a_idno},
         element {QName("","author")}{$a_name},
         element {QName("","corpus_idno")}{$c_idno},
         element {QName("","primary_corpus_idno")}{$pc_idno},
         element {QName("","year")}{$y},
         element {QName("","sentence")}{$sentence/text()},
         element {QName("","lemmatised_sentence")}{
          if ($sentence/s/@lemmatised) then
            $sentence/s/@lemmatised/data()
          else
            string-join($sentence/s/w/@lemmatised/data()," ")
        }
      }
      </sphinx:document> :) 
      
      (:well, sphinx is f*cked up when it comes to xml. It requires the "sphinx:" part in some elements,
      i. e. from XML-point-of-view a namespace prefix, but it does not tolerate the namespace:prefix declaration anywhere. :)
      
      '<sphinx:document id="' || $start_id+$i || '">
        <path>'|| $pid || '</path>
        <work_idno>'|| $w_idno || '</work_idno>
        <work>'|| $w_name || '</work>
        <author_idno>'|| $a_idno || '</author_idno>
        <author>'|| $a_name || '</author>
        <corpus_idno>'|| $c_idno || '</corpus_idno>
        <primary_corpus_idno>'|| $pc_idno || '</primary_corpus_idno>
        <year>'|| $y || '</year>
        <sentence>'|| $sentence_norm || '</sentence>
        <lemmatised_sentence>' || $lemmatised || '</lemmatised_sentence>
        <verse>'|| $verse || '</verse>
      </sphinx:document>'
    )
    return
    (
      file:append-text-lines($index_file,$export),
      file:write($cc:sphinx_folder || "id_counter",format-number($start_id+count($export)+100,"0"))
    )
    (: replace(serialize($export),'xmlns:sphinx="sphinx" ',"") :)
    (: map{"text":<one_text xmlns:sphinx="sphinx">{$export}</one_text>,"last_id":xs:integer($export[last()]/@id)} :)
    
      (:  :)
    (:sphinx indexer zachází s XML dost pofidérně. Potřebuje prefix "sphinx:", ale zároveň nesnese definici namespacu,
    což je naopak pro basex špatně. Takže musíme před vrácením hodnot tyto převést na text a v něm xmlns definici smazat.:)
  )
  else
    error()
 

};




declare function cc:get_years_of_work($W, $A)
{(:this functions extracts the year of the composition of a work ($W) or, if this is not se, the live data of the author:)
  let $y:=cc:get_normalized_years($W) return
    if ($y!="0") then 
      $y
    else
      cc:get_normalized_years($A)
};


declare function cc:export_all_indices()
{
  let $nindices:=count($cc:config/config/sphinx/indices/index) return
  for $i in 1 to $nindices return
  (
    
    cc:export_index_data($i,"s")
      
  )
};

declare function cc:export_index_data($index,$index_type)
{(:2024:)
 
   let $texts:=cc:get_texts_of_index($index,true()),
   $tcount:=count($texts/cc_idno),
   $void0:=prof:dump("Starting export of index " || $index),
   $void1:=prof:dump("   " || $tcount || " texts:"),
   $file:=file:resolve-path("index_" || $index || "_" || $index_type || ".xml",$cc:sphinx_folder),
   $id:= file:write($cc:sphinx_folder || "id_counter",format-number(number($cc:config/cc:config/cc:sphinx/cc:index_size)*(number($index)-1),"0")),
   $schema:=
    '<sphinx:schema>
      <sphinx:field name="sentence"/>
      <sphinx:field name="lemmatised_sentence"/>
      <sphinx:attr name="path" type="string"/>
      <sphinx:attr name="work_idno" type="uint"/>
      <sphinx:attr name="work" type="string"/>
      <sphinx:attr name="author_idno" type="uint"/>
      <sphinx:attr name="author" type="string"/>
      <sphinx:attr name="corpus_idno" type="uint"/>
      <sphinx:attr name="primary_corpus_idno" type="uint"/>
      <sphinx:attr name="year" type="bigint"/>
    </sphinx:schema>',
   $w1:=file:write-text-lines($file,"<sphinx:docset>"),
   $w2:=file:append-text-lines($file,$schema),
   $documents:=
     for $t at $i in $texts/cc_idno return 
     (
         (: prof:dump("      " || $i || "/" || $tcount), :)
         cc:export_sentences_of_text_for_sphinx(map{"text_info":$t,
           "index_type":$index_type,"index_file":$file,"start_id":0,
           "pos_in_index":$i,"total_text_in_index":$tcount,
           "index_name":"index_" || $index || "_" || $index_type})
     )
   return
   (
     file:append-text-lines($file,"</sphinx:docset>"),
     prof:dump("Export of index " || $index || " finished. Export saved in " || $file || " (" || round(file:size($file) div (1048576),1) || " Mb)" )
   )
  
};



declare function cc:calculate_sphinx_indices()
{(:2024:)
  let $value:=
    if ($cc:config/cc:config/cc:sphinx/cc:index_size) then
      number($cc:config/cc:config/cc:sphinx/cc:index_size)
    else
    (
      if ($cc:config/cc:config/cc:sphinx) then
        (
          insert node <cc:index_size>20000000</cc:index_size> into $cc:config/cc:config/cc:sphinx
        )
      else
        (
        insert node <cc:sphinx><cc:index_size>20000000</cc:index_size></cc:sphinx> into $cc:config/cc:config
        ),
      20000000
    )
  return
   cc:calculate_sphinx_indices($value)
};

declare function cc:calculate_sphinx_indices($value)
{(:2024:)

  let $wc:=
  for $xd in $cc:data/(* except cc:file_list)/tei:teiHeader/tei:xenoData 
  let $idno:=number($xd/cc:loaded/cc:cc_idno),
    $wcount:=xs:integer($xd/cc:statistics/cc:words)
  order by $idno
  count $i
  return
  (
    map{"index":$i,"idno":string($idno),"wc":$wcount}
  )
return

  let $indices_node:=
  <indices>
  {
    for tumbling window $words_summa in $wc
    start at $s when true()
    end at $e when sum(subsequence($wc,$s,($e - $s)+1)?wc)>=$value
    count $i
    return 
     <index n="{$i}" words="{sum(subsequence($wc,$s,($e - $s)+1)?wc)}"><s>{$wc[$s]?idno}</s><e>{$wc[$e]?idno}</e></index>
   }
   </indices>

 return 
 (
   if ($cc:config/cc:config/cc:sphinx/cc:indices) then
     replace node $cc:config/cc:config/cc:sphinx/cc:indices with $indices_node
   else
     insert node $indices_node into $cc:config/cc:config/cc:sphinx,
   cc:create_sphinx_config_file($indices_node/index/@n=>max()),
   file:write($cc:admin_folder || "config.xml",$cc:config/cc:config)
 ) 
};


declare function cc:create_sphinx_config_file($count)
{(:2024:)
  let $sphinx_folder:="/var/www/html/sphinx/",
  $charset_table_lines:=file:read-text-lines($sphinx_folder || "charset_table"),
  $charset_table_lines2:=
    for $l in $charset_table_lines return
    (
      replace($l,"/\*.*?\*/","")
    ),
  $charset_table:=replace(string-join($charset_table_lines2," "),"\s+"," "),
  $indices:=
  for $x at $i in 1 to xs:integer($count) return
  concat(
"index index_",$i,"_s",
"
{
  source= src_index_" || $i || "_s
  path=/var/www/html/sphinx/index_" || $i || "_s/
  min_word_len = 1
  min_prefix_len = 3
  min_infix_len = 3
  index_exact_words =1
  expand_keywords = 0
 charset_table = ", $charset_table, "
}
source src_index_",$i,"_s
{
  type=xmlpipe2
  xmlpipe_command=cat " || $sphinx_folder || "index_" || $i || "_" || "s.xml
}",
(: xmlpipe_command=/opt/basex/bin/basex -b index=",$i,", index_type=s /opt/basex/webapp/CC_admin/export_index_data.xq :)
file:create-dir(concat($sphinx_folder,"/","index_",$i,"_s"))
)
return 
file:write-text-lines($sphinx_folder || "sphinx.conf",("#automatically generated by cc:create_sphinx_config_file function (BX) at " || cc:now(),$indices,
"searchd
{
        listen                  = 127.0.0.1:9312
        listen                  = localhost:9306:mysql41
        listen                  = 9307:http
        log                     = /var/log/sphinx/searchd.log
        query_log               = /var/log/sphinx/query.log
        read_timeout            = 5
        max_children            = 30
        pid_file                = /var/run/sphinx/searchd.pid
        seamless_rotate         = 1
        preopen_indexes         = 1
        unlink_old              = 1
        workers                 = thread_pool # for RT to work: threads
        binlog_path             =

}
"))
};
