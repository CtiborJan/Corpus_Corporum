module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace html="http://www.w3.org/1999/xhtml/";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "get_sentence.xq", "collection_manipulation.xq","mod_get_text.xq","general_functions.xq";
declare variable $cc:meta_root:=/;
declare variable $cc:mbr:=/;

declare function cc:idnos_in_work($work_idno,$item_type)
{
  let $a:=$cc:meta/cc_works/item[cc_idno=$work_idno]/author_data/primary_author_idno/data() return
  if ($item_type!="author" and $item_type!="authors") then
  (
    let $TT:=$cc:meta/cc_texts/item[work_idno=$work_idno] return
    if ($item_type!="texts") then
    (
      let $cc:=$cc:meta/cc_corpora/item[index-of(data($TT/corpus),data(cc_idno))>0]/cc_idno/data() return
      if ($item_type="all") then
      (
        distinct-values($cc),distinct-values($TT/cc_idno/data()),distinct-values($a)
      )
      else
      (
        distinct-values($cc)
      )
    )
    else
    (
      distinct-values($TT/cc_idno/data())
    )
  )
  else
    distinct-values($a)
};

declare function cc:idnos_in_author($author_idno,$item_type)
{
  let $ww:=$cc:meta/cc_works/item[author_data/*=$author_idno]/cc_idno/data() return
  if ($item_type!="works") then
  (
    let $TT:=$cc:meta/cc_texts/item[index-of($ww,data(work_idno))>0] return
    if ($item_type!="texts") then
    (
      let $cc:=$TT/corpus/data() return
      if ($item_type="corpora") then
      (
        distinct-values($cc)
      )
      else if ($item_type="all") then
      (
        distinct-values($cc),distinct-values($ww), distinct-values($TT/cc_idno/data())
      )
    )
    else
    (
      distinct-values($TT/cc_idno/data())
    )
  )
  else
  (
    distinct-values($ww) 
  )

};


declare function cc:idnos_in_corpus($corpus_idno,$item_type)
{(:$item_type=works,texts,authors,all:)
  let $cc:=$cc:meta/cc_corpora/item[parent_corpus=$corpus_idno] return
  let $tt:=$cc:meta/cc_texts/item[corpus=$corpus_idno]/cc_idno/data() return
  if ($item_type!="texts") then
  (
    let $ww:=$cc:meta/cc_texts/item[corpus=$corpus_idno]/work_idno/data() return
    if ($item_type!="works") then
    (
      let $WW:=
      for $W in $cc:meta/cc_works/item where index-of($ww, data($W/cc_idno))>0 return $W
      return 
      let $aa:=$WW/author_data/primary_author_idno/data()
      return
      if ($item_type="authors") then
      (
        distinct-values($aa)
      )
      else if ($item_type="all") then
      (
        distinct-values($aa),distinct-values($tt),distinct-values($ww)
      )
    )
    else
    (
      $ww
    )
    
  )
  else
    distinct-values($tt)
};

declare function cc:steps_to_idno($steps_orig,$steps_new,$n)
{ 
  
  if ($n<=count($steps_orig)) then
  (
    let $step:=$steps_orig[$n] return
    let $cc_idno:=
    if ($step="" or $step="home") then
      <step t="home">home</step>      
    else if (matches($step,"^[0-9]+$")) then(:already cc_idno:)
      <step t="">{$step}</step>
    else if (matches($step,"^[0-9]+:.*"))  then (:possibly text cc_idno with position inside of the text:)
      <step t="text">{$step}</step>
    else if (matches($step,"^cps|^corpus|^c_|^c:|^c\s*=")) then
    (
      let $cps_nr:=normalize-space(analyze-string($step,"^[^0-9]*([0-9]+)")/fn:match/fn:group[@nr="1"]/text()) return
      <step t="corpus">{$cc:meta/cc_corpora/item[nr=$cps_nr]/cc_idno/text()}</step>
    )
    else if (matches($step,"^work:|^w:|^w\s*=|work\s*=")) then
    (
      let $work_name:=normalize-space(analyze-string($step,"[=:](.*)")/fn:match/fn:group[@nr="1"]/text()) return
      <step t="work">{$cc:meta/cc_works/item[name_data/name=$work_name]/cc_idno/text()}</step>
    )
    else if (matches($step,"^author:|^a:|^a\s*=|^author\s*=")) then
    (
      let $author_name:=normalize-space(analyze-string($step,"[=:](.*)")/fn:match/fn:group[@nr="1"]/text()) return
      <step t="author">{$cc:meta/cc_authors/item[name_data/name=$author_name]/cc_idno/text()}</step>
    )
    else if (matches($step,"^text:|^t:|^t\s*=|^text\s*=")) then
    (
      let $text_name:=normalize-space(analyze-string($step,"[=:](.*)")/fn:match/fn:group[@nr="1"]/text()) return
      <step t="text">{$cc:meta/cc_texts/item[name_data/name=$text_name]/cc_idno/text()}</step>
    )
    else if (matches($step,"^[A-Za-z0-9]+\.[A-Za-z0-9]+$")) then
    (
      <step t="work">{$cc:meta/cc_works/item[cc_id=$step]/cc_idno/text()}</step>
    )
    else if (matches($step,"^Q[0-9]+$")) then
    (
      let $tmp:=$cc:meta/cc_authors/item[external[@source=>lower-case()="wikidata" and @value=$step]]/cc_idno/text()
      return 
      if ($tmp) then <step t="author">{$tmp}</step>
      else
      <step t="work">{$cc:meta/(cc_works)/item[@source=>lower-case()="wikidata" and @value=$step]/cc_idno/text()}</step>
    )
    else if (matches($step,"^(v|v:|viaf|viaf:|viaf\s*=)([0-9])+$","i")) then
    (
      let $viaf_id:=normalize-space(analyze-string($step,"^(v|v:|viaf|viaf:|viaf\s*=)([0-9]+)$","i")/fn:match/fn:group[@nr="2"]/text()),
      $tmp:=$cc:meta/cc_authors/item[external[@source="VIAF" and @value=$viaf_id]]/cc_idno/text()
      return 
      if ($tmp) then <step t="author">{$tmp}</step>
      else
      <step t="work">{$cc:meta/(cc_works)/item[external[@source="VIAF"]/@value/data()=$step]/cc_idno/text()}</step>
    )
    else if (matches($step,"^(m|m:|mirabile|mirabile:|mirabile\s*=)([0-9])+$","i")) then
    (
      let $mirabile_id:=normalize-space(analyze-string($step,"^(m|m:|mirabile|mirabile:|mirabile\s*=)([0-9]+)$","i")/fn:match/fn:group[@nr="2"]/text()) return
      let $tmp:=$cc:meta/cc_authors/item[external[@source=>lower-case()="mirabile" and @value=$mirabile_id]]/cc_idno/text()
      return 
      if ($tmp) then <step t="author">{$tmp}</step>
      else
      <step t="work">{$cc:meta/(cc_works)/item[@source=>lower-case()="mirabile" and @value=$mirabile_id]/cc_idno/text()}</step>
    )
    else if (starts-with($step,"tabelle:")) then
    (
      let $rgx:=analyze-string(substring-after($step,"tabelle:"),"(.*?)_cps([0-9]+)$")/fn:match/fn:group,
      $cps:=cc:cps_number_to_object($rgx[2])/cc_idno/text(),
      $author:=cc:author_name_to_object(replace($rgx[1],"_"," "))/cc_idno/text()
      
      return 
      if ($cps!="" and $author!="") then
        concat("/",$cps,"/",$author)
      else if ($cps!="") then
        concat("/",$cps)
      else if ($author!="") then
        concat("/",$author)
      else
        "/"
    )
    else
    (
      let $tmp:=$cc:meta/(cc_authors|cc_works|cc_texts|cc_corpora)/item[name_data/name=$step]/cc_idno/text() return
      if (count($tmp)>1 and $n>1) then
      (
        let $possible_idnos:=
        (
          if ($steps_new[$n - 1]/@t="corpus") then
          (
            cc:idnos_in_corpus(data($steps_new[$n -1]),"all")  
          )
          else if ($steps_new[$n - 1]/@t="author") then
          (
            cc:idnos_in_author(data($steps_new[$n -1]),"all")  
          )
          else if ($steps_new[$n - 1]/@t="works") then
          (
            cc:idnos_in_work(data($steps_new[$n -1]),"all")  
          )
        )
        return
        (
          cc:value-intersect($possible_idnos,$tmp)
        )
      )
      else
        $tmp
    )
    return 
    if (count($cc_idno)=1) then
      cc:steps_to_idno($steps_orig,($steps_new,$cc_idno),$n+1)
    else (:ambigoous item found, we can't resolve it: we will return the "certain" part of the path:)
      cc:steps_to_idno($steps_orig,$steps_new,count($steps_orig)+1)
    
  )
  else (:we are on the end of the steps sequence:)
    $steps_new
};
declare function cc:translate_address($path)
{
  cc:translate_address($path,false())
};

declare function cc:translate_address($path,$only_last_obj)
(:2024:)
{(:this functions TRIES to translate path identifications from old CC into the new system (i. e. "tabelle" oder "rumpfid":)
  let $new_permalink:=analyze-string($path,"^(cps_[0-9]+\.[a-zA-Z0-9.]+)")
  return
  let $steps:=
  if (count($new_permalink/fn:match)>0) then
  (
    tokenize(cc:translate_new_permalink($new_permalink,$only_last_obj),"/")
  )
  else
    cc:steps_to_idno(distinct-values(tokenize($path,"/")),(),1)

    return
  
    string-join($steps,"/")
};

declare function cc:translate_new_permalink($permalink_SA,$only_last_obj)
{
    let
        $T:=cc:item($permalink_SA/fn:match/fn:group[1]/text()),
        $W:=cc:item($T/work_idno/text()),
        $A:=cc:item($W/author_data/primary_author_idno/text()),
        $C:=cc:item($T/corpus)
    return  
      if ($only_last_obj=true()) then
      (
        if (empty($T)=false()) then
        (
          if (empty($permalink_SA/fn:non-match)) then
            $T/cc_idno/text()
          else
            $T/cc_idno || $permalink_SA/fn:non-match
        )
        else if (empty($W)=false()) then
          $W/cc_idno/text()
        else if (empty($A)=false()) then
          $A/cc_idno/text()
        else
          $C/cc_idno/text()
      )
      else
        $C/cc_idno || "/" || $A/cc_idno || "/" || $W/cc_idno || "/" || $T/cc_idno
        
        
        
};

declare function cc:navigate_new($options)
{

};

declare function cc:summarize_object($options)
{
    let $cc_idno:=$options/cc_idno/data(),
    $group_by:=if ($options/group_by) then $options/group_by/data() else "" (: "" = default :),
    $obj:=cc:item($cc_idno)
    return
    (
        if ($obj/type="corpus") then
        ()
        
        
    )
    
    
};

declare function cc:navigate($options)
{(:tato funkce dostane adresu, tu si přeloží a vrátí:
1) kroky adresy lidsky srozumtelné
2) OBJEKT, který je na konci adresy a všechny s ním svázané (tj.je-li na konci dílo, vrátí i autora
3) vylistuje "virtuální" obsah toho objektu seskupený podle $group_by:)

let $nw:=cc:get_nasty_workaround($options) return
if ($nw=<nothing/>) then
(
  let
    $group_by:=if ($options/group_by) then data($options/group_by) else "",
    $translated_address:=cc:translate_address($options/path/text()),
    $address2:=if ($translated_address="" or $translated_address="/") then "home" else 
    
    if (matches($translated_address,"^[A-Za-z0-9]+\.[A-Za-z0-9]$")=true()) then
      concat("/",$cc:meta/cc_works/item[cc_id=$translated_address]/cc_idno/text)
    else
      $translated_address,
    
    $rv:=
    if ($address2="home") then
      cc:home()
    else
    (
      let $steps:=cc:explode_path($address2),
      $dissolve_subcorpora:=
      if (contains($options/mode/text(),"D_SC")) then true() else false(),
      
      $vc1:=<virtual_collection><cc_corpora>null</cc_corpora><cc_authors>null</cc_authors>
      <cc_works>null</cc_works><cc_texts>null</cc_texts></virtual_collection>, 
      $vc:=cc:filter_virtual_collection($vc1,$steps,1,$dissolve_subcorpora),
      $LS:=(if ($vc/@limited_by_type="work") then
            (let $W:=$cc:meta/cc_works/item[cc_idno=$vc/@limited_by_idno] return
              ($W,
            if ($options/add_informations="true") then 
            <extra_informations>
            <author_name>{cc:author_of_work($W/author_data/primary_author_idno/text())}</author_name>
            {for $sec_author in $W/author_data/secondary_author_idno return
            <author_name role="secondary">{cc:author_of_work($sec_author/text())}</author_name>},
              if ($steps[last()]/@type="work") then
              (
                let $alternative:=db:index($steps[last()]/cc_idno/data())/parent::*/local-name()
                return $alternative
              )
            </extra_informations>))
          else if ($vc/@limited_by_type="text") then
            $cc:meta/cc_texts/item[cc_idno=$vc/@limited_by_idno]
          else if ($vc/@limited_by_type="author") then
            $cc:meta/cc_authors/item[cc_idno=$vc/@limited_by_idno]
          else if ($vc/@limited_by_type="corpus") then
            cc:append_resources_to_object($cc:meta/cc_corpora/item[cc_idno=$vc/@limited_by_idno])
          else if ($steps[last()]/@type="text" or $steps[last()]/@type="text_section" or $steps[last()]/@collection="cc_texts") then
            (
              cc:idno_to_object($steps[last()]/@idno)
            )
       else if ($vc/@limited_by_type="text") then
       (
         <extra_information>
         Ahoj
         </extra_information>
       )
     ),
      $LS_accessibility:=cc:check_accessibility($cc:accessibility,$LS/availability/text())
      return
    
      <navigation address="{$address2}" group_by="{$group_by}" a="{$cc:accessibility}">
        <path_steps>{$steps}</path_steps>
        <last_step accessible="{$LS_accessibility}">{(:poslední objekt, o němž možná budeme chtít zobrazit informace:)
        
          for $last_step in $LS return cc:expand_cc_idno_refs($last_step)
        }
    
        </last_step>
        {cc:virtual_collection_summary($vc)}
        {
          if (($steps[last()]/@type="text" or $steps[last()]/@type="text_section" or $steps[last()]/@collection="cc_texts") and $LS_accessibility=1 ) then
            (<contents>
            {
              (: cc:get_table_of_contents(if ($steps[last()]/@text_section!="") then $steps[last()]/@text_section else $steps[last()]/@idno,"") :)
              cc:get_table_of_contents_NEW(string(if ($steps[last()]/@text_section!="") then $steps[last()]/@text_section/data() else $steps[last()]/@idno/data()))
            }
            </contents>,
            <incipit>
            {
              let $manually_supplied:=$LS[1][@type="text"]/incipit/text()
              return
              if ($manually_supplied!="") then 
                $manually_supplied
              else
               cc:get_incipit(if ($steps[last()]/@text_section!="") then $steps[last()]/@text_section else $steps[last()]/@idno,"")
            }
            </incipit>)
          else if ($LS_accessibility=1) then
            cc:virtual_collection_inner_stat($vc,$group_by,$dissolve_subcorpora)
          else if ($LS_accessibility=0) then
            <access_denied>{cc:accessibility_info($LS/accessibility/text())}</access_denied>
        }
        {
          if (contains($options/mode/text(),"RVC")) then  $vc (:RVC=return virtual collection:)
        }
      </navigation>
    )
    return $rv
)
else
(
  $nw
)
};

