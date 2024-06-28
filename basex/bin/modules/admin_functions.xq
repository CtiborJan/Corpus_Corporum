module namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";

declare namespace ns0="http://viaf.org/viaf/abandonedViafRecord";
declare namespace ns1="http://viaf.org/viaf/terms#";
declare namespace rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace wdt="http://www.wikidata.org/prop/direct/";
declare namespace rdfs="http://www.w3.org/2000/01/rdf-schema#";

import module "http://mlat.uzh.ch/2.0" at "general_functions.xq", "collection_manipulation.xq","mod_browsing.xq";
declare variable $cc:adminroot:=/;

(:############################################:)

declare function cc:copy_to_metadatadb()
{
    for $c in $cc:root/(* except data)
    return 
    insert node $c into $cc:meta
};


declare function cc:load_collections()
(:web_accessible:)
{
  <collections>
    <permanent>
    {
      for $c in $cc:meta/(cc_corpora|cc_authors|cc_works|cc_texts) return
        <collection temporary="false" name="{local-name($c)}" items_count="{count($c/item)}"/>
    }
    </permanent>
    <temporary>
    {
      for $c in $cc:tmp/* return
        <collection  temporary="true" name="{local-name($c)}" items_count="{count($c/item)}"/>
    }
    </temporary>
  </collections>
};

(:############################################:)

declare function cc:load_collection_items($tmp,$collection)
(:web_accessible:)
{
  let $c:=
  if ($tmp=true()) then
    db:open("corpus_corporum_tmp")/*[local-name()=$collection] 
  else
    db:open("corpus_corporum_metadata")/*[local-name()=$collection] 
  return
  <collection_items temporary="{$tmp}" collection="{local-name($c)}">
  {
    for $i in $c/item order by number($i/cc_idno) descending return
      $i
  }
  </collection_items>
};


(:############################################:)

declare function cc:get_collection_items($db,$collection,$filter_type,$filter_element,$filter_value)
{
   cc:get_collection_items($db,$collection,<filter type="{$filter_type}"><filter_element>{$filter_element}</filter_element><filter_value>{$filter_value}</filter_value></filter>)
};


(:############################################:)

declare function cc:get_collection_items($db,$collection,$filter)
{
  let $c:=
  typeswitch ($collection)
    case element(*) return $collection
    case xs:string return cc:dynamic-path($cc:adminroot,$collection)
    default return "",
    
  $filter_element:=$filter/filter_element/text(),
  $filter_value:=data($filter/filter_value),
  $comp_type:=
    if ($filter/comparation_type/text()!="") then
      $filter/comparation_type/text()
    else
      "=="      
   
  return  
  
  if ($filter/@type!="advanced") then (:filtrování "zůstává" uvnitř kolekce :)
  (   
    <collection_items collection="{local-name($c)}">
    {
      for $i in $c/item order by $i/name_data/name 
        where cc:compare($i,$filter_element,$filter_value,$comp_type)
        return
          $i
    }
    </collection_items>
  )
  else (:filtrujeme napříč kolekcemi, např. autory, kteří jsou obsaženi v nějakém korpusu...:)
  (
    
    let$vc:=
      if ($filter_element="corpus") then
      (
        cc:filter_OBJECTS_by_corpus($filter_value,"","","","",true())
      )
     return
      <collection_items collection="{local-name($c)}" advanced_filter="true" filter_by="{$filter_element}={$filter_value}">
      {
       $vc/*[local-name(.)=local-name($c)]/item
      }
      </collection_items>
  )
  
  
};



declare function cc:compare($item,$element,$value,$comp_type)
{
  let $e:=cc:dynamic-path($item,$element) return
  if ($comp_type="=") then(:porovnání hodnot:)
    $e=$value
  else if ($comp_type="!=") then(:porovnání hodnot:)
    not($e=$value)
  else if ($comp_type="?") then(:zjištění existence elementu:)
    not(empty($e))
  else if ($comp_type="!?") then(:zjištění existence elementu:)
    empty($e)
  else if ($comp_type="==") then (:porovnání hodnot a existence elementu:)
  (
    (:tj. pokud elmenent pro porovnání vůbec neexistuje a hodnota, s níž se má porovnat, je "" nebo false(), bere se, jako že podmínka je splněna:)
    if (empty($e) and ($value="")) then
      true()
    else
      $e=$value
  )
  
  else if ($comp_type=">") then (:$e > $value:)
    $e>$value
  else if ($comp_type="<") then (:$e > $value:)
    $e<$value
  else if ($comp_type=">=") then (:$e > $value:)
    $e>=$value
  else if ($comp_type="<=") then (:$e > $value:)
    $e<=$value

};


declare function cc:get_item_references($item_idno)
(:web_accessible:)
(:2023:)
{
  <items>
  {
    for $ref in ($cc:meta|$cc:tmp)/*/item//*[@cc_idno_ref] where data($ref[@cc_idno_ref])=$item_idno order by local-name($ref) return
    
    <item>
      <object_name>{data($ref/ancestor::item/name_data/name)}</object_name>
      <object_idno>{data($ref/ancestor::item//cc_idno)}</object_idno>
      <relative_element_path>{cc:get_relative_path_to_node($ref,"item")} 
      [{ count($ref/preceding-sibling::*[name()=local-name($ref)])}]</relative_element_path>
      <collection>{local-name($ref/ancestor::item/..)}</collection>
      <path>{path($ref)}</path>
    </item>
  }
  </items>
};

declare function cc:set_wordlist_indices_of_text($cc_idno,$first,$last)
{(:nastaví hraniční indexy textu v MySQL tabulce wordlist - pomocí nich se v ní dá velmi rychle operovat, bez nich jen velmi pomalu vzhledem k její velikosti:)
  let $item:=$cc:adminroot/cc_texts/item[cc_idno=$cc_idno] return
  if ($item/wordlist_indices) then
    replace node $item/wordlist_indices with <wordlist_indices><first>{$first}</first><last>{$last}</last></wordlist_indices>
  else
    insert node <wordlist_indices><first>{$first}</first><last>{$last}</last></wordlist_indices> as last into $item
};

declare function cc:get_wordlist_indices_of_text($cc_idno)
{
  let $item:=$cc:adminroot/cc_texts/item[cc_idno=$cc_idno] return
  if ($item/wordlist_indices) then
    $item/wordlist_indices 
  else
    <wordlist_indices set="false"><first>-1</first><last>-1</last></wordlist_indices>
};


declare function cc:set_lemmatisation_status_of_text($cc_idno,$status)
{
  let $item:=$cc:adminroot/cc_texts/item[cc_idno=$cc_idno] return
  if (count($item/is_lemmatised)=1) then
    replace node $item/is_lemmatised with <is_lemmatised>{$status}</is_lemmatised>
  else if (count($item/is_lemmatised)>1) then
    (
      delete nodes $item/is_lemmatised,
      insert node <is_lemmatised>{$status}</is_lemmatised> as last into $item
    ) 
  else
    insert node <is_lemmatised>{$status}</is_lemmatised> as last into $item
};

declare function cc:get_lemmatisation_status_of_text($cc_idno)
{
  let $item:=$cc:adminroot/cc_texts/item[cc_idno=$cc_idno] return
  if ($item/is_lemmatised) then
    $item/is_lemmatised/text() 
  else
    "false"
};



declare function cc:VIAF_and_WIKI_test()
{
    "Name	cc_idno	viaf_id	viaf url	Name according to VIAF	wikidata_id	wikidata url	Name according to wikidata",
  for $A in $cc:adminroot/cc_authors/item
    let
    $an:=$A/name_data/name,
    $viaf:=$A/viaf_id/text(),
    $wiki:=$A/wikidata_id/text()
    order by $an count $c return 
    (
    let $viaf_data:=if ($viaf!="") then
      try {doc(concat("https://viaf.org/viaf/",$A/viaf_id,"/viaf.xml"))}
      catch * {<x><ns1:VIAFCluster><ns1:mainHeadings><ns1:data><ns1:text>url error!</ns1:text></ns1:data></ns1:mainHeadings></ns1:VIAFCluster></x>}
    else
      <viaf></viaf>,
    $viaf_path:=if ($viaf!="") then 
      concat("https://viaf.org/",$viaf)
      
    let $wiki_data:=if ($wiki!="") then
      try{doc(concat("https://www.wikidata.org/wiki/Special:EntityData/",$wiki,".rdf"))}
      catch *{<x><rdf:RDF><rdf:Description><wdt:P373>url error!</wdt:P373></rdf:Description></rdf:RDF></x>}
    else
      <wiki></wiki>,
    $wiki_path:=if ($wiki!="") then 
      concat("https://wikidata.org/wiki/",$wiki)
    
    let $WD_name:=if ($wiki_data/rdf:RDF/rdf:Description/wdt:P373) then 
      $wiki_data/rdf:RDF/rdf:Description/wdt:P373[1]/text()
    else
      ($wiki_data/rdf:RDF/rdf:Description/rdfs:label/text())[1]
    return
        
  concat($an,"	",$A/cc_idno/text(),"	",$A/viaf_id/text(),"	",$viaf_path, "	",$viaf_data/ns1:VIAFCluster/ns1:mainHeadings/ns1:data[1]/ns1:text/text(),"	",$A/wikidata_id,"	",$wiki_path,"	",$WD_name)
  )
};

declare function cc:load_timedata_from_wikidata($db)
{
  for $A in $db/cc_authors/item return
  (
   let $td:=cc:get_wikidata_life_data_wikiid($A/external[@source/data()=>lower-case()="wikidata"]/@value/data()),
    $d:=prof:dump("cc_idno: " || $A/cc_idno/text() || "(" || $A/name_data/name/text() || "): inserting data " || data($td) )
    return
    if ($A/time_data) then
    (
      prof:dump("replacing"),
      replace node $A/time_data with $td
    )
    else
    (
      prof:dump("inserting"),
      insert node $td into $A
    )
  )
};



declare function cc:get_wikidata_life_data_idno($cc_idno)
{
   cc:get_wikidata_life_data_wikiid(($cc:meta|$cc:tmp)/(* except data)/item[cc_idno=$cc_idno]/wikidata_id)
};

declare function cc:get_wikidata_item($wikidata_id)
{
    let $d1:=prof:dump($wikidata_id),
    $wikidata_id2:=
        if (matches($wikidata_id,"^Q[0-9]+")=true()) then 
            $wikidata_id
        else
            concat("Q",$wikidata_id)
    return  
    let 
    $url:=concat("https://www.wikidata.org/wiki/Special:EntityData/",$wikidata_id2,".rdf"),
    $d:=prof:dump($url),
    $doc:=
        try{doc($url)}
        catch *{<x><rdf:RDF><rdf:Description><wdt:P373>url error!</wdt:P373></rdf:Description></rdf:RDF></x>}
        
    return $doc
};
declare function cc:extract_gnb_id_from_wikidata($wikidata_id)
{
    let $doc:=cc:get_wikidata_item($wikidata_id) return
    $doc/rdf:RDF/rdf:Description/wdt:P227/text()
};

declare function cc:get_wikidata_life_data_wikiid($wikidata_id)
{
   let $doc:=cc:get_wikidata_item($wikidata_id),
   
   $born:=for $b in $doc/rdf:RDF/rdf:Description/wdt:P569/text() return year-from-dateTime($b),
   $died:=for $d in $doc/rdf:RDF/rdf:Description/wdt:P570/text() return year-from-dateTime($d),
   $floruit:=for $f in $doc/rdf:RDF/rdf:Description/wdt:P1317/text() return year-from-dateTime($f)
   
   return
   let $event_born:=
     if (count($born)=1) then
     <event what="born">
       <date1>
         <year>{$born}</year>
       </date1>
     </event>
     else if (count($born)>1) then
     <event what="born" certainty="between">
       <date1>
         <year>{min($born)}</year>
       </date1>
       <date2>
         <year>{max($born)}</year>
       </date2>
     </event>,
     
     $event_died:=
    if (count($died)=1) then
     <event what="died">
       <date1>
         <year>{$died}</year>
       </date1>
     </event>
     else if (count($died)>1) then
     <event what="died" certainty="between">
       <date1>
         <year>{min($died)}</year>
       </date1>
       <date2>
         <year>{max($died)}</year>
       </date2>
     </event>,
     $event_floruit:=
     if (count($floruit)=1) then
     <event what="floruit">
       <date1>
         <year>{$floruit}</year>
       </date1>
     </event>
     else if (count($floruit)>1) then
     (<event what="floruit_from" certainty="circa">
       <date1>
         <year>{min($floruit)}</year>
       </date1>
       </event>,
       <event what="floruit_to" certainty="circa">
       <date2>
         <year>{max($floruit)}</year>
       </date2>
     </event>)
     
     return
     <time_data src="wikidata">
     {$event_born,$event_died,$event_floruit}
     </time_data>
   
};

declare function cc:wikidataid_from_VIAF_for_tmp()
{
  for $A at $i in $cc:tmp/cc_authors/item where not(not($A/external[@source/data()=>lower-case()="viaf"]) or $A/external[@source/data()=>lower-case()="viaf"]/@value/data()="") and (not($A/external[@source="wikidata"]) or $A/external[@source/data()=>lower-case()="wikidata"]/@value="") return 
  let $wikiid:=cc:wikidata_from_VIAF($A/external[@source/data()=>lower-case()="viaf"]/@value/data()) return
  if (local-name($wikiid)!="abbandoned_viaf_id") then
  (
    if (not($A/external[@source/data()=>lower-case()="wikidata"])) then
      insert node <external source="Wikidata" type="id" value="{data($wikiid)}"/> into $A
    else
      replace value of node $A/external[@source/data()=>lower-case()="wikidata"]/@value with data($wikiid)
      (: <external source="Wikidata" type="id" value="{data($wikiid)}"/> :)
  )
  else
  (
    (: if ($wikiid/@new!="") then
    (
      let $wikiid2:=cc:wikidata_from_VIAF($wikiid/@new) return
      (
        replace value of node $A/viaf_id with $wikiid/@new/data(),
        if (not($A/wikidata_id)) then
          insert node <wikidata_id>{data($wikiid2)}</wikidata_id> as last into $A
        else
          replace value of node $A/wikidata_id with data($wikiid2)

      )
    ) :)
  )
    
};

declare function cc:wikidata_from_VIAF($viaf)
{
  
  if (matches($viaf,"^[0-9]+$")) then
    let
      $dump:=prof:dump("downloading: " || $viaf), 
      $d:=doc(concat("https://viaf.org/viaf/",$viaf,"/viaf.xml")) return
    if ($d/ns0:abandoned_viaf_record/ns0:redirect/ns0:directto) then
    (
      <abbandoned_viaf_id new="{$d/ns0:abandoned_viaf_record/ns0:redirect/ns0:directto}"/>
    )
    else
    (
      for $sources in $d/ns1:VIAFCluster/ns1:sources/ns1:source where
      starts-with($sources,"WKP|")
      return 
      $sources/@nsid
    )
};

declare function cc:find_duplicate_authors_in_tmp()
{(:najde autory v tmp kolekci, kteří mají shodne VIAF id s nějakým autorem z trvalé kolekce:)
  let $def:=
  <def>{
  for $A in $cc:adminroot/cc_authors/item where $A/viaf_id and $A/viaf_id/data()!="" return
  <item>{$A/cc_idno,$A/viaf_id,$A/name_data/name}</item>
  }</def>,
  $tmp:=
  <tmp>{
  for $A in $cc:tmp/cc_authors/item where $A/viaf_id and $A/viaf_id/data()!="" return
  <item>{$A/cc_idno,$A/viaf_id,$A/name_data/name}</item>
  }</tmp>
  return
  let $def_viaf:=data($def/item/viaf_id),
  $tmp_viaf:=data($tmp/item/viaf_id),
  $result:=
  for $t at $i in $tmp_viaf where index-of($def_viaf,$t)>0 return
  <match><tmp>{$tmp/item[$i]}</tmp><def>{$def/item[index-of($def_viaf,$t)[1]]}</def></match>
  return
  
  for $bad in $result return
let $references:=$cc:tmp//*[@cc_idno_ref and data(.)=$bad/tmp/item/cc_idno/data()] return 
for $r in $references return replace value of node $r with $bad/def/item/cc_idno/text()

(: <subst>{$references}<with>{$bad/def/item/cc_idno/text()}</with></subst> :)
};


declare function cc:summarize_stats($date,$total_visits,$total_users,$total_bots,$unique_users,$unique_bots)
{
    let $day_summary:=<day date='{$date}'>
        <total_visits>{$total_visits}</total_visits>
        <total_visits_by_users>{$total_users}</total_visits_by_users>
        <total_visits_by_bots>{$total_bots}</total_visits_by_bots>
        <unique_users>{$unique_users}</unique_users>
        <unique_bots>{$unique_bots}</unique_bots>
    </day>
    let $stats:=doc("/var/www/html/ccadmin/stats/stats.xml") return
    copy $new_stats:=$stats modify
    (
        insert node $day_summary as last into $new_stats/single_days
    )
    return
    (
        file:write("/var/www/html/ccadmin/stats/stats.xml",$new_stats)
    )
};



declare function cc:user_stats($from1,$to1)
{
 let 
    $stats:=fn:collection("/var/www/html/ccadmin/stats/"),
    $from:=cc:CE_date_to_BaseX_date($from1),
    $to:=cc:CE_date_to_BaseX_date($to1),
    $fitting:=for $ds in $stats/daily_stats let $date:=cc:CE_date_to_BaseX_date($ds/@date) where $date>=$from and $date<=$to order by $date return $ds
 return 
 (
    
 
 
    let 
      $du_visitors:=sum($fitting/daily_unique_visitors/unique_visitors),
      (:$du_bots:=sum($fitting/daily_unique_bots/unique_bots),:)
      
      $countries:=
      for $c in $fitting/countries/country let $count:=$c/@count,$name:=$c/text() group by $name return
        <country><name>{$name}</name><visitors>{sum($count)}</visitors></country>,
      
      $cities:=
      for $c in $fitting/cities/city let $name:=$c/text(),$country:=$c/@country group by $country, $name
       return
        <city><name>{$name}</name><country>{$country}</country><visitors>{sum($c/@count)}</visitors></city>,
        
        
      $texts:=
      for $t in $fitting/opened_texts/names/item let $count:=$t/@count, $name:=$t/text(),$idno:=$t/@cc_idno group by $idno order by sum($count) descending
       return
        <text><name>{distinct-values($name)}</name><idno>{distinct-values($idno)}</idno><opened>{sum($count)}</opened></text>
    return
      <total from="{$from}" to="{$to}">
      <daily_unique_visitors>{$du_visitors}</daily_unique_visitors>
      <daily_unique_bots>{(:$du_bots:)}</daily_unique_bots>
      <countries>{$countries}</countries>
      <cities>{$cities}</cities>
      <texts unique_opened_texts="{count($texts)}" total_count="{sum($texts/opened/data())}">{$texts}</texts>
      </total>
  )
};

declare function cc:CE_date_to_BaseX_date($date)
{
    let $a:=analyze-string($date,"[0-9]+") return
    if (string-length($a/fn:match[1])=4) then
        xs:date($a/fn:match[1] || "-" || (if (string-length($a/fn:match[2])=1) then "0" else "") || $a/fn:match[2] || "-" || (if (string-length($a/fn:match[3])=1) then "0" else "") || $a/fn:match[3])
    else
        xs:date($a/fn:match[3] || "-" || (if (string-length($a/fn:match[2])=1) then "0" else "") || $a/fn:match[2] || "-" || (if (string-length($a/fn:match[1])=1) then "0" else "") || $a/fn:match[1])
};
declare function cc:check_date($node,$from,$to)
{
    
  if ($from="" and $to="") then
    true()
  else if ($from!="" and $to !="") then
  (
    
    
  )
};


declare function cc:check_existence_of_author($name,$viaf)
{
    let $hits:=
        if ($viaf!="") then
        (
            for $A in ($cc:meta|$cc:tmp/cc_authors)/item where $A/external[lower-case(@source)="viaf"]/@value=$viaf return $A/cc_idno/data()
        )
        else
            for $A in ($cc:meta|$cc:tmp/cc_authors)/item where $A/name_data/name/data()=$name return $A/cc_idno/data()
    return 
        if (count($hits)=1) then
            $hits
        else
            ""
};


