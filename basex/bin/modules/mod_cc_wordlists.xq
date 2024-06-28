module namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";

declare namespace ns1="http://viaf.org/viaf/terms#";
declare namespace rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace wdt="http://www.wikidata.org/prop/direct/"; 
import module "http://mlat.uzh.ch/2.0" at "general_functions.xq","mod_cc_data.xq";


declare function cc:translate_morph_code($mc)
{
  let 
    $translate_position:=function($v,$p)
    {
      if ($v!="-" and $v!="x") then
        if ($p=1) then
        (
          switch ($v)
            case ("n") return "noun"
            case ("a") return "adj."
            case ("p") return "pron."
            case ("m") return "num."
            case ("v") return "verb."
            default return ""
        )
        else if ($p=2) then
          $v
        else if ($p=3) then
          (
            if ($v="s") then "sg." else if ($v="p") then "pl."
          )
        else if ($p=4) then
          switch ($v)
            case ("p") return "praes."
            case ("i") return "impf."
            case ("f") return "fut."
            case ("r") return "pf."
            case ("l") return "plqpf."
            case ("t") return "fut II"
            default return ("--unknown tense--")
        else if ($p=5) then
          switch ($v)
            case ("i") return "ind."
            case ("c") return "conj."
            case ("m") return "imp."
            case ("g") return "ger."
            case ("p") return "part."
            case ("n") return "inf."
            case ("s") return "sup."
            default return ("--unknown mood--")
        else if ($p=6) then 
           (
             if ($v="a") then 
               "act."
             else if ($v="p") then "pas."
           )
        else if ($p=7) then 
          switch ($v)
            case ("m") return "masc."
            case ("f") return "fem."
            case ("n") return "neutr."
            case ("c") return "comm."
            case ("r") return "masc.+fem."
            case ("z") return "masc.+neutr."
            default return ("--unknown gender--")
        else if ($p=8) then
          switch ($v)
            case ("n") return "nom."
            case ("g") return "gen."
            case ("d") return "dat."
            case ("a") return "acc."
            case ("v") return "voc."
            case ("b") return "abl."
            case ("l") return "loc."
            default return ("--unknown case--")
        else if ($p=9) then 
            switch ($v)
            case ("p") return "pos."
            case ("c") return "comp."
            case ("s") return "superl."
            default return ("--unknown degree--")
    },
    $a:=analyze-string($mc,".")/fn:match/data()
    ,
    $pos_translated:=
    for $b at $i in $a let $d:=prof:dump("O") where $b!="-"
    return
    
       $translate_position($b,$i)
  return string-join($pos_translated, " ")

};

declare function cc:order_paradigma($wf)
{
  let 
  $pts:=
  <paradigm_tables>
    <paradigm_table PoS="n">
      <level depth="1" code_index="3">
        <sequence>s p</sequence>
      </level>
      <level depth="2" code_index="8">
        <sequence>n g d a v b</sequence>
      </level>
    </paradigm_table>
  
     <paradigm_table PoS="v">
      <level depth="1" code_index="5">(:modus:)
        <sequence>i c m n g p s</sequence>
      </level>
      <level depth="2" code_index="4">(:tempus:)
        <sequence>p i f r l t</sequence>
      </level>
      <level depth="3" code_index="6">(:genus:)
        <sequence>a p</sequence>
      </level>
      <level depth="4" code_index="3">(:numerus:)
        <sequence>s p</sequence>
      </level>
      <level depth="5" code_index="2">(:persona:)
        <sequence>1 2 3</sequence>
      </level>
      <level depth="6" code_index="8">(:casus (participia):)
        <sequence>n g d a v b</sequence>
      </level>
      <level depth="7" code_index="7">(:genus (participia):)
        <sequence>c r m f n</sequence>
      </level>
    </paradigm_table>
  </paradigm_tables>,
  $PoS:=substring($wf/f[1]/@morph,1,1),
  $pt:=$pts/paradigm_table[@PoS=$PoS]
  return 
  <word_forms>
  {
    for $f in $wf/f
      let 
        $p_levels:=count($pt/level),
        $v:=
        sum(
        for $l in $pt/level 
          let 
            
            $position_code:=$f/@morph=>substring($l/@code_index,1),
            $d:=number($l/@depth),
            $s:=$l/sequence=>tokenize(),
            $p_in_s:=index-of($s,$position_code),
            $e:=$p_levels - $d,
            $er:=if ($l/@d=5) then error()
        return math:exp10($e) * $p_in_s)
    
    order by $v
    return
    $f
  }
  </word_forms>
};

