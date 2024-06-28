module namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module "http://mlat.uzh.ch/2.0" at "log.xq","general_functions.xq", "sphinx.xq";

declare function cc:copy_item($cc_idno)
(:admin_accessible:)
(:2024:)
{
  let 
  $I:=cc:item($cc_idno)
  return 
  if (not(empty($I))) then
  (
    let
    $collection:=$I/parent::*,
    $new_cc_idno:=cc:next_cc_idno(number($cc_idno)<0),
    $db:=db:name($I),
    $nI:=
    element {"item"}
    {
      for $A in $I/(@* except @cc_idno) return $A,
      attribute {"cc_idno"}{$new_cc_idno},
      <cc_idno>{$new_cc_idno}</cc_idno>,
      for $N in $I/(* except (cc_idno|cc_metadata)) return $N,
      <cc_metadata>{cc:md_object_created_node()}</cc_metadata>
    }
    return 
    (
      insert node $nI into $collection,
      cc:indexate($db)
    )
  )
};

declare function cc:move_to_permanent($cc_idnos)
(:admin_accessible:)
(:2023:)
{
    let
        $first_new_idno:=number(cc:next_cc_idno(false())),                          (:first free permanent idno to start with:)
        $idnos:=
            if ($cc_idnos instance of xs:string) then
            (
              if ($cc_idnos!="") then
                tokenize($cc_idnos,",")
              else
                $cc:tmp//item/cc_idno/data()                                         (:all data in tmp:)
            )
            else
                $cc_idnos,
        $new_idnos:=
            map:merge(
                for $idno at $i in $idnos return
                    map:entry($idno,xs:int($first_new_idno+$i - 1))
            ),                                                                      (:map with pairs old (temporary idno):new (permanent) idno:)
        $d1:=prof:dump("Remapping references and cc_idnos"),
        $items:=                                                                    (:get items and change their temporary idno to permanent according to the $new_idnos map:)
            for $idno at $i in $idnos
                let $I1:=db:text("corpus_corporum_tmp",$idno)/parent::cc_idno/ancestor::item,
                $d2:=prof:dump($i || "/" || count($idnos) || ": " || $idno)
                return 
                (
                    copy $I2:=$I1 modify
                    (
                        replace value of node $I2/cc_idno with map:get($new_idnos,$I2/cc_idno/text()),
                        replace value of node $I2/@cc_idno with map:get($new_idnos,$I2/cc_idno/text()),
                        for $ref in $I2//*[@cc_idno_ref] return                     (:not only idnos must be changed, but references too:)
                            if (map:get($new_idnos,$ref/text())) then
                                replace value of node $ref with map:get($new_idnos,$ref/text())
                    )
                    return
                    copy $I3:=$I2 modify 
                        (cc:md_object_created($I3))
                    return
                    copy $I4:=$I3 modify
                        (cc:md_object_created($I4))
                    return
                    $I4
                ),   
        $items_really_moved:=                                                       (: In the permanent collection must not be any items with references to temporary items. Such items must be here filtered out:)
            for $item in $items where count($item//*[@cc_idno_ref and number(./text())<0])=0 
            return $item,
        $idnos_really_moved:=
            for $idno in $items_really_moved/cc_idno/data() return
                map:for-each($new_idnos,function($k,$v){if ($v=$idno) then $k})
                
            ,
        $references_to_be_moved:=                                                   (: We must change also the references of the items,which remain in the temporary db and point to really moved items:)
        (
            for $item_ref in $cc:tmp/*/item 
            let $references:=$item_ref//*[@cc_idno_ref and index-of($idnos_really_moved,./data())>0]
            where not(index-of($idnos_really_moved,$item_ref/cc_idno/data()))
            
                return
                (:skutečná změna hodnoty! :)
                
                    for $ref in $references return
                        replace value of node $ref with map:get($new_idnos,$ref/text())
                
        )
        
        return 
        (                                                                           (: insert the new items into the permanent DB :)
        for $items in $items_really_moved let $collection:=$items/@collection group by $collection
        return
            for $item at $i in $items 
              let $d3:=prof:dump($i || "/" || count($items))
            return
                insert node $item as last into $cc:meta/*[local-name(.)=$item/@collection]
        ,                                                                           (:delete the really moved items from the temporary DB :)
        for $idno in $idnos_really_moved let $item:=db:text("corpus_corporum_tmp",$idno)/parent::cc_idno/ancestor::item return
            delete node $item

        ,
        <xq_result status="{if (count($items_really_moved)>0) then "ok" else "error"}" function="cc:move_to_permanent">
            {count($items_really_moved) || " item(s) moved from temporary to permanent DB. " || 
                (if (count($items_really_moved)!=count($items)) then (count($idnos) - count($items_really_moved) || " item(s) not moved due having references to items remaining in the temporary DB. This is not allowed.") else "")} 
        </xq_result>,
        cc:indexate("corpus_corporum_metadata"),
        cc:indexate("corpus_corporum_tmp")
          
        )
};

declare function cc:save_collection_items_multiedit($data)
(:admin_accessible:)
(:2023:)
{

  <xq_result status="ok" function="save_collection_items_multiedit">
  {
    let $data1:=if ($data instance of element()) then $data else parse-xml($data)/item,
        $items_idnos:=tokenize($data1/cc_idno/text(),",") 
    return
    for $idno in $items_idnos return
    (
      let 
        $item:=cc:item($idno),
        $collection:=$item/@collection
      return
      (
        copy $item2:=$item modify
        (
            for $el at $i in $data1//*  where ($el/text()!="[original value]" and $el/text()!="" and local-name($el)!="cc_idno") return(
            
            let $el_path:=cc:get_relative_path_to_node($el,"item"),
            $el_parent_path:=
                if (local-name($el/parent::*)!="item") then 
                    cc:get_relative_path_to_node($el/parent::*,"item")
                else
                    "",
                    
            $item_el:=cc:dynamic-path($item2,$el_path),
            $item_el_parent:=cc:dynamic-path($item2,$el_parent_path) return
            
            if ($item_el) then
                replace value of node $item_el[1] with $el/text()
            else
            insert node element {QName("http://www.tei-c.org/ns/1.0",local-name($el))}{$el/text()} as first into $item_el_parent
            )
            
        ) 
        return 
            cc:save_collection_item($collection,$item2,number($idno)<0)
      )
    )
  }
  </xq_result>
  
};

declare function cc:save_collection_items_from_xml($data)
{
    let 
        $coll_seq:=("cc_authors","cc_works","cc_texts","cc_corpora"),
        $data1:=
        if ($data instance of element()) then $data
        else
            try
            {
                parse-xml($data)
            }
            catch * {<xq_result status="error" error="Invalid XML" function="save_collection_items_from_xml"/>},
    $results:=
        if ($data1/@status="error") then
            $data1
        else
        (
            for $item in $data1//item 
            let 
                $cc_idno:=$item/cc_idno/text(),
                $collection:=
                    if (index-of($coll_seq,local-name($item/parent::*))) then 
                        local-name($item/parent::*)
                    else if (index-of($coll_seq,$item/@collection/data())) then
                        $item/@collection/data()
                    else if ($cc_idno="") then
                        "Collection not specified",
                $db:=
                    if ($cc_idno="" or number($cc_idno)<0) then 
                        "corpus_corporum_tmp"
                    else
                        "corpus_corporum"  
            return
            (
                if ($collection="Collection not specified") then
                    <xq_result status="error" error="Item '{$item/name_data/name/text()}' could not be saved, collection not specified">{$item}</xq_result>
                else if ($cc_idno="") then
                    cc:save_collection_item($collection,$item,true())
                else 
                    cc:save_collection_item($collection,$item,number($cc_idno)<0)
                    
            )
        )
    return 
    <xq_result status="" not_saved="{count($results/xq_result/item)}" saved="count($results/xq_result[@status='ok'])">{$results}</xq_result>
};

declare function cc:save_collection_item($collection,$data,$tmp)
(:admin_accessible:)
(:12/2023:)
{
  let 
    $data1:=if ($data instance of element()) then $data else parse-xml($data),
    $db:=if ($tmp=false()) then db:open("corpus_corporum_metadata") else db:open("corpus_corporum_tmp"),
    $collection_node:=$db/*[local-name()=$collection],
    $new_IDNO:=cc:next_cc_idno(db:name($collection_node)="corpus_corporum_tmp"),
    $data2:= cc:change-element-ns-deep($data1,"http://mlat.uzh.ch/2.0","") 
  return

  if ($collection_node) then
  (
    if (data($data2/cc_idno)="" or data($data2/cc_idno)="new" or data($data2/cc_idno)="0" or not($data2/cc_idno)) then
    ( (:přidáváme nový objekt:)
    
      copy $data3:=$data2 modify
      (cc:md_object_created($data3))
      return
      copy $data4:=$data3 modify
      (cc:md_last_modification($data4))
      return
      copy $data5:=$data4 modify
      (
        if ($data5/cc_idno) then
          replace value of node $data5/cc_idno with $new_IDNO
        else
          insert node <cc_idno>{$new_IDNO}</cc_idno> as first into $data5
        ,
        if ($data5/@cc_idno) then
            replace value of node $data5/@cc_idno with $new_IDNO
        else
            insert node attribute cc_idno {$new_IDNO} into $data5
      )
      return
      copy $data6:=$data5 modify
      (
        if ($data6/@type) then
          ()
        else
          insert node attribute {"type"}{$collection_node/@item_type} into $data6
      )
      return
      insert node $data6 into $collection_node,
        cc:indexate(db:name($collection_node)),
        <xq_result status="ok" function="save_collection_item" new_item_added="true" db="{db:name($collection_node)}">{$new_IDNO}</xq_result>
    )
    else
    ( (:měníme už existující:)
      let
        $ntbr:=$collection_node/item[data(cc_idno)=data($data2/cc_idno)], (:node to be replaced:)
        $md:=$ntbr/cc_metadata  (:metadata si musíme uložit stranou:)
        return
        if ($ntbr) then
        ( 
            copy $data3:=$data2 modify
                (if (not($data3/cc_metadata)) then insert node $md into $data3) return(:pak je přidáme k nově vkládanému:)
            copy $data4:=$data3 modify
                (cc:md_last_modification($data4)) return(:a změníme údaj o poslední úpravě:)
            copy $data5:=$data4 modify
            (
                if ($data5/@cc_idno) then
                    replace value of node $data5/@cc_idno with $data5/cc_idno/data()
                else
                    insert node attribute cc_idno {$data5/cc_idno/data()} into $data5
            )return
            copy $data6:=$data5 modify
            (
                if ($data6/@type) then
                    ()
                else
                (
                    let $cn:=local-name($collection_node),
                        $type:=
                        if ($cn="cc_corpora") then "corpus"
                        else if ($cn="cc_authors") then "author"
                        else if ($cn="cc_works") then "work"
                        else if ($cn="cc_texts") then "text"
                    return
                        insert node attribute {"type"}{$type} into $data6
                )
            )
            return
            (
            replace node $ntbr with $data6,
                cc:indexate(db:name($collection_node)),
                <xq_result status="ok" function="save_collection_item" db="{db:name($collection_node)}" existed="true">{$ntbr/cc_idno/text()}</xq_result>)
        )
        else
            <result status="error" error="The item with given idno ({$data2/cc_idno}) not found!"/>
    ) 
  )
  else
    <result status="error" error="The collection does not exist"/>
};




declare function cc:get_item($cc_idno)
{(:dec 23:)
    if (number($cc_idno)<0) then
        db:text("corpus_corporum_tmp",$cc_idno)/parent::cc_idno/ancestor::item
    else
        db:text("corpus_corporum",$cc_idno)/parent::cc_idno/ancestor::item
};


declare function cc:get_items($cc_idnos)
(:web_accessible:)
{(:dec 23:)
  if ($cc_idnos!="*") then
  (
    
    let $tokenized:=
        if ($cc_idnos instance of xs:string) then
            distinct-values(tokenize($cc_idnos,","))
    return
    <items>
    {
      for $cc_idno in $tokenized return 
        cc:item($cc_idno)
    }
    </items>
  )
  else
  (
    <items>
    {
      for $t in $cc:meta/cc_texts/item where ($t/is_loaded!="true" or not($t/is_loaded)) order by number($t/word_count) return $t
    }
    </items> 
  )
};

declare function cc:get_items($cc_idnos,$with_filesize)
{
  <items>
  {
    for $cc_idno in tokenize($cc_idnos,",") return 
      let $item:=($cc:meta|$cc:tmp)/*/item[data(cc_idno)=$cc_idno] return
      (
        if ($with_filesize=true()) then
        (
          if ($item/xml_file_path/text()!="") then
          (
           copy $item2:=$item modify
           (
             if (file:exists($item2/xml_file_path/text())) then
               insert node attribute filesize {file:size($item2/xml_file_path/text())} into $item2/xml_file_path
             else
               insert node attribute notfound {"true"} into $item2/xml_file_path
           )return $item2
          )
          else
            $item
        )
        else
          $item
      )
  }
  </items>
};

declare function cc:get_item_with_template($cc_idno)
(:web_accessible:)
(:2023:)
{
  <get_item>
    {
        let $item1:=cc:item($cc_idno),
        $sphinx_index:=cc:get_index_of_text($cc_idno)
        return
        (
            
            if (count($item1)!=0) then
                <data collection_name="{local-name($item1/parent::*)}" temporary="{db:name($item1)='corpus_corporum_tmp'}" item_path="{path($item1)}" sphinx_index="{$sphinx_index}">
                    {$item1}
                </data>
            else
                <data error="{concat("no item corresponding to given idno (",$cc_idno,")")}"/>
            ,
            if (count($item1)!=0) then doc(concat($cc:home_folder,"/ccadmin/collections/",local-name($item1/parent::*),"/item_template.xml"))
            
        )
    }
  </get_item>
};



declare function cc:get_template($collection)
(:web_accessible:)
{
  doc(concat($cc:home_folder,"/ccadmin/collections/",$collection,"/item_template.xml"))
};



declare function cc:get_template($collection,$names_from_idnos)
(:admin_accessible:)
{(:pro hromadnou editace: v takovém případě nechceme data jednotlivých editovaných objektů, ale jen jejich názvy a šablonu:)
  let $collection_name:=replace($collection,"/","") return
  <get_items multiediting="true">
    <items>
    {
        let $idnos:=if ($names_from_idnos instance of xs:string) then tokenize($names_from_idnos,",") return
        for $idno in $idnos let $item:=cc:item($idno) return
         <item>
         {
           $item/name_data/name,
           $item/cc_idno
         }
         </item>
     
    }
    </items>
  {doc(concat($cc:home_folder,"/ccadmin/collections/",$collection_name,"/item_template.xml"))}
  </get_items>
};

declare updating function cc:remap_selected_references($selected_references,$new_idno)
{ (:změna referencí objektu, v $selected_references musí být sekvence adres:)
  for $s in $selected_references return
   replace value of node $s with $new_idno
};



declare updating function cc:remap_all_references($of_object_idno,$new_idno)
{ (:změna všech referencí objektu, v $of_object musí být idno starého objektu:)
(:2023:)
 for $ref in ($cc:meta|$cc:tmp)/*[local-name(.)!="data"]//*[@cc_idno_ref] where data($ref)=$of_object_idno return
   replace value of node $ref with data($new_idno),
   <xq_result status="ok">{concat("References to ",$of_object_idno," remaped to ",$new_idno)}</xq_result>
};



declare updating function cc:delete_items($cc_idno_seq,$delete_if_referenced_mode)
(:admin_accesible:)
{
    let $idnos:=
        if ($cc_idno_seq instance of xs:string) then 
            tokenize($cc_idno_seq,",")
        else
            $cc_idno_seq
    return
    <xq_result function="cc:delete_items">
    {
        for $item in $idnos return
            cc:delete_item($item,$delete_if_referenced_mode,false())
    }
    </xq_result>,
    cc:indexate("corpus_corporum_tmp")
    (:cc:indexate("corpus_corporum"):)
};



declare updating function cc:delete_item($cc_idno,$delete_if_referenced_mode,$indexate)
{ (:funkce smaže objkt s cc_idno=$cc_idno, druhý parametr může mít hodnoty:
  0=nemaže,pokud má reference
  1=smaže a reference nastaví na 0
  2=smaže, rekurzivně, i odkazující objekty:)
  let   
    $ref:= ($cc:meta|$cc:tmp)/(* except data)//*[@cc_idno_ref][data(.)=$cc_idno], 
    $node:=($cc:meta|$cc:tmp)/(* except data)//item[data(cc_idno)=$cc_idno] 
    return
  if (not($ref)) then (:žádné reference nemáme, můžeme mazat:) 
  (
    if ($node) then
    (
        if ($node/@type="text" or local-name($node/parent)="cc_texts") then
        (
            delete node $node,
            delete node $cc:meta/data/tdata[cc_idno=$node/cc_idno/data()],
            if ($indexate=true()) then cc:indexate(db:name($node)),
                <xq_result status='ok' cc_idno='{$cc_idno}'>{concat($cc_idno,": not referenced, deleted. Type=text, textual data deleted too")}</xq_result>
        )
        else
        (
            delete node $node,
            if ($indexate=true()) then cc:indexate(db:name($node)),
                <xq_result status='ok' cc_idno='{$cc_idno}'>{concat($cc_idno,": not referenced, deleted")}</xq_result>
        )
    )
    else
      <xq_result status='error' cc_idno='{$cc_idno}'>{concat($cc_idno,": not found")}</xq_result>
  )
  else
  (
      if ($delete_if_referenced_mode="0") then
        <xq_result status='error' cc_idno='{$cc_idno}'>{concat($cc_idno,":  referenced: not deleted")}</xq_result>
      else if  ($delete_if_referenced_mode="1")then  
        (
          cc:remap_all_references($cc_idno,"0"),delete node $node,
          <xq_result status='warning' cc_idno='{$cc_idno}'>{concat($cc_idno,": referenced: all references ", count($ref), " set to 0")}</xq_result>
        )
  )
};



declare function cc:clear_temporary_db()
(:admin_accessible:)
(: dec 23:)
{
    delete nodes $cc:tmp/*,
    insert nodes (<cc_authors/>,<cc_works/>,<cc_texts/>) into $cc:tmp,
    <xq_response status="ok">Temporary DB cleared.</xq_response>
};



declare updating function cc:set_time_data($item,$string,$minus_sign_meaning)
{
  (:  :)
  let $time_data:=
  if ($string!="") then
  (
    <time_data>
    <textual_information>{$string}</textual_information>
    {
    if (matches($string,"^(saec\.|s\.)?\s*([IXV]+)\.?")) then
    (
      let $century:=analyze-string($string,"(saec\.|s\.)?\s*([IXVixv]+)\.?.*(ex\.|exeunte|in\.|ineunte|med.)?") return
      (
        if (not($century/fn:matches/fn:group[@nr="3"])) then
          (
            cc:create_event(string(100*(cc:arab($century/fn:match/fn:group[@nr="2"],0)-1)+1),"born","after"),
            cc:create_event(string(100*(cc:arab($century/fn:match/fn:group[@nr="2"],0))),"died","before")
          )
        else if  ($century/fn:matches/fn:group[@nr="3"]/text()="med.") then
        (
            cc:create_event(string(100*(cc:arab($century/fn:match/fn:group[@nr="2"],0)-1)+50),"died","circa")
        )
      )
      
    )
    else if (matches($string,"(.*)(,|\s-\s)(.*)")) then
    (
      let $m1:=analyze-string($string,"(.*)(,|\s-\s)(.*)") return
      (
        cc:create_event($m1/fn:match/fn:group[@nr="1"],"born","certain"),
        cc:create_event($m1/fn:match/fn:group[@nr="3"],"died","certain")
      )
    )
    else
    (
      cc:create_event($string,"died","circa")
    )
    
  }
    </time_data>
    
  )
  (: return $time_data :)
  return
    if ($item) then
      if ($item/time_data) then
        replace node $item/time_data with $time_data
      else
        insert node $time_data into $item
};

declare function cc:create_event($date_string,$event,$cert)
{
  let $string:=lower-case($date_string)
  let 
    $event_type:=analyze-string($string,"(m\.|n\.|d\.|b\.|died|born|†|\*|f\.|fl\.|floruit|sedit)")/fn:match/fn:group/text(),
    $certainty:=string-join(analyze-string($string,"([^e]c\.|ca\.|circa|around|ante|before|post|after|between)")/fn:match/fn:group/text()),
    $dmy:=analyze-string($string,"([0-9]{1,2})\s*[\-.]\s*([0-9]{1,2})\s*[\-.]\s*(\-?\s*[0-9]{1,4})\s*(ad|bc\.?)?"),
    $range:=if (not($dmy/fn:match)) then analyze-string($string,"(\-?\s*[0-9]{1,4})\s*(ad|bc\.?)?\s*[\-/]\s*([0-9]{1,4})\s*(ad|bc\.?)?") else <x></x>,
    $year:=analyze-string($string,"(-?\s*[0-9]{1,4})\s*(ad|bc\.?)?"),
    $century:=analyze-string($string,"(saec\.|s\.)\s*([ivx]*)\.?\s*(in\.|ineunte|ex\.|exeunte|med\.)?"),
    
    $event_res:=
    (
      if ($event_type='m.' or $event_type='d.' or $event_type='died' or $event_type='†') then 
        'died'
     else if ($event_type='n.' or $event_type='b.' or $event_type='born' or $event_type='*') then 
        'born'
     else if ($event_type='f.' or $event_type='fl.' or $event_type='floruit') then 
        'floruit'
     else if ($event_type='sedit') then 
        'sedit'
     else
       $event
    ),
    $cert_res:=
    (
      if (matches($certainty,'ante|before')) then 'before'
      else if (matches($certainty,'post|after')) then 'after'
      else if (matches($certainty,'c\.|ca\.|circa|around') or ($range/fn:match and $event_res!="sedit")) then 'circa'
      else if ($dmy/fn:match) then 'certain'
      else
        $cert
    )
    return
    

    <event what="{$event_res}"
     certainty="{$cert_res}"
       >
       <date1>
       {
         if ($dmy/fn:match) then
         (
           <day>{$dmy/fn:match[1]/fn:group[@nr="1"]/text()}</day>,
           <month>{$dmy/fn:match[1]/fn:group[@nr="2"]/text()}</month>,
           <year>{if (matches($dmy/fn:match/fn:group[@nr='4'],"bc\.?")) then '-' }{normalize-space($dmy/fn:match[1]/fn:group[@nr="3"]/text())}</year>
         )
         else if ($range/fn:match) then
         (
            <year>{if (matches($range/fn:match/fn:group[@nr='2'],"bc\.?")) then '-' }{normalize-space($range/fn:match/fn:group[@nr="1"]/text())}</year>
         )
         else if ($year/fn:match) then
         (
            <year>{if (matches($year/fn:match/fn:group[@nr='2']/text(),"bc\.?")) then '-' }{normalize-space($year/fn:match/fn:group[@nr="1"]/text())}</year>
         )
         else if ($century/fn:match) then
         (
            <ydear>{
              if ($century/fn:match[1]/fn:group[@nr="3"]/text()="med.") then
                string(50+100*(cc:arab($century/fn:match[1]/fn:group[@nr="2"]/text(),0)))
              else
                string(100*(cc:arab($century/fn:match[1]/fn:group[@nr="2"]/text(),0)-1))
            }</ydear>
         )
       }
       </date1>
       {
         if ($range/fn:match) then
         (
           <date2>
             <year>{if (matches($range/fn:match/fn:group[@nr='4'],"bc\.?")) then '-' }{normalize-space($range/fn:match/fn:group[@nr="3"]/text())}</year>
           </date2>
         )
       }
        </event>
    

};

declare function cc:get_normalized_years($I)
{
    cc:get_normalized_years($I,())
};

declare function cc:get_normalized_years($I,$Author)
{(:this functions extracts the "normalized" year: for work it's year of composition, for author year of death or floruit to:)
  
  if ($I/@type="work") then
  (
    if ($I/time_data/event[@what="work_composition"]/date1/year/text()!="") then
      <years><year1 what="work_composition">{$I/time_data/event[@what="work_composition"]/date1/year/text()}</year1></years>
    else
    (
        let $A:=
            if ($Author!=() and $Author!="") then $Author
            else
            (
                db:attribute("corpus_corporum",$I/author_data/primary_author_idno/data(),"*:cc_idno")/ancestor::item
            ),
        $Ay:=cc:get_normalized_years($A) 
        return
        if ($A) then
            <years><year1 what="author_date" author_name="{$Ay/@item_name}" author_idno="{$Ay/@item_idno}">{$Ay/year2/text()}</year1></years>
        else
            <years><year1>0</year1></years>
     )
  )
  else if ($I/@type="author") then
  (
    let $y1:=
      if ($I/time_data/event[@what="floruit_from"]/date1/year/text()!="") then
        $I/time_data/event[@what="floruit_from"]/date1/year/text()
      else if ($I/time_data/event[@what="born"]/date1/year/text()!="") then
        $I/time_data/event[@what="born"]/date1/year/text()
      else if ($I/time_data/event[@what="floruit"]/date1/year/text()!="") then
        $I/time_data/event[@what="floruit"]/date1/year/text()
      else
        "0",
      
      
      
    $y2:=
      if ($I/time_data/event[@what="floruit_to"]/date1/year/text()!="") then
        $I/time_data/event[@what="floruit_to"]/date1/year/text()
      else if ($I/time_data/event[@what="died"]/date1/year/text()!="") then
        $I/time_data/event[@what="died"]/date1/year/text()
      else if ($I/time_data/event[@what="floruit"]/date1/year/text()!="") then
        $I/time_data/event[@what="floruit"]/date1/year/text()
      else
        "0"
    
     let $year1:=
       if ($y1="0" and $y2!="0") then
         $y2
       else
         $y1
     let $year2:=
       if ($y2="0" and $y1!="0") then
         $y1
       else
         $y2
        
    return
    <years item_name="{$I/name_data/name}" item_idno="{$I/cc_idno}"><year1>{$year1}</year1><year2>{$year2}</year2></years>
  )
  
  
};
declare function cc:get_decisive_year($I)
{
  let $years:=$I=>cc:get_normalized_years() return 
  if ($years/year2!="0") then $years/year2/text()
  else  $years/year1/text()
};

declare function cc:get_data($I)
{
  let $events:=
  for $e in $I/time_data/event return
  (
      if ($e/date2=>cc:datum_to_string()="") then
      (
        if ($e/date1=>cc:datum_to_string()!="" ) then 
          concat($e/@what," ",$e/date1=>cc:datum_to_string()) 
      )
      else
      (
        if ($e/date2=>cc:datum_to_string()!="" ) then 
          concat($e/@what," ",$e/date1=>cc:datum_to_string(),"/",$e/date1=>cc:datum_to_string()) 
        else
          if ($e/date1=>cc:datum_to_string()!="" ) then 
            concat($e/@what," ",$e/date1=>cc:datum_to_string()) 
      )
  )
  return
  if (count($events)=2) then
  (
    concat($events[1],", ",$events[2])
  )
  else
  $events
};
declare function cc:datum_to_string($date)
{
  let $y:=
  if (not($date/year)) then ""
  else
  (
    if (matches($date/year/text(),"-[0-9]*")) then
      concat(analyze-string($date/year/text(),"-([0-9]*)")/fn:match/fn:group," BC")
    else
      $date/year/text()  
  ),
  $t:=
  if ($date/day and $date/day/text()!="" and $date/month and $date/month/text()!="" and $date/year and $date/year/text()!="") then
  (
    concat($date/day/text(),".",$date/month/text(), ".",$y)
  )
  else if ($y !="") then
    $y
  else
    ""
    
  return 
  if ($t!="" and $date/@certainty="circa" or $date/@certainty="before" or $date/@certainty="after") then
  concat($date/@certainty," ",$t)
  else
  $t
};





(: nové (prosinec 23) funkce pro vytváření objektů z XML :)


declare function cc:insert_items_into_temporary_data($items)
{
    let $get_one_type:=function($items,$type)
    {
        for $i in $items/item where $i/@type=$type and number($i/cc_idno/data())<0 return
            copy $i2:=$i modify
            (
                delete nodes ($i2/@exists,$i2/paths)
            )
            return 
            $i2
    },
    $exists_Ac:=if ($cc:tmp/cc_authors) then true() else false(),
    $exists_Wc:=if ($cc:tmp/cc_works) then true() else false(),
    $exists_Tc:=if ($cc:tmp/cc_texts) then true() else false(),
    
    $AA:=$get_one_type($items,"author"),
    $WW:=$get_one_type($items,"work"),
    $TT:=$get_one_type($items,"text")
    
    return
    (
        if ($exists_Ac) then
            insert nodes $AA into $cc:tmp/cc_authors
        else
            insert node <cc_authors>{$AA}</cc_authors> into $cc:tmp,
        if ($exists_Wc) then
            insert nodes $WW into $cc:tmp/cc_works
        else
            insert node <cc_works>{$WW}</cc_works> into $cc:tmp,
        if ($exists_Tc) then
            insert nodes $TT into $cc:tmp/cc_texts
        else
            insert node <cc_texts>{$TT}</cc_texts> into $cc:tmp,
        cc:indexate("corpus_corporum_tmp")
         
    )    
};



declare function cc:extract_items_from_teiHeader($path,$xpaths_map,$output)
(:admin_accessible:)
{
    let       
        $loaded_files_list:=($cc:meta|$cc:tmp)/cc_texts/item/xml_file_path/text(),
        $authors:=cc:extract_item_type_from_teiHeader(map{"path":$path,"type":"author","xpaths_map":$xpaths_map?author,"already_loaded":$loaded_files_list}),
        $works:=cc:extract_item_type_from_teiHeader(map{"path":$path,"type":"work","authors":$authors,"xpaths_map":$xpaths_map?work,"already_loaded":$loaded_files_list}),
        $texts:=cc:extract_item_type_from_teiHeader(map{"path":$path,"type":"text","works":$works,"xpaths_map":$xpaths_map?text,"already_loaded":$loaded_files_list})
    return
    
    if (number($output)=0) then (:output probably to file:)
        <items>{$authors,$works,$texts}</items>
    else (:inserting directly into temporary_data:)
        cc:insert_items_into_temporary_data(<items>{$authors,$works,$texts}</items>)
        
};

declare function cc:extract_item_type_from_teiHeader($opt)
{
    let $path2:=
        if (starts-with($opt?path,"/")) then
            $opt?path
        else
            "/var/www/html/data/" || $opt?path,
        $filelist:=
        if (file:is-dir($path2)) then
            file:list($path2)
        else
            $path2,
        
        $item_list:=
            for $f at $i in $filelist 
            let
                $d:=prof:dump($f),
                $file_path:=file:resolve-path($f,$path2),
                $doc:=doc($file_path)
            where 
              index-of($opt?already_loaded,$file_path)=>empty() and ends-with($f,".xml")
            
            return
            (
                prof:dump($i || "/" || count($filelist) || ": extracting " || $opt?type || " from " || $file_path),
                try
                {
                  if ($opt?type="author") then
                      cc:extract_author_from_teiHeader($doc,$file_path,$opt?xpaths_map)
                  else if ($opt?type="work") then
                      cc:extract_work_from_teiHeader($doc,$file_path,$opt?authors,$opt?xpaths_map)
                  else if ($opt?type="text") then
                    cc:extract_text_from_teiHeader($doc,$file_path,$opt?authors,$opt?works,$opt?xpaths_map)
                }   
                catch * {prof:dump("ERROR: " || $err:code || ", " || $err:description)}
            )
        ,
        $grouped_item_list:=
        for $item in $item_list
        let 
            $name:=$item/name_data/name/text(),
            $paths:=$item/path,
            $author_idno:=$item/author_data/primary_author_idno/text()
        group by $name,$author_idno
        return 
            
            copy $i2:= $item[1] modify
            (
                delete node $i2/path,
                insert node <paths>{$paths}</paths> into $i2
            )
            return $i2
            
        
        return $grouped_item_list
    
};


declare function cc:exists_in_db($map)
{
    let 
    $external_id_match:=function($item1_e,$item2_e)
        {   
            some $e in 
            (
                for $ie1 in $item1_e
                return
                    some $ie2 in $item2_e
                    satisfies
                        ($ie2/@source=$ie1/@source and ($ie2/@value=$ie1/@value and $ie2/@value/data()!=""))
            )
            satisfies ($e=true())
        },
    $name_match:=function($name_of_new,$item2)
    {
        if ($name_of_new=$item2/name_data/name/text()) then
            1
        else if (some $syn in $item2/name_data/synonym/text() satisfies ($syn=$name_of_new)) then
            2
        else 
            0
    },
    $author_match:=function($primary_author_idno,$item2)
    {
        if ($primary_author_idno) then
        (
            if ($primary_author_idno=$item2/author_data/primary_author_idno/text()) then
                true()
            else
                false()
        )
        else
            true() (: primary_author_idno is not set, i. e. we are working with author (and thus, this is irrelevant) :)
    }
    return
    let $found:=
        for $item in $cc:meta/*[local-name(.)=$map?collection]/item
        let 
            $i2_externals:=$item/external,
            $i2_cc_idno:=$item/cc_idno,
            $externals_match:=$external_id_match($map?externals,$i2_externals),
            $names_match:=$name_match($map?name,$item),
            $authors_match:=$author_match($map?author_idno,$item)
        return
        (
            
            if ($externals_match=true()) then
                (1,$item/cc_idno/data())
            else if ($names_match!=0 and $authors_match=true()) then
                ($names_match,$item/cc_idno/data())
        )
    return
    if (count($found)=0) then
        0
    else
        $found
};

declare function cc:extract_externals($node)
{
    for $ptr in $node/(tei:ptr|@ref)
    let $value:=if ($ptr/self::tei:ptr) then $ptr/@target else $ptr/data()
    return
      <external>
      {
          
          if (contains($value,"viaf.org")) then
          (
              attribute source{"VIAF"},
              attribute type{"id"},
              attribute value{analyze-string($value,"[0-9]+$")/fn:match}
          )
          else if (contains($value,"mirabileweb.it")) then
          (
              attribute source{"Mirabile"},
              attribute type{"ref"},
              attribute value{$value}
          )
      }
      </external>
     
    
};
declare function cc:teiHeader_map($teiHeader)
{
    map
    {
        "teiHeader":$teiHeader,
        "fileDesc":$teiHeader/tei:fileDesc,
        "titleStmt":$teiHeader/tei:fileDesc/tei:titleStmt,
        "publicationStmt":$teiHeader/tei:fileDesc/tei:publicationStmt,
        "editionStmt":$teiHeader/tei:fileDesc/tei:editionStmt,
        "seriesStmt":$teiHeader/tei:fileDesc/tei:seriesStmt,
        "sourceDesc":$teiHeader/tei:fileDesc/tei:sourceDesc
    }
    
};
declare function cc:dynamic_xpath($key,$xpath_map,$var_map)
{
    if ($xpath_map instance of map(*)) then
    (
        let $v:=$xpath_map?($key)
        return
        if ($v) then
        (
            if (starts-with($v,"$")) then
            (
                let $parent_key:=substring-after(cc:substring-before-if-contains($v,"/"),"$"),
                $path_from_parent:=substring-after($v,"/"),
                $parent:=$var_map?($parent_key)
                return
                if ($parent) then
                (
                    cc:dynamic-path($parent,$path_from_parent)
                )
            )
            else (: the value is simple literal value, we can just return it :)
                $v
        )
    )
    else
        ""
    
};

declare function cc:extract_author_from_teiHeader($doc,$path,$xpaths_map)
{
    let 
    $teiH:=cc:teiHeader_map($doc/tei:TEI/tei:teiHeader),
    $dynamic_xpath:=function($key)
    {
        cc:dynamic_xpath($key,$xpaths_map,$teiH)
    },
    $tmp_idno:=(1000000+random:integer(1000000)) * -1,
    $persName:=
        normalize-space
            (string-join(
                if ($teiH?titleStmt/tei:author/tei:persName) then 
                    $teiH?titleStmt/tei:author/tei:persName/text()
                else
                    $teiH?titleStmt/tei:author/text()
                )
            ),
    $externals:=cc:extract_externals($teiH?titleStmt/tei:author),
    $exists:=cc:exists_in_db(map{"collection":"cc_authors","name":$persName,"externals":$externals}),
    $idno_to_use:=
        if ($exists=0) then
            $tmp_idno
        else if (count($exists)>2) then
            $tmp_idno
        else if ($exists[1]=1) then 
            $exists[2]
        else
            $tmp_idno
            
    return
    (
    <item cc_idno="{$idno_to_use}" type="author" collection="cc_authors" exists="{$exists}">
        <cc_idno>{$idno_to_use}</cc_idno>
        <name_data>
            <name>
            {
                $persName
            }
            </name>
        </name_data>
        <time_data>
        {
            cc:extract_time_data($dynamic_xpath("time_data"),"author")
            
        }
        </time_data>
        
        
        {$externals}
        
        <path>{$path}</path>
    </item>
    )
};

declare function cc:extract_work_from_teiHeader($doc,$path,$authors,$xpaths_map)
{
    let 
    $get_author_idno:=function($authors,$path)
    {
        let $A:=$authors[some $p in paths/path/data() satisfies $p=$path]
        return 
        map{"cc_idno":$A/cc_idno/data(),"name":$A/name_data/name/text()}
    },
    $teiH:=cc:teiHeader_map($doc/tei:TEI/tei:teiHeader),
    $dynamic_xpath:=function($key)
    {
        cc:dynamic_xpath($key,$xpaths_map,$teiH)
    },
    $tmp_idno:=(2000000+random:integer(1000000)) * -1,
    $title:=
        normalize-space
            (string-join($teiH?titleStmt/tei:title/text())
            ),
    $externals:=cc:extract_externals($teiH?titleStmt/tei:title),
    $author_map:=$get_author_idno($authors,$path),
    $exists:=cc:exists_in_db(map{"collection":"cc_works","name":$title,"author_idno":$author_map?cc_idno,"externals":$externals}),
    $idno_to_use:=
        if ($exists=0) then
            $tmp_idno
        else if (count($exists)>2) then
            $tmp_idno
        else if ($exists[1]=1) then 
            $exists[2]
        else
            $tmp_idno
            
    return
    (
    <item cc_idno="{$idno_to_use}" type="work" collection="cc_works" exists="{$exists}">
        <cc_idno>{$idno_to_use}</cc_idno>
        <name_data>
            <name>
            {
                $title
            }
            </name>
        </name_data>
        <time_data>
        {
            cc:extract_time_data($dynamic_xpath("time_data"),"work")
                       
        }
        </time_data>
        <author_data>
            <primary_author_idno cc_idno_ref="1" tmp-name="{$author_map?name}">{$author_map?cc_idno}</primary_author_idno>
        </author_data>
        
        
        {$externals}
        
        <path>{$path}</path>
        
    </item>
    )
};





declare function cc:extract_text_from_teiHeader($doc,$path,$authors,$works,$xpaths_map)
{
    let 

    $get_work_data:=function($works,$path)
    {
        let $W:=$works[some $p in paths/path/data() satisfies $p=$path]
        return 
        map{"cc_idno":$W/cc_idno/data(),"author_name":$W/author_data/primary_author_idno/@tmp-name/data(),"title":$W/name_data/name/text()}
    },

    $teiH:=cc:teiHeader_map($doc/tei:TEI/tei:teiHeader),
    $dynamic_xpath:=function($key)
    {
        cc:dynamic_xpath($key,$xpaths_map,$teiH)
    },
    
    $tmp_idno:=(3000000+random:integer(1000000)) * -1,
    $work_map:=$get_work_data($works,$path),
    $title:=
        $work_map?title || " (" || $work_map?author_name || "), " || string-join($dynamic_xpath("title-part-3"),", "),
    $externals:=cc:extract_externals($teiH?titleStmt/tei:title),
    
    $exists:=cc:exists_in_db(map{"collection":"cc_texts","name":$title,"author_idno":$work_map?cc_idno,"externals":$externals}),
    $idno_to_use:=
        if ($exists=0) then
            $tmp_idno
        else if (count($exists)>2) then
            $tmp_idno
        else if ($exists[1]=1) then 
            $exists[2]
        else
            $tmp_idno
            
    return
    (
    <item cc_idno="{$idno_to_use}" type="text" collection="cc_texts" exists="{$exists}">
        <cc_idno>{$idno_to_use}</cc_idno>
        <name_data>
            <name>
            {
                $title
            }
            </name>
        </name_data>
        <work_idno cc_idno_ref="1">{$work_map?cc_idno}</work_idno>
        <xml_file_path>{$path}</xml_file_path>
        <corpus cc_idno_ref="1">{$dynamic_xpath("corpus_idno")}</corpus>
        <xml_provenience>
            <source>
              {
                for $s in $dynamic_xpath("xml_provenience/source") return $s/text()
              }
            </source>
            
            
            
            {for $ed in $dynamic_xpath("xml_provenience/editor") return
                <editor>{$ed/text()}</editor>}
            
        </xml_provenience>
        <publication_data>
        {
            for $ed in $dynamic_xpath("publication_data/editor") return
                <editor>{$ed/text()}</editor>,
            for $ed in $dynamic_xpath("publication_data/publisher") return
                <publisher>{$ed/text()}</publisher>,
            for $ed in $dynamic_xpath("publication_data/publication_place") return
                <publication_place>{$ed/text()}</publication_place>,
            for $ed in $dynamic_xpath("publication_data/date") return
                <publication_date>{$ed/text()}</publication_date>
        }
        </publication_data>
         {$externals}
         
        <path>{$path}</path>
    </item>
    )
};



declare function cc:extract_time_data($str,$obj_type)
{
    let $year_from_string:=function($str)
    {
        if (matches($str,"[0-9]+\s*(BC|BCE)")) then
            "-" || analyze-string($str,"[0-9]+")/fn:match/text()
        else if (matches($str,"[0-9]+\s*(AD)?")) then
            analyze-string($str,"[0-9]+")/fn:match/text()
    },
    
    $date_from_string:=function($str)
    {
        <date>
        {
            if (matches($str,"f\.|fl\.|floruit")) then
                attribute what{"floruit"}
            else if (matches($str,"s\.|sedit")) then
                attribute what{"sedit"}
            else
                attribute what{"undefined"},
                
            if (matches($str,"c\.|circa|\ca\.")) then
                attribute certainty{"circa"}
            else if (matches($str,"before|ante")) then
                attribute certainty{"before"}
            else if (matches($str,"after|post")) then
                attribute certainty{"after"}
            else if (matches($str,"([0-9]+)/([0-9]+)")) then
            (
                let $a:=analyze-string($str,"([0-9]+)/([0-9]+)")/fn:match
                return
                (
                    attribute certainty{"between"},
                    attribute year1{$year_from_string($a/fn:group[@nr="1"])},
                    attribute year2{$year_from_string($a/fn:group[@nr="2"])}
                )
            )
            else
                attribute certainty{"certain"},
            
            <year>
            {
                $year_from_string($str)
            }
            </year>
            
        }
        </date>
        
    },
    $create_event:=function($d1,$d2,$first_or_second)
    {
        <event>
            {
                if ($first_or_second=1) then (:two datums, we work with first:)
                (
                    $d1/@certainty,
                    if ($d1/@what="undefined") then
                    (
                        if ($obj_type="author") then attribute what{"born"} else if ($obj_type="work") then attribute what{"work_composition"},
                        if ($d1/@certainty="between") then
                        (
                            <date1>
                            {
                                <year>{$d1/@year1}</year>
                            }
                            </date1>,
                            <date2>
                            {
                                <year>{$d1/@year2}</year>
                            }
                            </date2>
                        )
                        else
                            <date1>
                            {
                                $d1/year
                            }
                            </date1>
                    )
                    else
                    (   
                        attribute what{$d1/@what},
                        <date1>
                        {
                            $d1/year
                        }
                        </date1>,
                        <date2>
                        {
                            $d2/year
                        }
                        </date2>
                    )
                )
                else if ($first_or_second=0) then
                (
                    $d1/@certainty,
                    if ($d1/@what="undefined") then
                    (
                        if ($obj_type="author") then attribute what{"died"} else if ($obj_type="work") then attribute what{"work_composition"}
                    )
                    else
                    (
                        attribute what{$d1/@what}
                    ),
                    <date1>
                    {
                        $d1/year
                    }
                    </date1>
                )
                else if ($first_or_second=2) then
                (
                    $d2/@certainty,
                    if ($d2/@what="undefined") then
                    (
                        if ($obj_type="author") then attribute what{"died"} else if ($obj_type="work") then attribute what{"work_composition"},
                        if ($d2/@certainty="between") then
                        (
                            <date1>
                            {
                                <year>{$d2/@year1}</year>
                            }
                            </date1>,
                            <date2>
                            {
                                <year>{$d2/@year2}</year>
                            }
                            </date2>
                        )
                        else
                            <date1>
                            {
                                $d2/year
                            }
                            </date1>
                    )
                    else
                    (
                        attribute what{$d2/@what}
                    )
                )                    
                    
                
            }
            </event>
    }
    return 
    if (matches($str,"(.+)[–\-](.+)")=true()) then
    (
        
        let $as:=analyze-string($str,"(.+)[–\-](.+)"),
        $d1:=$date_from_string($as/fn:match/fn:group[@nr="1"]/text()),
        $d2:=$date_from_string($as/fn:match/fn:group[@nr="2"]/text())
        return
        (
            let 
                $e1:=$create_event($d1,$d2,1),
                $e2:=$create_event($d1,$d2,2)
            return
            (
                $e1,
                if ($e2/data()!="") then $e2
            )
        )
        
    )
    else
    (
        let $d:=$date_from_string($str)
        return 
            $create_event($d,(),0)
    )
};


declare function cc:get_folder_info($folder)
(:admin_accessible:)
(:  function to get list of files in a data folder in the process of creating DB-items from XMLs; 
    Meant to be called directly by frontend
    created: 14.12.2023

:)
{

    <folder path="{$folder}">
    {
        let 
        $p:=file:resolve-path("data/" || $folder,$cc:home_folder),
        $fl:=file:list($p)
        return
        for $f in $fl
        let 
            $xml:=ends-with($f,".xml"),
            $abs_path:=file:resolve-path($f,$p),
            $size:=file:size($abs_path),
            $size_hr:=
            if ($size<1024) then
                $size || " B"
            else if ($size<1048576) then
                round($size div 1024,1) || " KB"
            else
                round($size div 1048576,1) || " MB",
            $valid:= 
                if($xml) then
                    if (count($fl)<500) then
                        if (doc-available($abs_path)) then 1 else 0
                    else
                        2
                    else
                        0
                
            where $xml=true()
        return
        (
            <file state="{if ($valid=0) then "invalid" else if ($valid=1) then 'ok' else 'unknown'}" size="{$size}" size_hr="{$size_hr}">
            {
                if ($valid=0) then
                    attribute error{"invalid XML"}
                else if ($valid=2) then
                    attribute error{"too much files"},
                $f
                    
            }
            </file>

        )
    }
    </folder>
};