declare function cc:expand_cc_idno_refs($item)
{
    copy $item2:=$item modify
    (
        for $cc_idno_ref in $item2//*[@cc_idno_ref] return 
            insert node attribute exp-referenced_item_name {cc:idno_to_name($cc_idno_ref/data())} into $cc_idno_ref
    )
    return $item2
};




declare function cc:idno_to_name($cc_idno)
{
  let $o:=($cc:root|$cc:tmp)/(* except data)/item[cc_idno=$cc_idno] return
  <item_name type="{$o/@type}" idno="{$cc_idno}" id="{$o/cc_id}">{$o/name_data/name/text()}</item_name>
};



declare function cc:idno_to_object($cc_idno)
{
  let $o:=$cc:meta/(cc_temporary_data/*,*)/item[cc_idno=$cc_idno] return
  $o
};




declare function cc:id_to_object($id)
{(:musíme preferovat, než v tom uděláme pořádek: pokud existuje víc obejktů s tímto id, pak vezmeme přednostně work:)
  let $o:=$cc:meta/(cc_temporary_data/*,*)/item[cc_id=$id] return
  if (count($o)>1) then
  (
    if (count($o[@type="work"])>=1) then
      $o[@type="work"][1]
    else
      $o[1]
  )
  else
    $o
};


declare function cc:cps_number_to_object($cps_nr)
{
  for $c in $cc:meta/cc_corpora/item where $c/nr=$cps_nr return $c
};

declare function cc:name_to_object($name)
{
  let $o:=$cc:meta/(cc_temporary_data/*,*)/item[name_data/name=$name] return
  $o
};
declare function cc:author_name_to_object($author_name)
{
  let $o:=$cc:meta/cc_authors/item[name_data/name=$author_name] return
  $o 
};



declare function cc:explode_path($path)
{
  let $steps:=tokenize($path,"/") return
  let $normalized_steps:=
  <ns>{
  for $step at $i in $steps return
  (
    if ($i=1 and $step!="home") then
      <path_step idno="" id="" type="home">home</path_step>,
      
    if ($step="home") then
      <path_step>home</path_step>
    else if ($step!="") then
    (
      if (matches($step,"^\-?[0-9]+$")=true()) then (:the step is given as cc_idno:)
      (
        let $o:=cc:idno_to_object($step) return
        <path_step idno="{$step}" id="{$o/id}" type="{$o/@type}">{$o/name_data/name/text()}</path_step>
      )
      else if (matches($step,"^(cps|corpus)[\s_].+")) then
      (
        let $c:=$cc:meta/cc_corpora/item[nr=analyze-string($step,"^(cps|corpus)[_\s]([0-9]+)")/fn:match/fn:group] return
       <path_step idno="{$c/cc_idno}" nr="{$c/nr}" id="{$c/id}" type="{$c/@type}">{$c/name_data/name/text()}</path_step>
      )
      else if (matches($step,"^[^:]+\..+")) then
      (
         let $o:=cc:id_to_object($step) return
         <path_step idno="{$o/cc_idno}" id="{$o/cc_id}" type="{$o/@type}">{$o/name_data/name/text()}</path_step>
      )
      else if (matches($step,"^[0-9]+:.*")) then (:address inside of a text:)
      (
        let $text_idno:=analyze-string($step,"^([0-9]+):")/fn:match/fn:group/text(),
        $o:=cc:idno_to_object($text_idno) return
        <path_step idno="{$text_idno}" id="{$o/cc_id}" type="text_section" text_section="{$step}">{$o/name_data/name/text()}</path_step>
        
        
      )
      else
      (
        let $o:=cc:name_to_object($step) return
        <path_step idno="{$o/cc_idno}" id="{$o/id}" type="{$o/@type}">{$step}</path_step>
      )
    )
  )}</ns> return 
  for $step in $normalized_steps/path_step return
  <path_step idno="{$step/@idno}" id="{$step/@id}" type="{$step/@type}" full_path="{concat(
    string-join($step/preceding-sibling::path_step/@idno,'/'),'/',$step/@idno)}" text_section="{$step/@text_section}">{$step/text()}</path_step>
};





declare function cc:filter_virtual_collection($vc,$path_steps,$step_index,$dissolve_subcorpora)
{(:rekurzivní filtrování dat:)
  if ($step_index>count($path_steps)) then(:jsme na konci:)
   $vc
  else
  (
    let 
    $step:=$path_steps[$step_index],
    $vc2:=
      if ($step/@type="corpus") then
       cc:filter_OBJECTS_by_corpus($step/@idno,$vc/cc_works,$vc/cc_texts,$vc/cc_authors,$vc/cc_subcorpora,$dissolve_subcorpora)
      else if ($step/@type="author") then
        cc:filter_OBJECTS_by_author($step/@idno,$vc/cc_works,$vc/cc_texts,$vc/cc_corpora)
      else if ($step/@type="work") then
        cc:filter_OBJECTS_by_work($step/@idno,$vc/cc_authors,$vc/cc_texts,$vc/cc_corpora)
    return
      cc:filter_virtual_collection($vc2,$path_steps,$step_index+1,$dissolve_subcorpora)

  )
};


declare function cc:virtual_collection_inner_stat($VC, $group_by, $dissolve_subcorpora)
{
  let $group_by2:=
    if ($group_by="default" or $group_by="") then
    (
      if ($VC/@limited_by_type="corpus") then "author"
      else if ($VC/@limited_by_type="author") then "work"
      else if ($VC/@limited_by_type="work") then "text"
    )
    else
      $group_by return
  
  <contents>{
   
  if ($dissolve_subcorpora=false()) then
  (
    for $SC in $VC/cc_corpora/item where $SC/parent_corpus=$VC/@limited_by_idno  return
    (
      <corpus>
        <name>{$SC/name_data/name/text()}</name>
        <idno>{$SC/cc_idno/text()}</idno>
        <nr>{$SC/nr/text()}</nr>
      </corpus>
    )
  ),
  if ($group_by2="text") then
  (
    for $T in $VC/cc_texts/item let $c:=$T/corpus/text(),$C:=$VC/cc_corpora/item[cc_idno=$c] return
    (
      <text type="text">
        <name>{$T/name_data/name/text()}</name>
        <words_count>{$T/word_count/text()}</words_count>
        <loaded>{$T/loaded/text()}</loaded>
        <idno>{$T/cc_idno/text()}</idno>
        <corpus_name>{$C/name_data/name/text()}</corpus_name>
        <accessible>{cc:check_accessibility($cc:accessibility,$T/availability/text())}</accessible>
      </text>
    )
  )
  else if ($group_by2="work") then
  (
    let $TT:=cc:TEXTS_in_VC_with_derivations($VC) return
    for $T in $TT group by $w:=$T/work_idno return
    (
      let $accessible_texts:=for $Tx in $T where $Tx/is_actually_accessible="1" return $Tx
      return 
      <work type="work" text_count="{count($T)}">
        {
          let $corpora:=
          for $t in $T let $a:=$VC/cc_corpora/item[cc_idno=$t/corpus/text()] return
            <corpus>
              <name>{$a/name_data/name/text()}</name>
              {$a/nr}
              {<cc_idno>{$t/corpus/text()}</cc_idno>}
              </corpus>
           return   
          <corpora count="{count($corpora)}">
          {
            $corpora          
          }
          </corpora>
        }
        <name>{$T[1]/work_name/text()}</name>
        <idno>{$T[1]/work_idno/text()}</idno>
        <texts_count>{count($T)}</texts_count>
        <accessible_texts_count>{count($accessible_texts)}</accessible_texts_count>
        <words_count>{format-number(sum($T/word_count),"###")}</words_count>
       {(: $T :)}
      </work> 
    )
    
  )
  else if ($group_by2="author") then
  (
    (: let $TT:=cc:TEXTS_in_VC_with_derivations($VC), :)
    let $WW:=$VC/cc_works return
    for $A in $VC/cc_authors/item order by $A/name_data/name/text() return
    (
      <author type="author">
        <name>{$A/name_data/name/text()}</name>
        <idno>{$A/cc_idno/text()}</idno>
        <works_count>{count(tokenize(data($A/supplied_work_and_text_data/work_idnos)))}</works_count>
        <texts_count>{count(tokenize(data($A/supplied_work_and_text_data/text_idnos)))}</texts_count>
        <accessible_texts_count>{count(for $ac in tokenize(data($A/supplied_work_and_text_data/accessible_text_idnos)) where $ac="1" return $ac)}</accessible_texts_count>
        <words_count>{let $word_counts:=for $i in tokenize($A/supplied_work_and_text_data/word_counts/text())return number($i) return format-number(sum($word_counts),"###")}</words_count>
        <year>{$A=>cc:get_decisive_year()}</year>
        
      </author>
    )
  )
 
  }</contents>
};



declare function cc:TEXTS_in_VC_with_derivations($VC)
{
  
  for $T in $VC/cc_texts/item return
  (
    let
    
      
      $W:=cc:item($T/work_idno),(: db:text("corpus_corporum_meta",$T/work_idno/data())/parent::cc_idno/ancestor::item, :)
      $A:=cc:item($W/author_data/primary_author_idno)(: db:text("corpus_corporum_meta",$W/author_data/primary_author_idno/data())/parent::cc_idno/ancestor::item :)
      
     
     return 
       copy $T2:=$T modify
       (
         insert node <is_actually_accessible>{cc:check_accessibility($cc:accessibility,$T/availability/text())}</is_actually_accessible> into $T2,
         insert node <work_name>{$W/name_data/name/text()}</work_name> into $T2,
         insert node <author_name>{$A/name_data/name/text()}</author_name> into $T2,
         insert node <author_idno>{$A/cc_idno/text()}</author_idno> into $T2
         
       )
       return $T2
     
  )
};



declare function cc:virtual_collection_summary($VC)
{
  <summary>
    <texts>{count($VC/cc_texts/item)}</texts>
    <availible_texts>{count($VC/cc_availible_texts/item)}</availible_texts>
    <corpora>{count($VC/cc_corpora/item)}</corpora>
    <works>{count($VC/cc_works/item)}</works>
    <authors>{count($VC/cc_authors/item)}</authors>
    <words>{format-number(sum(data($VC/cc_texts/item/word_count)),"###")}</words>
  </summary>
  
};


declare function cc:filter_OBJECTS_by_corpus($cps_idno,$WORKS,$TEXTS,$AUTHORS,$CORPORA,$dissolve_subcorpora)
{
(:vyfiltrujeme všechny objekty, které vstupují do hry u nějakého corpusu: autory, díla, texty těchto děl:)
  let
  $C:=cc:SUBCORPORA_of_corpus($cps_idno),
  $cps:=
    if ($dissolve_subcorpora=true()) then (:chceme i objekty ze všech podkorpusů:)
      (data($C/cc_idno),$cps_idno)
    else(:chceme jen objekty přímo náležející tomuto korpusu:)
      ($cps_idno),
  
  $T:=  
    if ($TEXTS="" or empty($TEXTS) or $TEXTS="null") then (:pokud jsme ještě nic nevyfiltrovali, vezmeme data z databáze:)
      for $TXT in $cc:meta/cc_texts/item where $TXT/corpus and index-of($cps,$TXT/corpus)>=0 return $TXT
    else(:pokud už jsme si někde vyfiltrovali nějakou kolekci textů, budeme pracovat s ní:)
      for $TXT in $TEXTS/item where $TXT/corpus and index-of($cps,$TXT/corpus)>=0 return $TXT,
  $t:=data($T/work_idno),
  $T_idnos:=data($T/cc_idno),
  $T_accessible_idnos:=for $Tx in $T return cc:check_accessibility($cc:accessibility,$Tx/availability/text()),
  $T_words:=data($T/word_count),
        
  $W:=
    if ($WORKS="" or empty($WORKS) or $WORKS="null") then
      for $W2 in $cc:meta/cc_works/item let $index-of:=index-of($t,data($W2/cc_idno)) where count($index-of)>0 return
      copy $W3:=$W2 modify
        insert node 
            <supplied_text_data>
                <text_idnos>{for $t2 in $index-of return $T_idnos[$t2]}</text_idnos>
                <accessible_text_idnos>{for $t2 in $index-of return $T_accessible_idnos[$t2]}</accessible_text_idnos>
                <word_counts>{for $t2 in $index-of return $T_words[$t2]}</word_counts>
            </supplied_text_data> into $W3
        return $W3
    else
      $WORKS/item[index-of($t,data(cc_idno))>=0],
  $w:=data($W/author_data/primary_author_idno),
  $W_idnos:=data($W/cc_idno),
  $w_std:=$W/supplied_text_data,
  
  $A:=
    if ($AUTHORS="" or empty($AUTHORS) or $AUTHORS="null") then 
      for $A2 in $cc:meta/cc_authors/item let $index-of:=index-of($w,data($A2/cc_idno)) where count($index-of)>0 return
      copy $A3:=$A2 modify
        insert node
            <supplied_work_and_text_data>
                <test/>
                <work_idnos>{for $w2 in $index-of return $W_idnos[$w2]}</work_idnos>
                <text_idnos>{for $w2 in $index-of return data($w_std[$w2]/text_idnos)}</text_idnos>
                <accessible_text_idnos>{for $w2 in $index-of return data($w_std[$w2]/accessible_text_idnos)}</accessible_text_idnos>
                <word_counts>{for $w2 in $index-of return data($w_std[$w2]/word_counts)}</word_counts>
            </supplied_work_and_text_data> into $A3
        return $A3
    else
      $AUTHORS/item[index-of($w,data(cc_idno))>=0]
  return
  
  <virtual_collection limited_by_type="corpus" limited_by_idno="{$cps_idno}" subcorpora_dissolved="{$dissolve_subcorpora}"
  works="{count($W)}" texts="{count($T)}" authors="{count($A)}" corpora="{count($C)}">
    <cc_works>{$W}</cc_works>
    <cc_texts>{$T}</cc_texts>
    <cc_corpora>{$C}</cc_corpora>
    <cc_authors>{$A}</cc_authors>
  </virtual_collection>
};



declare function cc:filter_OBJECTS_by_author($author_idno,$WORKS,$TEXTS,$CORPORA)
{(:vyfiltrujeme všechny objekty, které vstupují do hry u nějakého autora: díla, texty těchto děl, 
korpusy, v nichž se texty nachází:)
 (: error(QName("http://mlat.uzh.ch/2.0","error"),string(empty($WORKS)) :)
  let $W:=
    if ($WORKS="" or empty($WORKS) or $WORKS="null") then 
      $cc:meta/cc_works/item[author_data/*=$author_idno]
    else
      $WORKS/item[author_data/*=$author_idno],
  $w:=data($W/cc_idno),
  
  $T:=
    if ($TEXTS="" or empty($TEXTS) or $TEXTS="null") then
      for $TXT in $cc:meta/cc_texts/item
        let $work_idno:=if ($TXT/work_idno) then $TXT/work_idno else 0 
        where index-of($w,$work_idno)>=0 return $TXT
    else
      for $TXT in $TEXTS/item
        let $work_idno:=if ($TXT/work_idno) then $TXT/work_idno else 0 
        where index-of($w,$work_idno)>=0 return $TXT,
  
  $c:=data($T/corpus),
  $C:= if ($CORPORA="" or empty($CORPORA) or $CORPORA="null") then 
      for $CPS in $cc:meta/cc_corpora/item[index-of($c,data(cc_idno))>=0] return $CPS
    else
      for $CPS in $CORPORA/item[index-of($c,data(cc_idno))>=0] return $CPS
  return
  
  <virtual_collection limited_by_type="author" limited_by_idno="{$author_idno}" works="{count($W)}" texts="{count($T)}" corpora="{count($C)}">
    <cc_works>{$W}</cc_works>
    <cc_texts>{$T}</cc_texts>
    <cc_corpora>{$C}</cc_corpora>
  </virtual_collection>
  
};



declare function cc:filter_OBJECTS_by_work($work_idno,$AUTHORS,$TEXTS,$CORPORA)
{(:vyfiltrujeme všechny objekty, které vstupují do hry u nějakého díla: autora, texty těchto děl, 
korpusy, v nichž se texty nachází:)
  let
  $W:=$cc:meta/cc_works/item[cc_idno=$work_idno],
  $A:=
    if ($AUTHORS="" or empty($AUTHORS) or $AUTHORS="null") then 
      $cc:meta/cc_authors/item[cc_idno=$W/author_data/*]
    else
      $AUTHORS/item[cc_idno=$W/author_data/*],
  
  $T:=  
    if ($TEXTS="" or empty($TEXTS) or $TEXTS="null") then 
      for $TXT in $cc:meta/cc_texts/item[work_idno=$work_idno] return $TXT
    else
      for $TXT in $TEXTS/item[work_idno=$work_idno] return $TXT,
  
  $c:=data($T/corpus),
  $C:= if ($CORPORA="" or empty($CORPORA) or $CORPORA="null") then 
      for $CPS in $cc:meta/cc_corpora/item[index-of($c,data(cc_idno))>=0] return $CPS
    else
      for $CPS in $CORPORA/item[index-of($c,data(cc_idno))>=0] return $CPS
  return
  
  <virtual_collection limited_by_type="work" limited_by_idno="{$work_idno}" authors="{count($A)}" texts="{count($T)}" corpora="{count($C)}">
    <cc_authors>{$A}</cc_authors>
    <cc_texts>{$T}</cc_texts>
    <cc_corpora>{$C}</cc_corpora>
  </virtual_collection>
  
};

declare function cc:SUBCORPORA_of_corpus($corpus_idno)
{
  let $SUBCORPORA:=
  for $SC in $cc:meta/cc_corpora/item where $SC/parent_corpus=$corpus_idno return $SC,
  $SUBSUBCORPORA:=
  for $SC in $SUBCORPORA return
      cc:SUBCORPORA_of_corpus($SC/cc_idno/text())
  return
  ($SUBCORPORA,$SUBSUBCORPORA)
  
}; 

declare function cc:author_to_texts($opt)
{(:2024:)
  let 
    $cc_idno:=$opt?cc_idno,
    $works:=db:text("corpus_corporum_metadata",$cc_idno)/parent::*[not(self::cc_idno)]/ancestor::item
  return
    db:text("corpus_corporum_metadata",$works/cc_idno/data())/parent::work_idno/ancestor::item
    
    
};
declare function cc:work_to_texts($opt)
{(:2024:)
  let 
    $cc_idno:=$opt?cc_idno
  return
  db:text("corpus_corporum_metadata",$cc_idno)/parent::work_idno/ancestor::item
};
declare function cc:corpus_to_texts($opt)
{(:2024:)
  let 
    $cc_idno:=$opt?cc_idno
  return
  db:text("corpus_corporum_metadata",$cc_idno)/parent::corpus/ancestor::item
};

declare function cc:get_corpus($opt)
{(:2024:)
  
  let 
    $cc_idno:=if ($opt instance of xs:string) then $opt else $opt?cc_idno,
    $C:=$cc:meta/cc_corpora/item[cc_idno=$cc_idno],
    $only_loaded:=if ($opt instance of map(*)) then $opt?loaded_only else true(),  
    $summary_only:=if ($opt instance of map(*)) then if ($opt?summary_only=true()) then true() else false() else false(),
    $dissolve_subcorpora:=if ($opt instance of map(*)) then if ($opt?dissolve_subcorpora=true()) then true() else false() else false(),
    $parent_corpus:=if (not($C/parent_corpus) or $C/parent_corpus="") then true() else false(),
    $group_by:=if ($opt instance of map(*)) then (if ($opt?group_by) then $opt?group_by else "author") else "author",
    $subcorpora_1:=db:text("corpus_corporum_metadata",$cc_idno)/parent::parent_corpus/parent::item,
    $subcorpora:=
      for $S in $subcorpora_1 return cc:get_corpus(map{"cc_idno":xs:string($S/cc_idno/text()),"summary_only":false()}),      
      
    $texts:=
      if ($only_loaded=true()) then
        db:text("corpus_corporum_metadata",$cc_idno)/parent::corpus/parent::item[is_loaded="true"]
      else
        db:text("corpus_corporum_metadata",$cc_idno)/parent::corpus/parent::item,
    
    $texts_available:=$texts[not(./availability) or ./availability/text()!="1"], (: for $t in $texts where $t/availability/text()!="1" or not($t/availability) return $t, :)
    $W_idnos:=distinct-values($texts/work_idno/data()),
    $works:=db:attribute("corpus_corporum_metadata",$W_idnos)/ancestor::item,
    $w_dates:=$works/time_data/event/date1/year/text(),
    $A_idnos:=distinct-values($works/author_data/primary_author_idno/data()),
    $authors:=db:attribute("corpus_corporum_metadata",$A_idnos)/ancestor::item,
    $a_dates:=$authors/time_data/event[@what!="born"]/date1/year/text(),
    $first_w_date:=if (count($w_dates)>0) then min($w_dates) else min($a_dates),
    $last_w_date:=if (count($w_dates)>0) then max($w_dates) else max($a_dates)
    
   
  return
    if ($summary_only=true()) then
    (
      if ($dissolve_subcorpora=true() and $parent_corpus=true()) then
      (
        let  
          $sc_authors:=
            distinct-values(map:find($subcorpora,"authors_idnos")),
          $sc_works:=
            distinct-values(map:find($subcorpora,"works_idnos")),
          $sc_texts:=
            distinct-values(map:find($subcorpora,"texts_idnos")),
          $sc_texts_available:=
            distinct-values(map:find($subcorpora,"texts_available_idnos"))
        return
        map {
          "name":$C/name_data/name/text(),
          "cc_idno":$cc_idno,
          "subcorpora":count($subcorpora),
          "texts":count(distinct-values(($texts,$sc_texts))),
          "texts_available":count(distinct-values(($texts_available,$sc_texts_available))),
          "works":count(distinct-values(($works,$sc_works))),
          "authors":count(distinct-values(($authors,$sc_authors))),
          "words":xs:integer(sum(($texts/word_count/text(),map:find($subcorpora,"words")))),
          "first_work":min((xs:integer($first_w_date),map:find($subcorpora,"first_work"))),
          "last_work":max((xs:integer($last_w_date),map:find($subcorpora,"last_work")))
          }
      )
      else
        map {
          "name":$C/name_data/name/text(),
          "cc_idno":$cc_idno,
          "subcorpora":$subcorpora,
          "texts":count($texts),
          "texts_available":count($texts_available),
          "works":count($works),
          "authors":count($authors),
          "words":xs:integer(sum($texts/word_count/text())),
          "first_work":xs:integer($first_w_date),
          "last_work":xs:integer($last_w_date)}
    )
    else
    (
        map {
        "name":$C/name_data/name/text(),
        "item":$C,
        "cc_idno":$cc_idno,
        "subcorpora":$subcorpora,
        "texts":count($texts),
        "texts_idnos":$texts/cc_idno/data(),
        "texts_available":count($texts_available),
        "texts_available_idnos":$texts_available/cc_idno/data(),
        "works":count($works),
        "works_idnos":$works/cc_idno/data(),
        "authors":count($authors),
        "authors_idnos":$authors/cc_idno/data(),
        "words":xs:integer(sum($texts/word_count/text())),
        "first_work":xs:integer($first_w_date),
        "last_work":xs:integer($last_w_date)
        }
    )
  (: $texts/availability :)

};


    
    
declare function cc:home()
{(:vypíšeme jenom korpusy, které pod sebou něo mají tj. texty nebo subkorpusy:)
  let $all_corpora:= 
 
  for $T in $cc:meta/cc_texts/item let $corpus:=data($T/corpus) where $T/is_loaded="true" group by $corpus
  return
    let $C:=$cc:meta/cc_corpora/item[cc_idno=$corpus],
    $W:=cc:works_of_texts(distinct-values(data($T/work_idno))),
    $A:=cc:authors_of_works(distinct-values(data($W/author_data/primary_author_idno))),
    $SC:=$cc:meta/cc_corpora/item[parent_corpus=$corpus],
    $accesibleT:=for $aT in $T where cc:check_accessibility($cc:accessibility,$aT/availability/text())=1 return $aT
    return
  
    (
        <corpus idno="{$corpus}" type="corpus" parent_corpus="{$C/parent_corpus}">
        <idno>{$corpus}</idno>
        <words_count>{format-number(sum($T/word_count/text()),"###")}</words_count>
        <texts>{data(distinct-values($T/cc_idno))}</texts>
        <accessible_texts>{data(distinct-values($accesibleT/cc_idno))}</accessible_texts>
        <subcorpora>{data(distinct-values($SC/cc_idno))}</subcorpora>
        <works>{data($W/cc_idno)}</works>
        <source>{data($C/source)}</source>
        <nr>{$C/nr/text()}</nr>
        <authors>{data($A/cc_idno)}</authors>
        <source_web_page>{data($C/source_web_page)}</source_web_page>
        <date_range>{
          let $years:=
            for $dy in $A let $year:=$dy=>cc:get_decisive_year() where $year!="0" 
            return $year 
          return
            (
              <first>{min($years)}</first>,
              <last>{max($years)}</last>
            )
        }</date_range>
      </corpus>
      
    )
  
    return
 
  let $all_corpora2:=for $C in $cc:meta/cc_corpora/item where not(index-of($all_corpora/idno,$C/cc_idno/text())) return
  let $SC:=$cc:meta/cc_corpora/item[parent_corpus=$C/cc_idno] return
  (
    <corpus idno="{$C/cc_idno}" type="corpus" parent_corpus="{$C/parent_corpus}">
        <words_count>0</words_count>
        <texts></texts>
        <accessible_texts></accessible_texts>
        <subcorpora>{data(distinct-values($SC/cc_idno))}</subcorpora>
        <works></works>
        <nr>{$C/nr/text()}</nr>
        <authors></authors>
        <source>{data($C/source)}</source>
        <source_web_page>{data($C/source_web_page)}</source_web_page>
      </corpus>
  )
  return 
 
  
  (:přidáme hodnoty z případných podkorpusů:)
  let $all_corpora3:=for $C in ($all_corpora,$all_corpora2)  return
  ( 
    let 
    $sc:=$all_corpora[@parent_corpus=$C/@idno]
    return
    copy $C2:=$C modify
    (
      replace value of node $C2/texts with (data($sc/texts),data($C2/texts)),
      replace value of node $C2/accessible_texts with (data($sc/accessible_texts),data($C2/accessible_texts)),
      replace value of node $C2/works with (data($sc/works),data($C2/works)),
      replace value of node $C2/subcorpora with (data($sc/subcorpora),data($C2/subcorpora)),
      replace value of node $C2/authors with (data($sc/authors),data($C2/authors)),
      replace value of node $C2/words_count with format-number(sum(data($sc/words_count))+data($C2/words_count),"###")
    )return
    $C2
  )return
  
  
  <navigation a="{$cc:accessibility}">
    <path_steps>
      <path_step type="home">home</path_step>
    </path_steps>
    <contents>{
      for $C in $all_corpora3 where $C/@parent_corpus="" and $C/texts!="" and $C/@idno!="" order by number($C/nr/text()) return
      let $CPS:=$cc:meta/cc_corpora/item[cc_idno=$C/@idno]
      return
      <corpus type="corpus">
        <idno>{data($C/@idno)}</idno>
        <texts_count>{count(distinct-values(tokenize($C/texts)))}</texts_count>
        <accessible_texts_count>{count(distinct-values(tokenize($C/accessible_texts)))}</accessible_texts_count>
        <works_count>{count(distinct-values(tokenize($C/works)))}</works_count>
        <authors_count>{count(distinct-values(tokenize($C/authors)))}</authors_count>
        <subcorpora_count>{count(distinct-values(tokenize($C/subcorpora)))}</subcorpora_count>
        <words_count>{$C/words_count/text()}</words_count>
        <name>{$CPS/name_data/name/text()}</name>
        <nr>{$CPS/nr/text()}</nr>
        <source>{data($C/source)}</source>
        <source_web_page>{data($C/source_web_page)}</source_web_page>
        <date_range>
          <first_author_year>{$C/date_range/first/text()}</first_author_year>
          <last_author_year>{$C/date_range/last/text()}</last_author_year>
        </date_range>
      </corpus>
    }</contents>
  </navigation>
};


declare function cc:authors_of_works($seqWprimary_authors)
{
  for $A in $cc:meta/cc_authors/item where index-of($seqWprimary_authors,data($A/cc_idno))>=0 return 
  $A
};
declare function cc:works_of_texts($seqTwork_idnos)
{
  for $W in $cc:meta/cc_works/item where index-of($seqTwork_idnos,data($W/cc_idno))>=0 return 
  $W
};

declare function cc:get_search_results($paths)
{
    cc:get_search_results($paths,false)
};
declare function cc:get_search_results($paths,$results_for_download)
{
    cc:get_search_results($paths,$results_for_download,())
};


declare function cc:get_search_results($paths,$results_for_download,$replaced_phrases)
(:web_accessible:)
{
    (:replaced phrases:
    because in the phrase search ("ego dixi quod"), groups of expressions are not working (!"ego dixi (quod|qvod)"), the phrases are replaced 
    with NEAR/1
    
    :)
    let 
    $replaced_phrases2:=
    for $ph in $replaced_phrases return
        replace($ph,"\W+","\\W+"),
    
    $search_results:=
    for $p in $paths/path let $parent_pid:=substring-before($p/pid/text(),","),$n:=substring-after($p/pid/text(),",")  count $i where $parent_pid!="" return
    (
        (: prof:dump($p/pid/text()), :)
        let $ppids:=db:attribute("corpus_corporum_data",substring-before($p/pid/text(),",")) return
        
            for $ppid in $ppids 
                let $s:=$ppid/parent::*,
                $ancestors:=$s/ancestor::tei:div,
                $heads:=
                (
                    for $a in $ancestors return
                    <head pid="{$a/@cc:pid}">
                    {
                        $a/tei:head/text()
                    }
                    </head>
                )
                
            (: where $s/@n=$n :)
            let $sr:=
            <search_result n="{$i}">
            
            {
                if ($results_for_download=true()) then
                    <pid text_idno="{substring-before($ppid,":")}" url="https://mlat.uzh.ch/browser?text={substring-before($ppid,":")}%26focus={$ppid/data()}">{$ppid/data() || "," || $n}</pid>
                else
                    <pid text_idno="{substring-before($ppid,":")}">{$ppid/data() || "," || $n}</pid>
            }
            {
                if ($results_for_download=false()) then
                (
                    <author><item><cc_idno>{$p/author_idno}</cc_idno><name_data><name>{$p/author/text()}</name></name_data></item></author>,
                    <work><item><cc_idno>{$p/work_idno}</cc_idno><name_data><name>{$p/work/text()}</name></name_data></item></work>
                )
                else
                (
                    <author cc_idno="{$p/author_idno/text()}" url="https://mlat.uzh.ch/browser?path={$p/author_idno/text()}">{$p/author/text()}</author>,
                    <work cc_idno="{$p/work_idno/text()}" url="https://mlat.uzh.ch/browser?path={$p/work_idno/text()}">{$p/work/text()}</work>
                )
            }
            {$p/decisive_year}
            <result>
            {
                if ($results_for_download=false()) then
                (
                
                    <meta><heads>{$heads}</heads></meta>
                )
                else
                (
                    let $position_in_work:=for $h in $heads//text() return normalize-space($h) return
                    <position>{$p/work/text() || " - " || string-join($position_in_work," - ")}</position>
                )
            }
            {
                if ($results_for_download=false()) then
                (
                    <text><sentence>
                    {
                        let 
                          
                          $starting_element:= $s, 
                          $text:=cc:get_sentence_NEW(map{"text_section":$s,"sentence_nr":$n})[1]
                        return
                        if (every $ph in $replaced_phrases2 satisfies matches($text/data(),$ph,"i")) then
                            $text
                        else
                            ""

                    }</sentence></text>
                )
                else
                (
                    <text>
                    {
                        let $starting_element:= $s, 
                        $text:=cc:get_sentence_NEW(map{"text_section":$s,"sentence_nr":$n})[1]/data()
                        
                        return 
                        if (every $ph in $replaced_phrases2 satisfies matches($text,$ph,"i")) then
                            $text
                        else
                            ""
                    }
                    </text>
            )
            }
            </result>
            </search_result>
            
            return 
            if ($sr/result/text/data()!="") then
                $sr
            
        
    )
    return
    <search_results after_phrases_filtered="{count($search_results)}">
    {
        $search_results
    }
    </search_results>
};





(:v objektech se mohou objevovat elementy obsahující cestu k nějakému externímu zdroji (html stránce např.)
Tato funkce objekt vezme a tyto odkazy nahradí obsahem příslušných zdrojů.:)

declare function cc:append_resources_to_object($obj)
{
  copy $obj2:=$obj modify
  (
    for $res in $obj2//cover_page_url return
      (
        let $path:=$res/text() return
        (:najednou to nejde udělat, protože:
        1) replace value of node by vrátilo text, ne uzly (protože nyní je v $res text)
        2) nejprve replace vlaue="" a pak inser node... vrátí "", protože update quee atd...
        :)
        
        copy $res2:=$res modify
        (
          replace value of node $res2 with ""
        )
        return 
        copy $res3:=$res2 modify
        (
          insert node cc:fetch_resource($path,$res/@type) as first into $res3
        )
        return
        replace node $res with $res3
      )
  )
  return $obj2
};

declare function cc:fetch_resource($path,$type)
{
  if ($path!="") then
  (
    let $path2:=
    if (file:exists($path)=true()) then
      $path
    else if (file:exists( concat($cc:home_folder,"/",$path))=true()) then
       concat($cc:home_folder,"/",$path)
    else if (file:exists( concat($cc:home_folder,"/data/corpora_cover_pages/",$path))) then
       concat($cc:home_folder,"/data/corpora_cover_pages/",$path)
     
    return
    
    if ($path2!="") then 
    (
      if ($type="xml" or string($type)="" and file:exists($path2)) then
        doc($path2)
      else if (file:exists($path2)) then
      (
        
      )
    )
  )
};
declare function cc:get_corpus_tree($cps_idno)
{
  let $s:=cc:get_corpus_tree_idnos($cps_idno,()) return
  for $i in $s return
    $cc:meta/cc_corpora/item[cc_idno=$i]
  
};
declare function cc:get_corpus_tree_idnos($cps,$return_value)
{(:vrátí sekvenci obashující idno zadaného korpusu a jeho případných nadřazených korpusů, jsou-li:)
  let $C:=$cc:meta/cc_corpora/item[cc_idno/text()=$cps] return
  
  if ($C/parent_corpus/text()="" or not($C/parent_corpus)) then
  (
    let $rv:=insert-before($return_value,1,$C/cc_idno/text())
    return $rv
  )
  else
  (
    let $rv:=insert-before($return_value,1,$C/cc_idno/text()),
    $ncps:=$cc:meta/cc_corpora/item[cc_idno/text()=$C/parent_corpus/text()]/cc_idno/text() return
    cc:get_corpus_tree_idnos($ncps,$rv)
    
  )
};

declare function cc:author_of_work($work_idno)
{
  $cc:meta/cc_authors/item[cc_idno=$work_idno]/name_data/name/text()
};

declare function cc:get_nasty_workaround($path,$group_by)
{
  cc:get_nasty_workaround(<opt><path>{$path}</path><group_by>{$group_by}</group_by></opt>)
};
declare function cc:get_nasty_workaround($opt)
{
  let
   $fname:=concat(replace($opt/path/text(),"/",":"),if ($opt/group_by/text()!="") then concat("-gb-",$opt/group_by/text()) else "",".xml")
  return 
  if (file:exists(concat($cc:home_folder,"/nasty_workarounds/",$fname))) then
  (
    let $nw:=doc(concat($cc:home_folder,"/nasty_workarounds/",$fname))
    return
    $nw/nasty_workaround/navigation
  )
  else
  (
    <nothing/>
  )
};

declare function cc:create_nasty_workaround($opt)
{
  let
   $parameters:="[accessibility:" || $cc:accessibility || (if ($opt/group_by/text()!="") then concat("group_by",$opt/group_by/text()) else "") || "]",
   $fname:=concat(replace($opt/path/text(),"/",":"),$parameters,".xml"),
   $nw:=<nasty_workaround time="{current-dateTime()}" accessibility="{$cc:accessibility}">{cc:navigate($opt)}</nasty_workaround> return
   (
    if (file:exists(concat($cc:home_folder,"/nasty_workarounds/",$fname))) then
        file:delete(concat($cc:home_folder,"/nasty_workarounds/",$fname)),
    file:write(concat($cc:home_folder,"/nasty_workarounds/",$fname),$nw)
   )
};
declare function cc:create_nasty_workaround($path,$group_by)
{
  cc:create_nasty_workaround(<opt><path>{$path}</path><group_by>{$group_by}</group_by></opt>)
};
declare function cc:export_all_works()
{(:web_accessible:)
    file:write("/var/www/html/download/all_works.xml",
    <export>
    {
        let $C:=$cc:root/cc_corpora/item 
        return
        (
            for $Wgrp at $i in $cc:root/cc_works/item
            let 
                $a:=$Wgrp/author_data/primary_author_idno,
                $A:=cc:item($a)
            group by $a
            
            return
            for $W in $Wgrp let $Tgrp:=db:text("corpus_corporum_metadata",$W/cc_idno/data())/parent::work_idno/parent::item return 
            (
                <work>
                    {
                        $W/cc_idno,
                        $W/name_data/name,
                        for $e in $W/time_data/event let $d1:=$e/date1 return
                            if (string-join($d1/data())!="") then<date what="{$e/@what}">{normalize-space(string-join($d1/data(),"."))}</date> ,
                        $W/external
                    }
                    <author>
                        {
                            $A/cc_idno,
                            $A/name_data/name,
                            for $e in $A/time_data/event let $d1:=$e/date1 return
                                if (string-join($d1/data())!="") then <date what="{$e/@what}">{normalize-space(string-join($d1/data(),"."))}</date>,
                            $A/external
                        }
                    </author>
                    <texts>
                    {
                        for $T in $Tgrp return
                            <text>
                            {
                                
                                $T/cc_idno,
                                $T/name_data/name,
                                <incipit>
                                {
                                    try
                                    {
                                        replace(replace(string-join(cc:get_incipit($T/cc_idno/text(),"")/text()),"\n"," "),"(\t|\s{2,})"," ")
                                    }
                                    catch * {""}
                                }
                                </incipit>,
                                <corpus>
                                    <cc_idno>{$T/corpus/text()}</cc_idno>
                                    {$C[cc_idno=$T/corpus]/name_data/name}
                                </corpus>,
                                $T/publication_data/editor[data(.)!=""],
                                $T/publication_data/publisher[data(.)!=""],
                                $T/publication_data/publication_place[data(.)!=""],
                                $T/publication_data/date[data(.)!=""]
                            }
                            </text>
                    }
                    </texts>
                </work>
                )
                
            )
    }
    </export>)
};