declare function cc:merge_morph_codes($wmc,$smc)
{
  let 
    $wmca:=analyze-string($wmc,".")/fn:match/data(),
    $smca:=analyze-string($smc,".")/fn:match/data(),
    $mmorph:=
    for $i in 1 to 10
      let 
        $w:=$wmca[$i],
        $s:=$smca[$i]
    return 
      if ($w="x" or matches($s,"[A-Z]")) then
        lower-case($s)
      else if ($s="0") then
        "-"
      else
        $w 
    return string-join($mmorph)
};
declare function cc:get_word_forms($word)
{
  
  cc:order_paradigma(
  <word_forms>
  {
    let 
      $f:=doc("/run/media/jctibor/D58B-CDB0/CC2/flexio.xml"),
      $stems:=$word/st
    return
      for $s in $stems 
        let 
          $s_classes:=tokenize($s/@class/data()),
          $w_classes:=tokenize($word/@paradigma/data())
      return
      (
        for $p in $f/flexio/suffixes/s/paradigma
          let
            $p_classes:=tokenize($p/@p),
            $p_classesN:=for $c in $p_classes where $c=>starts-with("!") return substring-after($c,"!"),
            $cancel:=some $nC in $p_classesN satisfies index-of($w_classes,$nC)
        where some $s_class in $s_classes satisfies index-of($p_classes,$s_class)>0 and $cancel=false()
          let 
            $morph:=cc:merge_morph_codes($s/@morph,$p/@morph),
            $m_transl:=cc:translate_morph_code($morph)
      
      return
      
        <f morph="{$morph}" m_desc="{$m_transl}">{$s/@metr || $p/parent::*/metr}</f>
      )
    } 
    </word_forms>  )
};

declare function cc:filter_morph_type($wf,$types)
{
  for $f in $wf/f
  where
  some $type in $types satisfies
    matches($f/@morph/data(),$type)
  return 
  $f
};

declare function cc:analyze_word_form($w,$d)
{
  
  let 
  $max_suffix_length:=7,
  $l:=string-length($w)
  return 
  for $i in 0 to min(($max_suffix_length,$l))
    let 
      $suffix:=substring($w,$l - $i + 1),
      $stem:=substring($w,1,$l - $i),
      $first_letter:=substring($stem,1,1),
      
      $suffixes:=$d//s[@l=string-length($suffix)][@value/data()=$suffix],
      $stems:=$d//@*[local-name(.)=$first_letter || string($l - $i)]/parent::*[@*[1]=$stem],
      
      $match:=for $st in $stems 
        let 
          $w_paradigma:=tokenize($st/parent::*/@paradigma),
          $classes:=tokenize($st/@class),
          $paradigmas:=for $p in $suffixes/paradigma where some $class in $classes satisfies index-of(tokenize($p/@p),$class)>0 return $p
        where not($paradigmas=>empty())
        return 
          for $p in $paradigmas
            let $p_classesN:=for $c in tokenize($p/@p/data()) where $c=>starts-with("!") return substring-after($c,"!"),
            $cancel:=some $wp in $w_paradigma satisfies not(index-of($p_classesN,$wp)=>empty())
            where $cancel=false()
          return
            <m morph="{cc:merge_morph_codes($st/@morph/data(),$p/@morph/data())}">{$st/@metr || $p/parent::*/metr}</m>
      return 
      <i i="{$i}" l="{$l - $i+1}">
        {$match}
      </i>
};

