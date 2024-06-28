module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "general_functions.xq";
declare variable $cc:mdb_search_minlength:=2;

(:
this module provides functions to search for authors or works by their names.
Collations:
1) http://www.w3.org/2013/collation/UCA?strength=primary - most permissive (A=a=á=Ä...), but slow
(for documentation see: https://www.w3.org/TR/xpath-functions-31/#uca-collations)

2) http://www.w3.org/2005/xpath-functions/collation/html-ascii-case-insensitive - permissive (A=a, but a!=á and Á!=á (it can't work with diacritics)) - as slow as the first one

3) [no collation] - way faster, but A!=a, need to use lower-case (but still by far the faster method, sufficient for basic search)


Return value:
<xq:result_set>
  <xq_result>
    <name>Name of found item</name>
    <cc_idno>cc_idno of found item</cc_idno>
    ...
    ...
  </xq_result>
</xq:result_set>
:)
declare function cc:search($query)
{
  let $subject:=
  if (matches($query/query_text/text(),"^PL[ .;\-0-9]")) then
    "PL"
  else
    $query/subject/text()
  return
  let $results:=
  if ($query/mode/text()="0") then (:simple search:)
  (
    if ($query/subject/text()!="PL" and matches($query/query_text/text(),"^PL[ .;\-0-9]")=false()) then
    (
      let $collection:=
        if ($query/subject/text()!="all") then
          $cc:meta/*[local-name(.)=$query/subject/text()]
        else
          $cc:meta/*
      return
      cc:do_simple_search($collection,$query/query_text/text(),"","")
     )
     else (:hledáme v PL:)
     (
       cc:pl_search($query/query_text/text())
     )
  )
  return
  <xq_results subject="{$subject}" total="{count($results//xq_result)}" result_sets="{count($results)}" query="{$query/query_text/text()}">
  {
    $results
  }
  </xq_results>
};
declare function cc:author_name($i)
{
};
declare function cc:do_simple_search($collections,$query,$collation,$options)
{

 let $q:=lower-case($query) return
  if (string-length($q)>=$cc:mdb_search_minlength) then
  (
        let $q:=lower-case($query) return
        for $c in $collections return
          <collection name="{local-name($c)}" collection_type="{$c/@collection_type}">
          {
          for $a in $c/item return
          (
            if
            (
                
                (some $n in $a/name_data/* satisfies 
                  starts-with(normalize-space(lower-case($n)),$q)=true() 
                  or contains(normalize-space(lower-case($n)),concat(" ",$q))=true()
                  or contains(normalize-space(lower-case($n)),concat("(",$q))=true()
               )  
               or 
                (some $e in $a/external satisfies ($e/@value=$query))   
               
             )
             then
            <xq_result type="{$a/@type}" collection="{local-name($a/parent::*)}" permanent="{$a/parent::*/@collection_type}"><name>{$a/name_data/name/text()}</name><cc_idno>{$a/cc_idno/text()}</cc_idno><author_name>{if ($a/@type="work") then $a=>cc:author_name()}</author_name>
            <hits>{$a/name_data/*[starts-with(normalize-space(lower-case(data(.))),$q)=true()]}
            {$a/name_data/*[contains(normalize-space(lower-case(data(.))),concat(" ",$q))=true()]}
            {$a/external[@value=$query]}
            </hits></xq_result>
          )
        }</collection>

          )
  else
    <xq_result_set error="query too short (at least {$cc:mdb_search_minlength} characters needed)" function="{concat('cc:search_','(',$query,')')}"/>
};




declare function cc:pl_search($query)
{ (: funkce najde co nejpřesněji místo zadaná jako odkaz do patrologie PL xxx yyyyz :)
  let $PL_idno:="38", (:cc_idno patrologie je momentálně 38 (a asi už se nezmění):)
  $pl:=analyze-string($query,"PL[ .,:\-]?[ ]?([0-9]{1,3})([.,:\-]\s?|\s)?([0-9]+)?([A-Za-z]?)"),
  $v:=number($pl/fn:match/fn:group[@nr=1]),
  $c:=number($pl/fn:match/fn:group[@nr=3]),
  $s:=$pl/fn:match/fn:group[@nr=4]
  return
  <collection name="cc_texts" type="permanent">
  {
  (: $pl,$query :)
  (
    if (not($c)) then
    ( (:pokud je zadáno jen číslo svazku, vrátíme všechny texty, které do něj patří:) 
      for $T in $cc:meta/cc_texts/item[corpus=$PL_idno] let $first_c:=number(analyze-string($T/publication_data/pages/first/text(),"[0-9]+")/fn:match/text()) order by $first_c where
      $T/publication_data/volume/text()=$v return
      
        <xq_result type="PL" collection="cc_texts" permanent="true"><name>{$T/name_data/name/text()}</name><cc_idno>{$T/cc_idno/text()}</cc_idno><author_name></author_name><hits></hits>{cc:PL_info($T)}
       </xq_result>
    )
    else if (not($s)) then
    ( (:pokud je ale zadáno místo přesné, vrátíme co nejpřesnější pozici:)
      for $T in $cc:meta/cc_texts/item[corpus=$PL_idno] let $first_c:=number(analyze-string($T/publication_data/pages/first/text(),"[0-9]+")/fn:match/text()), $last_c:=number(analyze-string($T/publication_data/pages/last/text(),"[0-9]+")/fn:match/text()), $pbs:=$cc:meta/data/tdata[cc_idno=$T/cc_idno]/cc:text/tei:text//tei:pb where       $T/publication_data/volume/text()=$v and ($c>=$first_c and $c<=$last_c)  return
      let
        $nearest_div:=
        for $pb in $pbs 
          let 
            $n:=number(analyze-string(data($pb/@n),"[0-9]+")/fn:match/text())
        where $n=$c count $cc 
        return <precise_pid PL="{$pb/@n}"><nearest_pid>{$pb/ancestor::*[@cc:pid][1]/@cc:pid/data()}</nearest_pid><nearest_hierarchical_element>{$pb/ancestor::*[@cc:pid and (local-name(.)="body" or local-name(.)="div")][1]/@cc:pid/data()}</nearest_hierarchical_element>{cc:get_ancestors_heads($pb)}</precise_pid>
        return
        <xq_result type="PL" collection="cc_texts" permanent="true"><name>{$T/name_data/name/text()}</name><cc_idno>{$T/cc_idno/text()}</cc_idno><author_name></author_name><hits></hits>{cc:PL_info($T)}{$nearest_div}</xq_result>
    )
    else
    (
      (: místo je zadáno nepřesněji :)
      for $T in $cc:meta/cc_texts/item[corpus=$PL_idno] let $first_c:=number(analyze-string($T/publication_data/pages/first/text(),"[0-9]+")/fn:match/text()), $last_c:=number(analyze-string($T/publication_data/pages/last/text(),"[0-9]+")/fn:match/text()), $pbs:=$cc:meta/data/tdata[cc_idno=$T/cc_idno]/cc:text/tei:text//tei:pb where       $T/publication_data/volume/text()=$v and ($c>=$first_c and $c<=$last_c)  return
      let
        $nearest_div:=
        for $pb in $pbs 
          let
            $as:=analyze-string(data($pb/@n),"([0-9]+)([A-Za-z])"),
            $n:=$as/fn:match/fn:group[@nr=1]/text(), 
            $l:=$as/fn:match/fn:group[@nr=2]/text() 
        where $n=$c and $l=$s count $cc where $cc=1 
        return <precise_pid PL="{$pb/@n}"><nearest_pid>{$pb/ancestor::*[@cc:pid][1]/@cc:pid/data()}</nearest_pid><nearest_hierarchical_element>{$pb/ancestor::*[@cc:pid and (local-name(.)="body" or local-name(.)="div")][1]/@cc:pid/data()}</nearest_hierarchical_element>{cc:get_ancestors_heads($pb)}</precise_pid>
        return
        <xq_result type="PL" collection="cc_texts" permanent="true"><name>{$T/name_data/name/text()}</name><cc_idno>{$T/cc_idno/text()}</cc_idno><author_name></author_name><hits></hits>{cc:PL_info($T)}{$nearest_div}</xq_result>
    )
  )
  }
  </collection> 
};

declare function cc:get_ancestors_heads($el)
{
  <ancestors_heads>{
  let $divs:=$el/ancestor::*[local-name(.)="div" or local-name(.)="lg" or local-name(.)="body"] return
  for $div in $divs return
    <head pid="{$div/@cc:pid}">{$div/tei:head[1]/text()}</head>
  }</ancestors_heads>
};
declare function cc:PL_info($T)
{
  <PL><volume>{$T/publication_data/volume/text()}</volume><first_column>{$T/publication_data/pages/first/text()}</first_column><last_column>{$T/publication_data/pages/last/text()}</last_column></PL>
};





