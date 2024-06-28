module namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare variable $cc:ns:="http://mlat.uzh.ch/2.0";
declare variable $cc:tei:="http://www.tei-c.org/ns/1.0";
declare variable $cc:root:=db:open("corpus_corporum");
declare variable $cc:meta:=db:open("corpus_corporum_metadata");
declare variable $cc:data:=db:open("corpus_corporum_data");
declare variable $cc:config:=db:open("corpus_corporum_config");
declare variable $cc:data_WORK:=db:open("corpus_corporum_data_WORK");
declare variable $cc:tmp:=db:open("corpus_corporum_tmp");
declare variable $cc:home_folder:="/var/www/html/";
declare variable $cc:admin_folder:="/var/www/html/ccadmin/";
declare variable $cc:data_folder:='/var/www/html/data/';
declare variable $cc:php_localhost:="http://localhost";
declare variable $cc:server_url:="";
declare variable $cc:nl:="
";


(:
cc:exists($node)
cc:next_cc_idno($temporary)
cc:check_accessibility($client_permissions,$text_accessibility)
cc:accessibility_info($text_accessibility)
cc:add_ns($elem as element(), $prefix as xs:string, $ns-uri as xs:string  ) as element()
cc:md_last_modification($obj)
cc:md_object_created($obj)
cc:last_modification_by_idno($cc_idno as xs:string)
cc:get_item($collection,$cc_idno)
cc:path_to_node($node)
cc:get_relative_path_to_node($element,$parent_name_to_stop_at)
cc:change-element-ns-deep( $nodes as node()* ,$newns as xs:string ,$prefix as xs:string ) as node()
cc:xq_result($text,$status,$function)
cc:strip-ns($n as node()) as node()
cc:compare_nodes($node1,$node2)
cc:compare_attributes($node1,$node2)
cc:arab($roman,$ac_value)
cc:roman($nr) as xs:string
cc:value-intersect( $arg1 as xs:anyAtomicType* ,$arg2 as xs:anyAtomicType* )  as xs:anyAtomicType* 
cc:dynamic-path($parent as node(), $path2 as xs:string )  as item()* 
cc:substring-before-if-contains($arg as xs:string? ,$delim as xs:string )  as xs:string? 
cc:substring-after-if-contains ( $arg as xs:string? , $delim as xs:string )  as xs:string? 
cc:name-test($testname as xs:string? , $names as xs:string* )  as xs:boolean 
cc:name($item)
cc:idno($item)
:)