declare function cc:normalize_lengths($w)
{
  translate($w,"āēīōūȳĀĒĪŌŪȲăĕĭŏŭĂĔĬŎŬ","aeiouyAEIOUYaeiouAEIOU")
};
declare function cc:substringR($str,$n)
{
  substring($str,string-length($str)+1 - $n)
};
declare function cc:split-string($str,$splitAfter1Based)
{
  let $pos:=
    if($splitAfter1Based>0) then 
      $splitAfter1Based
    else
      string-length($str)+$splitAfter1Based
  return
  (substring($str,1,$pos),substring($str,$pos+1))
};
declare function cc:add_word($w)
{
  let
    $get_additional_paradigmata:=function($t,$startAt)
    {
      let $adP:=
      for $i in $startAt to count($t) where $t[$i]=>matches("\+[A-Z]") return $t[$i]
      return $adP
    },
    $get_authoritative_paradigma:=function($t,$startAt)
    {
      let $adP:=
      for $i in $startAt to count($t) where $t[$i]=>matches("[A-Z][0-9\-.]") return
        substring-after($t[$i],"+")
      return $adP
    },
    $get_supplied_morph_code:=function($t,$startAt)
    {
      let $suppMC:=
      for $i in $startAt to count($t) where $t[$i]=>matches("[a-z123\-]{10}") return $t[$i]
      return $suppMC
    },
    $t:=tokenize($w),
    $L:=$t[1],
    $l:=cc:normalize_lengths($t[1]),
    $c:=count($t),
    $addP:=$get_additional_paradigmata($t,2),
    $authP:=$get_authoritative_paradigma($t,2),
    $sMC:=$get_supplied_morph_code($t,2),
    $forms:=
    if ($c>=2) then
    (
      if ($t[2]="1") then
      (
        if (matches($l,"(as|a)$")) then (:1st conjugation:)
          cc:noun_1($t,$L,$l,$addP,$authP,$sMC)
      )
    )    
    return
    
    <w lemma="{$forms?lemma}" paradigma="{$forms?w_paradigma}" morph="{$forms?w_morph_code}">{$forms?stems}</w>
    
};

declare function cc:noun_1($t,$L,$l,$addP,$authP,$sMC)
{
   let
     $mc:=if ($sMC=>empty() or $sMC="") then "n-x---fx--" else $sMC,
     $p:=if ($authP=>empty()or $authP="") then
     (
        if (matches($l,"a$")) then "N1a"
        else "N1gr"               
     )
     else
       $authP
     ,
     $stem:=if (matches($l,"a$")) then cc:split-string($L,-1)[1] else cc:split-string($L,-2)[1]
   return
    map{
      "stems":(cc:build_st_node($stem,$l,$p,$mc)),
      "w_paradigma":$p,
      "lemma":$l,
      "w_morph_code":$mc
    }
};
declare function cc:build_st_node($stem,$lemma,$classes,$morph)
{
  let
    $st:=<st paradigma="{$classes}" metr="{$stem}" morph="{$morph}" />,
    $fL:=substring(cc:normalize_lengths($stem),1,1)=>lower-case(),
    $l:=string-length($stem),
    $l2:=if ($l>=8) then "8p" else $l
  return 
  copy $st2:=$st modify
  (
    insert node attribute {$fL || $l2}{cc:normalize_lengths($stem)} as first into $st2
  )
  return $st2
};

declare function cc:load_simple_wordlist($file)
{
let $lf:=doc($file)
return
file:write(replace($file,".xml",".2.xml"),
<latin-forms>
{
  for $f at $i in $lf/latin-forms/form return
  <form>{
    let $m:=$f/@metr,
    $norm:=lower-case(cc:normalize_lengths($f/@metr/data())),
    $fl:=substring($norm,1,1),
    $fl_to_use:=if (matches($fl,"^[a-z]")) then $fl else "non_alph",
    $l:=string-length($norm),
    $l_to_use:=if ($l<=8) then $l else "8p"
    return
    (
    attribute {$fl_to_use || $l_to_use}{$norm},
    <type>{$f/@type/data()}</type>,
    <metr>{$f/@metr/data()}</metr>
    )
  }
  </form>
}
</latin-forms>
)
};


declare function cc:test_wordlist($input,$output)
(:web_accessible:)
{
  for $line in analyze-string($input,"\n")/fn:non-match/text()
  return
  <table border="0"><tr>
  {
    let  $words:=tokenize(replace($line,"[.,:?!]",""))
    return 
    
    for $w in $words 
      let $norm:=lower-case(cc:normalize_lengths($w)),
      $fl:=substring($norm,1,1),
      $fl_to_use:=if (matches($fl,"^[a-z]")) then $fl else "non_alph",
      $l:=string-length($norm),
      $l_to_use:=if ($l<=8) then $l else "8p",
      $forms:=db:attribute("la-forms",$norm,"*:" || $fl_to_use || $l_to_use)  
    return
    if ($output="html") then
    (
      <td style="vertical-align:top"><span style="font-weight:bold">{$w}</span>
         
         {
          for $f at $i in $forms 
          let $metr:=$f/parent::form/metr/data() group by $metr return
          (<br/>,<span style="font-weight:normal;">
          {
           $metr
           }
           </span>)
         }
      </td>
    )

  }
  </tr></table>
  
  
};

declare function cc:la-forms_reload_additional_source()
{
  db:replace("la-forms","latin-forms_additional.xml","/var/www/html/lexica/wiktionary/v2/latin-forms_additional.xml"),
  db:optimize("la-forms",false(),map{"attrindex":true()})
};

declare function cc:get_metrical_forms($input)
(:web_accessible:)
{
  <text>
  {
  for $line in $input/(line|tei:l) 
  let $index:=$line/@cc:verse_index
  return

  <line verse_index="{$index}">
  {
    let  $words:=tokenize(replace($line,"[.,:?!]",""))
    return 
    
    for $w in $words 
      
      let $norm1:=lower-case(cc:normalize_lengths($w)),
      $norm2:=
        if (ends-with($norm1,"que")) then 
          analyze-string($norm1,"(.*)que$")/fn:match/fn:group/text()
        else if (ends-with($norm1,"ve")) then
          analyze-string($norm1,"(.*)ve$")/fn:match/fn:group/text()
        else if (ends-with($norm1,"ne")) then
          analyze-string($norm1,"(.*)ne$")/fn:match/fn:group/text()
        else
          $norm1,
      $fl:=substring($norm1,1,1),
      $fl_to_use:=if (matches($fl,"^[a-z]")) then $fl else "non_alph",
      $l:=string-length($norm1),
      $l_to_use:=if ($l<=8) then $l else "8p",
      $l2:=string-length($norm2),
      $l2_to_use:=if ($l2<=8) then $l2 else "8p",
      $forms:=
        db:attribute("la-forms",$norm1,"*:" || $fl_to_use || $l_to_use),
      $forms2:=if ($norm1!=$norm2) then
        db:attribute("la-forms",$norm2,"*:" || $fl_to_use || $l2_to_use)
        
    return
    
      <word value="{$w}">{
         let $metr1:=
            for $f at $i in $forms 
            let $metr:=lower-case($f/parent::form/metr/data()) group by $metr return
             $metr
            ,
          
          $encl:=substring($norm1,string-length($norm2)+1),
          $metr2:=
            for $f at $i in $forms2
            let $metr:=lower-case($f/parent::form/metr/data()) group by $metr return
          $metr || $encl
         return
         for $f in ($metr1,$metr2)
           let $metr:=$f group by $metr
         return
         <metr form="{$metr}"/>
    }</word>

  }</line>
}
</text>
  
  
};

declare function cc:clear_metrical_analysis_from_file($file)
{
  let $d:=doc($file)
  return
  copy $d2:=$d modify
  (
    for $l at $i in $d2/tei:TEI/tei:text//tei:l return
    (
      if ($l/@metr) then
        delete node $l/@metr,
      if ($l/@real) then
        delete node $l/@real
      
    ),
    if ($d2/tei:TEI/tei:teiHeader/tei:encodingDesc/tei:metDecl[@type="cc"]) then
      delete node $d2/tei:TEI/tei:teiHeader/tei:encodingDesc/tei:metDecl[@type="cc"],
    if ($d2/tei:TEI/tei:teiHeader/tei:xenoData/metrical_analysis) then
      delete node $d2/tei:TEI/tei:teiHeader/tei:xenoData/metrical_analysis
    
  )
  return
  file:write($file,$d2)
};