(:############################################:)

declare function cc:var_type($var)
{
  typeswitch ($var)
  case element() return "element"
  case xs:string return "string"
  case xs:numeric return "numeric"
  default return if (count($var)>0) then "sequence" else "?"
};

(:############################################:)

declare function cc:exists($node)
{
  if (not($node)) then 
    false()
  else if (data($node)="") then
    false()
  else
    true()
    
 
};


(:############################################:)

declare function cc:unique_random_idno($existing_idnos,$offset)
{
    
    let $offset1:=
        if (number($offset)=0) then
            -1
        else if (number($offset)>0) then
            $offset * -1
        else 
            $offset,
    $rnd:=xs:string($offset1 - random:integer(1000000))
    return
    if (index-of($existing_idnos,$rnd)) then
        cc:unique_random_idno($existing_idnos,$offset1)
    else
        $rnd
};

declare function cc:next_cc_idno($temporary) 
{(:unkce vrátí příští použitelný identifikátor objektu (cc_idno) :)
  let $cc_idnos:=($cc:tmp|$cc:meta)/(* except data)/item/cc_idno return
  if ($temporary=true()) then
  ( (:dočasné položky mají záporné a náhodně generované cc_idno:)
    let $tmp_idnos:=$cc:tmp/*/item/cc_idno/data()
    return        
        cc:unique_random_idno($tmp_idnos,-1)
  )
  else
  (
    if (not($cc_idnos)) then
      "1"
    else 
      let $nidno:=max($cc_idnos/data())+1 return
      if ($nidno<=0) then(:může se stát, že bdueme mít samá dočasná idno počínající -1, pak 
      ale první trvalé bude -1+1, tj. 0, což ale nechceme. 0 nechť je rezervována:)
        "1"
      else
        $nidno
  )   
};


(:############################################:)

declare function cc:check_accessibility($client_permissions,$text_accessibility)
{
  let $accessibility:=
  if ($text_accessibility) then string($text_accessibility)
  else
  "0"
  return
  if ($client_permissions="x") then (:univerzální přístup:)
    1
  else if ($accessibility="0") then (:text je bez omezení:)
    1
  else
    (
      if (contains(string($client_permissions),$accessibility)) then
        1
      else
        0
    )
    
};

(:############################################:)

declare function cc:accessibility_info($text_accessibility)
{
  if ($text_accessibility=1) then
    "Due to possible copyright restrictions the full text is only made visible within University of Zurich's IP range. We apologise for the inconvenience."
};


(:############################################:)

declare function cc:add_ns($elem as element(), $prefix as xs:string, $ns-uri as xs:string  ) as element()
{
  element { QName($ns-uri, concat($prefix, ":x")) }{$elem}/*
};


(:############################################:)

declare updating function cc:md_last_modification($obj)
{
  if (local-name($obj)="item") then
  (
    if ($obj/cc_metadata) then
    (
      if ($obj/cc_metadata/last_modification) then
      (replace node $obj/cc_metadata/last_modification with <last_modification>{adjust-dateTime-to-timezone(current-dateTime(),())}</last_modification>)
      else
        (insert node <last_modification>{adjust-dateTime-to-timezone(current-dateTime(),())}</last_modification> into $obj/cc_metadata)
    )
    else
      insert node <cc_metadata><last_modification>{adjust-dateTime-to-timezone(current-dateTime(),())}</last_modification></cc_metadata> into $obj
  )
  else
  ()
};


(:############################################:)

declare function cc:md_object_created_node()
{
  <created>{adjust-dateTime-to-timezone(current-dateTime(),())}</created>
};

declare updating function cc:md_object_created($obj)
{
  if ($obj/self::item) then
  (
    if ($obj/cc_metadata) then
    (
      if ($obj/cc_metadata/created) then
        replace node $obj/cc_metadata/created with  cc:md_object_created_node
      else
        insert node cc:md_object_created_node into $obj/cc_metadata
    )
    else
      insert node <cc_metadata>{ cc:md_object_created_node()}</cc_metadata> into $obj
  )
  else
  ()
};


(:############################################:)


declare updating function cc:last_modification_by_idno($cc_idno as xs:string)
{ (:zapíše do objektu časový otisk poslední modifikace:)
  let $obj:=$cc:meta/*/item[data(cc_idno)=$cc_idno] return
  cc:md_last_modification($obj)
};


(:############################################:)

declare function cc:item($cc_idno)
(:web_accessible:)
(:2023:)
{
    if ($cc_idno!="" and matches($cc_idno,"^\-?[0-9]+$")) then
    (
        let $nr_idno:=number($cc_idno),
        $I:=if ($nr_idno>0) then
                (:db:attribute("corpus_corporum_metadata",$cc_idno,"*:cc_idno")/ancestor::item:)
                db:text("corpus_corporum_metadata",$cc_idno)/parent::cc_idno/ancestor::item
            else if ($nr_idno<0) then
                (:db:attribute("corpus_corporum_tmp",$cc_idno,"*:cc_idno")/ancestor::item:)
                db:text("corpus_corporum_tmp",$cc_idno)/parent::cc_idno/ancestor::item
        return $I
    )
    else if ($cc_idno!="") then
    (
       let $I:=
                db:text("corpus_corporum_metadata",$cc_idno)/parent::cc_id/ancestor::item
        return
        if (not($I=>empty())) then 
          $I
        else
        ("o")
    )
};


declare function cc:get_item($collection,$cc_idno)
{
  $collection/item[data(cc_idno)=data($cc_idno)]
};

(:############################################:)

declare function cc:path_to_node($node)
{
  
    let $ancestors:=$node/ancestor-or-self::*/name(.) return
      count($ancestors)
};


(:############################################:)

declare function cc:get_relative_path_to_node($element,$parent_name_to_stop_at)
{
  if (local-name($element/parent::*)=$parent_name_to_stop_at) then
    local-name($element)
  else
    concat(cc:get_relative_path_to_node($element/parent::*,$parent_name_to_stop_at),"/",local-name($element))
};

(:############################################:)

declare function cc:change-element-ns-deep( $nodes as node()* ,$newns as xs:string ,$prefix as xs:string ) as node()* {

  for $node in $nodes
  return if ($node instance of element())
         then (element
               {QName ($newns,
                          concat($prefix,
                                    if ($prefix = '')
                                    then ''
                                    else ':',
                                    local-name($node)))}
               {$node/@*,
                cc:change-element-ns-deep($node/node(),
                                           $newns, $prefix)})
         else if ($node instance of document-node())
         then cc:change-element-ns-deep($node/node(),
                                           $newns, $prefix)
         else $node
 } ;
 
 
(:############################################:)
 
declare function cc:xq_result($text,$status,$function)
{
  <xq_result status="{$status}" function="{$function}">{$text}</xq_result>
};

(:############################################:)

declare function cc:strip-ns($n as node()) as node()
{
  if($n instance of element()) then (
    element { local-name($n) } {
    $n/@*,
    $n/node()/cc:strip-ns(.)
    }
  )
  else if($n instance of document-node()) then (
    document { cc:strip-ns($n/node()) }
  )
  else (
  $n
  )
};

(:############################################:)

declare function cc:compare_nodes($node1,$node2)
{
  if (cc:compare_attributes($node1,$node2)=false()) then
    false()
  else
    true()

};

(:############################################:)

declare function cc:compare_attributes($node1,$node2)
{
  for $attr in $node1/@* return
    if ($node2/attribute::*[local-name(.)=local-name($attr)]!=$attr or not($node2/attribute::*[local-name(.)=local-name($attr)])) then
     false()  
};


(:############################################:)

declare function cc:arab($roman,$ac_value)
{
  let $rom:=upper-case($roman) return
  (
    let $nrs:=map{"I":1,"V":5,"X":10,"L":50,"C":100,"D":500,"M":1000,"o":0} return
    if (string-length($rom)>1) then
    (
      let $ac:=substring($rom,1,1), 
      $next:=if(string-length($rom)>1) then substring($rom,2,1) else "o"
      return
      if (map:get($nrs,$ac)>=map:get($nrs,$next)) then 
        cc:arab(substring($rom,2),$ac_value+map:get($nrs,$ac))
      else
        cc:arab(substring($rom,2),$ac_value+(-1*map:get($nrs,$ac)))
    )
    else
      $ac_value+map:get($nrs,$rom) 
  )
    
};

(:############################################:)

declare function cc:roman($nr) as xs:string
{
    switch ($nr)
      case 0 return ""
      case 1 return "I"
      case 2 return "II"
      case 3 return "III"
      case 4 return "IV"
      case 5 return "V"
      case 6 return "VI"
      case 7 return "VII"
      case 8 return "VIII"
      case 9 return "IX"
      case 10 return "X"
      case 20 return "XX"
      case 30 return "XXX"
      case 40 return "XL"
      case 50 return "L"
      case 60 return "LX"
      case 70 return "LXX"
      case 80 return "LXXX"
      case 90 return "XC"
      case 100 return "C"
      case 200 return "CC"
      case 300 return "CCC"
      case 400 return "CD"
      case 500 return "D"
      case 600 return "DC"
      case 700 return "DCC"
      case 800 return "DCCC"
      case 900 return "CM"
      case 1000 return "M"
      default return 
      (
        let $h:=$nr idiv 100 return 
        let $d:=($nr - ($h*100)) idiv 10 return
        let $u:=$nr - (($h*100)+($d*10)) return
        concat(cc:roman($h*100),cc:roman($d*10),cc:roman($u))
      )
    
};

(:############################################:)

declare function cc:value-intersect
  ( $arg1 as xs:anyAtomicType* ,
    $arg2 as xs:anyAtomicType* )  as xs:anyAtomicType* 
{

  distinct-values($arg1[.=$arg2])
};
 

(:############################################:)
declare function cc:dynamic-path($parent, $path2 as xs:string )  as item()* 
(:originally from http://www.xqueryfunctions.com/xq/functx_dynamic-path.html, but improved heavilly:)
{

    if ($path2="") then
    $parent  
    else
    (
        let 
        $all_desc:=starts-with($path2,"/"),
        $path:=if ($all_desc=true()) then substring-after($path2,"/") else $path2,
        $nextStep1 := cc:substring-before-if-contains($path,'/'),
        $pos:=analyze-string($nextStep1,"\[(.*?)\]")/fn:match/fn:group/text(),
        $nextStep := cc:substring-before-if-contains($nextStep1,'['),
        $restOfSteps := substring-after($path,'/')
        return
        
        let $matching_children:=
        (
            if ($all_desc=false()) then
            
                for $child in
                    ($parent/*[cc:name-test(name(),$nextStep)],
                    $parent/@*[cc:name-test(name(), substring-after($nextStep,'@'))])
                return $child
            else
                for $child in
                    ($parent//*[cc:name-test(name(),$nextStep)])
                return $child
            
        ),
        $selected_children:=
            if ($pos) then
                if ($pos="last()") then
                    $matching_children[last()]
                else
                    $matching_children[number($pos)]
            else
                $matching_children
        return                
            if ($restOfSteps="text()") then
                $selected_children/text()
            else if ($restOfSteps="data()") then
                $selected_children/data()
            else if ($restOfSteps!="") then
                cc:dynamic-path($selected_children, $restOfSteps)
            else 
                $selected_children
                
        
    )
} ;

 
(:############################################:)
 
declare function cc:substring-before-if-contains
( $arg as xs:string? ,
$delim as xs:string )  as xs:string? {

if (contains($arg,$delim))
then substring-before($arg,$delim)
else $arg
 } ;
 
(:############################################:)

 
declare function cc:substring-after-if-contains
  ( $arg as xs:string? ,
    $delim as xs:string )  as xs:string? {

   if (contains($arg,$delim))
   then substring-after($arg,$delim)
   else $arg
 } ;
(:############################################:)

declare function cc:name-test
  ( $testname as xs:string? ,
    $names as xs:string* )  as xs:boolean {

$testname = $names
or
$names = '*'
or
cc:substring-after-if-contains($testname,':') = 
   (for $name in $names
   return substring-after($name,'*:'))
or
substring-before($testname,':') =
   (for $name in $names[contains(.,':*')]
   return substring-before($name,':*'))
 } ;
 
 
 
 
(:############################################:)
 
 
declare function cc:name($item)
{
 $item/name_data/name/text()
};

(:############################################:)

declare function cc:names($items)
{

  (:gets a list of idnos (in an element tree) and returns their respective names (and preserves all attributes):)
  <names>
  {
    for $item in $items/* 
      let $cc_idno:=
        if (local-name($item)="idno" or local-name($item)="cc_idno") then
          $item/data(),
      $name:=cc:item($item/data())/name_data/name/text()
    return
      let $named_item:=<item cc_idno="{$cc_idno}">{$name}</item> return
      copy $named_item2:=$named_item modify
      (
        for $a in $item/@* where local-name($a)!= "cc_idno" return
          insert node $a into $named_item2
      )
      return $named_item2
      
  }
  </names>
};

(:############################################:)

declare function cc:idno($item)
 {
   $item/cc_idno/text()
 };
 
 
 
 (:############################################:)
 
 declare function cc:get_bible_versions()
{
(:
Funkce, která vrátí strukturu různých verzí Bible (knihy, počet kapitol v nich a v nich počet veršů). To vše kvůli biblické synopsi
:)
  let $abbrs:=map{"17102":"H","17103":"V","17104":"S","17105":"Dr","17106":"Ntg","21332":"Cas"},
  $short_names:=map{"17102":"Biblia Hebraica","17103":"Vulgata","17104":"Septuaginta","17105":"Douay-Rheims","17106":"Novum Testamentum Graece","21332":"Castellio"},
  $bibles_idno:=("17102","17103","17104","17105","17106","21332")
  return 
  let $xml_output:=
  <map key="Bibles" xmlns="http://www.w3.org/2005/xpath-functions">
  {
  <array key="versions">
    {
        for $bible in $bibles_idno return
        (
            let $T:=$cc:root/cc:data/cc:tdata[cc:cc_idno=$bible]/cc:text/tei:text/tei:body,
            $t:=$cc:root/cc:cc_texts/cc:item[cc:cc_idno=$bible],
            $w:=$cc:root/cc:cc_works/cc:item[cc:cc_idno=$t/cc:work_idno]
            return 
            (
            let $st:=<version>{cc:gbv_rec_one_level($T)}</version> return
            <map key="version">
            {
            <number key="cc_idno">{$bible}</number>,
            <string key="name">{$w/cc:name_data/cc:name/text()}</string>,
            <string key="abbr">{map:get($abbrs,$bible)}</string>,
            <string key="short_name">{map:get($short_names,$bible)}</string>,
            <array key="books">
            {
                
                for $b in $st/cc:section return 
                (
                <map key="book">{
                <string key="id">{$b/cc:head/@id/data()}</string>,
                <string key="pid">{$b/cc:head/@pid/data()}</string>,
                <string key="name">{$b/cc:head/text()}</string>,
                <string key="count">{count($b/cc:section)}</string>,
                <array key="chapters">
                {for $s in $b/cc:section return 
                    <map key="chapter">
                    <string key="n">{$s/@n/data()}</string>
                    <string key="v">{$s/cc:verses/data()}</string>
                    </map>
                }
                </array>
                }</map>
                )
            
            }
            </array>
            }
            </map>
            )
        )
  }
  </array>
  }
  </map>
  return xml-to-json($xml_output) (:<map key="Bibles" xmlns="http://www.w3.org/2005/xpath-functions"><string key="name">A</string></map>:)
};

 (:############################################:)

declare function cc:gbv_rec_one_level($parent)
{
    if ($parent/tei:div[1]/@id="VT") then
      for $d in $parent/tei:div return
        cc:gbv_rec_one_level($d)
    
    else
      for $d in $parent/tei:div return
      (
        <section n="{$d/@n}">{
          if (count($d/tei:div)=0) then
          (
            let $m:=$d//tei:milestone[@unit="verse"] return
            <verses>{$m[count($m)]/@n/data()}</verses>
          )        
          else
          (
            <head id="{$d/@id/data()}" pid="{$d/@cc:pid/data()}">{normalize-space($d/tei:head/data())}</head>,
            cc:gbv_rec_one_level($d)
          )
            
        }</section>
      )

};


(:############################################:)
declare function cc:get_recently_added_texts($n,$days,$date_from)
{
    let $texts:=
        for $t at $i in $cc:root/cc_texts/item 
            let 
            $created:= xs:date(xs:dateTime($t/cc_metadata/created/text())),
            $days_elapsed:=days-from-duration(current-date()-$created)
        
        order by $days_elapsed ascending 
        where 
            $created>$date_from
        return 
            <item>
                <date>{format-date($created,"[D1]. [M1]. [Y0001]")}</date>
                <name>{$t/name_data/name/text()}</name>
                <author></author>
                <cc_idno>{$t/cc_idno/text()}</cc_idno>
            </item>
    return $texts

};



declare function cc:now()
{
  adjust-dateTime-to-timezone(current-dateTime(), ())
};

declare function cc:work_idno_of_text($cc_idno)
(:web_accessible:)
{
    cc:item($cc_idno)/work_idno/text()
    
};

declare function cc:author_idno_of_work($cc_idno)
(:web_accessible:)
{
     cc:item($cc_idno)/author_data/primary_author_idno/text()
};

declare function cc:author_idno_of_text($cc_idno)
(:web_accessible:)
{
    let $w_idno:=cc:work_idno_of_text($cc_idno),
    $a_idno:=cc:author_idno_of_work($w_idno)
    return $a_idno
};

declare function  cc:array_column($array,$column)
{
  for $row in $array return
    $row($column)
};


declare function cc:get_file_state($path)
{
  let $as:=analyze-string($path,".*\.([^.]+)\.xml")
  return
  if (count($as/fn:match)=0) then
    "orig"
  else
    let $s:=$as/fn:match/fn:group/text() return
    (
        if (index-of(("orig","prep","prep-sent","loaded","an2","prep-export","POS"),$s)>0) then
            $s
        else
            "orig"
    )
};

declare function cc:get_original_path($path)
{
  let 
    $fname:=file:name($path),
    $clean_fname:=replace($fname,"\.(loaded|prep|prep-sent|prep-export|POS)\.xml$",".xml"),
    $folder1:=file:parent($path),
    $def_p:=if (file:name($folder1)="prep" or file:name($folder1)="loaded" or file:name($folder1)="POS") then
      file:parent($folder1) || $clean_fname
    else
      $folder1 || $clean_fname
    return $def_p
      
  
};
declare function cc:get_state_path($path,$state)
{
  let $orig:=cc:get_original_path($path),
  $orig_fname:=file:name($orig),
  $new_fname:=replace($orig_fname,"\.xml$","." || $state || ".xml"),
  $orig_folder:=file:parent($orig)
  return
    if ($state="prep" or $state="prep-export" or $state="prep-sent") then
    (
      if (file:exists($orig_folder || "prep")=false()) then
        file:create-dir($orig_folder || "prep"),
      $orig_folder || "prep/" || $new_fname
    )
    else if ($state="loaded") then
    (
      if (file:exists($orig_folder || "loaded")=false()) then
        file:create-dir($orig_folder || "loaded"),
      $orig_folder || "loaded/" || $new_fname
    )
    else if ($state="POS") then
    (
      if (file:exists($orig_folder || "POS")=false()) then
        file:create-dir($orig_folder || "POS"),
      $orig_folder || "POS/" || $new_fname
    )
    else if ($state="orig" or $state="") then
      $orig
    else if ($state="sentences" or $state="sentences.lemmatised") then
      $orig_folder || "prep/" || $orig_fname || "." || $state
    else 
      ""
      
};

declare function cc:get_latest_file_status_path($path)
{
   let 
     $basic_fpath:=substring-before($path,".")
     return
     if (file:exists($basic_fpath || ".loaded.xml")) then
       $basic_fpath || ".loaded.xml"
     else if (file:exists($basic_fpath || ".an2.xml")) then
       $basic_fpath || ".an2.xml"
     else if (file:exists($basic_fpath || ".prep.xml")) then
       $basic_fpath || ".prep.xml"
     else
       ""
   
};

declare function cc:export_metadata()
{
  cc:export_metadata("",$cc:meta)
};
declare function cc:export_metadata($path)
{
  cc:export_metadata($path,$cc:meta)
};

declare function cc:export_metadata($path,$db)
{
  let $export_path:=if ($path="") then
    $cc:admin_folder || "collections/"
  else
    $path,
  $tmp:=if (db:name($db)="corpus_corporum_tmp") then "tmp-" else ""
  return
  (
    file:write($export_path || $tmp || "cc_texts.xml",$db/cc_texts),
    file:write($export_path || $tmp || "cc_authors.xml",$db/cc_authors),
    file:write($export_path || $tmp || "cc_works.xml",$db/cc_works),
    file:write($export_path || $tmp || "cc_corpora.xml",$db/cc_corpora)
  )
};


declare function cc:indexate($db)
{
    if ($db="corpus_corporum_data" or $db="corpus_corporum_data_WORK") then
    (
        db:optimize($db,false(),
        map{"attrindex":true(),"attrinclude":"*:cc_idno,*:pid"}),
         "Indexing " || $db || " finished."
    )
    else
    (
        db:optimize($db,false(),
        map{
            "textindex":true(),
                "textinclude":"*:corpus,*:work_idno,*:primary_author_idno,*:cc_idno,*:cc_id,*:parent_corpus",
            "attrindex":true(),
                "attrinclude":"*:cc_idno"}),
        "Indexing " || $db || " finished."
    )
};