declare function cc:metrical_analysis_of_file($file,$opt)
{
  let $d:=doc($file)
  return
  copy $d2:=$d modify
  (
    (: insert node namespace cc {"http://mlat.uzh.ch/2.0"} into $d2/tei:TEI, :)
    if (not($d2/tei:TEI/@cc:ns)) then
      insert node attribute {QName("http://mlat.uzh.ch/2.0","cc:ns")}{""} into $d2/tei:TEI,
    for $l at $i in $d2/tei:TEI/tei:text//tei:l
    return
    insert node attribute {QName("http://mlat.uzh.ch/2.0","cc:verse_index")}{$i} into $l
  )
  return
  let
  $all_l:=$d2/tei:TEI/tei:text//tei:l,
  $echo:=
  file:write($cc:home_folder || "var/verse_analysis.xml",<text>
  {
    for $l in $all_l
      let $with_metr_forms:=cc:get_metrical_forms(<text>{$l}</text>)/line
    return 
      $with_metr_forms
  }
  </text>),
  $dmp:=prof:dump("metrical variants retrieved, now running analysing programm..."),
  $analysed:=parse-xml(proc:system("cc_verse_analysis_BX_call")),
  $total:=number($analysed/metrical_analysis/total_verses),
  $total_id:=number($analysed/metrical_analysis/total_identified),
  $total_unamb:=number($analysed/metrical_analysis/identified_unambiguous),
  $total_amb:=number($analysed/metrical_analysis/identified_ambiguous),
  $total_notid:=number($analysed/metrical_analysis/not_identified),
  $dmp2:=prof:dump("Analysis received. Writing results to file.")
  return
  copy $d3:=$d2 modify
  (
    let $all_l2:=$d3/tei:TEI/tei:text//tei:l
    return
     for $av in $analysed/metrical_analysis/verse 
      let $verse_index:=$av/@verse_index/data(),
      $corresponding_l:=$all_l2[@cc:verse_index=$verse_index],
      $identified:=not($av/@identified/data()="false")
      
    return
    (
      if ($identified=true()) then
      (
        if (not($corresponding_l/@met)) then
          insert node attribute {"met"}{$av/variant_assessed[1]/type_abbr/text()} into $corresponding_l,
        if (count($av/variant_assessed)=1) then 
          if (not($corresponding_l/@real)) then
            insert node attribute {"real"}{$av/variant_assessed[1]/vocal_schema/text()} into $corresponding_l
        
      )
      ,
        
      delete node $corresponding_l/@cc:verse_index
   ),
   if ($d3/tei:TEI/tei:teiHeader/tei:encodingDesc/tei:metDecl) then
   (
     
   )
   else
   (
     insert node element{QName("http://www.tei-c.org/ns/1.0","metDecl")}
     {
        attribute {"type"}{"cc"},
        element{QName("http://www.tei-c.org/ns/1.0","p")}
        {
          "In the @met, upper case letters represent long syllable, lower case letter represent short syllable. The vowel in the schema corresponds with the vowel in the text. [] means ellision, () represents a diphthong." || $cc:nl || "Metres:" || $cc:nl,
          for $m in $analysed/metrical_analysis/metres/metre return
            $m/@name || " (" || $m/@abbreviation || "): " || $m/text() || $cc:nl        }
     }
     into $d3/tei:TEI/tei:teiHeader/tei:encodingDesc
     
   )
   
  )
  (: return () :)
  return 
  let $d4:=
      cc:insert_xenoData($d3,
   <metrical_analysis>
     <when>{cc:now()}</when>
     {$analysed/metrical_analysis/total_verses}
     {$analysed/metrical_analysis/total_identified}
     {$analysed/metrical_analysis/identified_unambiguous}
     {$analysed/metrical_analysis/identified_ambiguous}
     {$analysed/metrical_analysis/not_identified}
   </metrical_analysis>,"",true())
  return
  (
    file:write($file,$d4),
    prof:dump("Analysis written back to file " || $file),
    prof:dump("Results:"),
    prof:dump("Total verses processed: " || $total ),
    prof:dump("Total verses identified: " || $total_id || " ("|| round(100*($total_id div $total),1) || "%)"),
    prof:dump("Verses identified, unambiguous: " || $total_unamb || " ("|| round(100*($total_unamb div $total),1) || "%)"),
    prof:dump("Verses identified, but ambiguous: " || $total_amb || " ("|| round(100*($total_amb div $total),1) || "%)"),
    prof:dump("Verses not identified at all: " || $total_notid || " ("|| round(100*($total_notid div $total),1) || "%)")
  )
  
  
  (: return $analysed :)
};
