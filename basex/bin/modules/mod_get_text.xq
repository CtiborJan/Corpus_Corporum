module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace html="http://www.w3.org/1999/xhtml/";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "get_sentence.xq","mod_browsing.xq","general_functions.xq","text_manipulation.xq";


declare function cc:get_sentences($paths,$heads_too)
(:web_accessible:)
{
    <sentences>
    {
        for $p in $paths let $parent_pid:=substring-before($p,","),$n:=substring-after($p,",") return
        (
            let $ppid:=db:attribute("corpus_corporum_data",substring-before($p,","))/parent::* return
            
                (: for $ppid in $ppids 
                    let $s:=$ppid/parent::s, :)
                    let 
                    $ancestors:=$ppid/ancestor::tei:div,
                    $heads:=
                    (
                        for $a in $ancestors return
                        <head pid="{$a/@cc:pid}">
                        {
                            $a/tei:head/text()
                        }
                        </head>
                    )
                    
               return
                
                <sentence pid="{$p}">
                    <meta><heads>{$heads}</heads></meta>    
                    <text>
                    {
                        (: let $starting_element:= $s/(ancestor::*[local-name(.)="div" or local-name(.)="lg" or local-name(.)="p" or local-name(.)="head"])[last()] return
                        cc:get_sentence2($starting_element,$n)/text() :)
                        cc:get_sentence_NEW(map{"text_section":$ppid,"sentence_nr":$n})
                        
                    }</text>
                </sentence>           
        )
    }
    </sentences>
};


declare function cc:fetch_raw_text($cc_idno)
{
    cc:fetch_raw_text($cc_idno,false())
};
declare function cc:fetch_raw_text($cc_idno,$header_too)
{
    if ($header_too=true()) then
        $cc:data/cc:tdata[@cc:idno=$cc_idno]
    else
        $cc:data/cc:tdata[@cc:idno=$cc_idno]/cc:text
};

declare function cc:fetch_text_data($path)
(:web_accessible:)
{
  cc:fetch_text_data($path,"0",true(),true())
};


(:declare function cc:fetch_text_data($path,$transformation_mode,$work_and_author_too,$table_of_contents_too)
{
  cc:fetch_text_data($path,$transformation_mode,$work_and_author_too,$table_of_contents_too,"x")
};:)


declare function cc:fetch_text_data($path,$transformation_mode,$work_and_author_too,$table_of_contents_too)
{
  cc:fetch_text_data($path,$transformation_mode,$work_and_author_too,$table_of_contents_too,())
};
declare function cc:paths_common_part($path1,$path2,$i)
{
  let 
  $p1:=analyze-string($path1,"[^.:;,~^]+"),
  $p2:=analyze-string($path2,"[^.:;,~^]+")
  return
  let $step1:=
  for $i in (1 to count($p1/*))
  return
  (
  if (string-join(subsequence($p1/*/text(),1,$i))=string-join(subsequence($p2/*/text(),1,$i))) then
  string-join(subsequence($p1/*/text(),1,$i))
  )
  return 
  if (matches($step1[last()],"[:.,;^~]$")) then
    substring($step1[last()],1,string-length($step1[last()])-1)
  else
    $step1[last()]
  
};
declare function cc:texts_common_part($text1,$text2,$i)
{
  if (substring($text1,1,$i)=substring($text2,1,$i)) then
    cc:texts_common_part($text1,$text2,$i+1)
  else
    substring($text1,1,$i - 1)
};




declare function cc:fetch_text_data($path1,$transformation_mode,$work_and_author_too,$table_of_contents_too,$TEXT_DATA)
(: transformation_mode=0,1 nebo 2 :)
{

    
  let
  $text_id:=analyze-string($path1,"^(cps_[0-9]+\.[A-Za-z0-9.]+)")/fn:match/fn:group[1]/text(),
  $text_idno:=
  if ($text_id!="") then
  (
    db:text("corpus_corporum",$text_id)/ancestor::item/cc_idno/text()
  )
  else
    analyze-string($path1,"^[0-9]+")/fn:match/text(),
  $path:=
  if ($text_id!="") then
  (
    replace($path1,$text_id,$text_idno)
  )
  else
    $path1,
  
  $T:=if (not($TEXT_DATA)) then 
        $cc:data/cc_texts/item[cc_idno=$text_idno]
      else
        $TEXT_DATA,
  $author_and_work:=
    if ($work_and_author_too=false()) then ()
    else
      (
        let $CC:=cc:get_corpus_tree($T/corpus),
        $W:=$cc:data/cc_works/item[cc_idno=$T/work_idno],
        $Wy:=cc:get_normalized_years($W)/*/data()=>max(),
        $A:=$cc:data/cc_authors/item[cc_idno=$W/author_data/primary_author_idno],
        $Ay:=cc:get_normalized_years($W)
        return
        <meta>
          {
            for $C at $i in $CC return
            <corpus cc_idno="{$C/cc_idno}" nr="{$C/nr}" hierarchy_level="{$i}">{$C/name_data/name/text()}</corpus>
          }
          
          <text cc_idno="{$text_idno}">{$T/name_data/name/text()}</text>
          <work cc_idno="{$W/cc_idno}" year="{$Wy}">{$W/name_data/name/text()}</work>
          <author cc_idno="{$A/cc_idno}" year1="{$Ay/year1/data()}" year2="{$Ay/year2/data()}">{$A/name_data/name/text()}</author>
          <loaded_section>{$path}</loaded_section>
          <url>{$cc:server_url}</url>
          <xml_file_url_base>{substring-before(substring-after($T/xml_file_path,"data/"),"/")}</xml_file_url_base>
          <data_url>{concat($cc:server_url,$T/data_path)}</data_url>
          {$T}
        </meta>
      ) 
  return
      
  let $xml:=
  if (cc:check_accessibility($cc:accessibility,$T/availability/text())=1) then
  (:klient má právo přistoupit k celému textu:)
  (
    if (contains($path,"~")=false()) then
    ( (:jednoduchá situace,kdy nahráváme nějaký jeden strukturální prvek (a ne sekci jdoucí přes více takových prvků):)
      cc:fetch_text_section("",$path,1,"") 
    )
    else
    (
    (: pokud nahráváme nějakou sekci jdoucí napříč více prvky, musíme postupovat následovně: 
    Najdeme jejich strukturálně nejnižšího společného předka a necháme si vrátit ten. Pak z něj odstraníme vše, co je před požadovaným začátkem a vše, co je po požadovaném konci
    :)
      let
      $part1:=substring-before($path,"~"),
      $part2:=substring-after($path,"~"),
      $last_common_part:=cc:paths_common_part($part1,$part2,1),
      $first_step_after_lcp:=concat($last_common_part,analyze-string($part1,concat("^",replace($last_common_part,"\.","\\."),"([.,:][0-9A-Z]+)"))//fn:group/text()), (:potřebujeme najít první krok po "nejmenším společném předkovi", abychom pak mohli vyfiltrovat jenom ty heady, které chceme: hlavičku toho předka totiž nechceme.:)
      $tmp_xml:= cc:fetch_text_section("",$last_common_part,1,"")
      return 
      copy $tmp2_xml:=$tmp_xml modify
      (
        let
        $element1:=
        (:pokud prvek od obsahuje i milestone, musíme najít nejprve tento. Pokud ne, pracujeme s celým strukturálním elementem:)
        if (contains($part1,"^")=false()) then
        (
          $tmp2_xml//*[@cc:pid=$part1]
        )
        else
        (
          (:jinak si rozložíme příslušnou část cesty...:)
          let $pid:=substring-before($part1,"^"),
          $ms:=substring-after($part1,"^"),
          $ms_unit:=substring-before($ms,"="),
          $ms_n:=substring-after($ms,"=") return
          (:najdeme příslušný strukturální element:)
          let $structural_element:=$tmp2_xml//*[@cc:pid=$pid],
          (:a v něm příslušný milestone:)
          $ms:=$structural_element//tei:milestone[@unit=$ms_unit and @n=$ms_n]
          (:pokud existuje, jinak vracíme celý element:)
          return (if ($ms) then $ms else $structural_element)
        ),
        $element2:=
        (:s koncovým elementem postupujeme úplně stejně, jen pracujeme s druhou částí původní cesty:)
        if (contains($part2,"^")=false()) then
        (
          $tmp2_xml//*[@cc:pid=$part2]
        )
        else
        (
          let $pid:=substring-before($part2,"^"),
          $ms:=substring-after($part2,"^"),
          $ms_unit:=substring-before($ms,"="),
          $ms_n:=substring-after($ms,"=") return
          let $structural_element:=$tmp2_xml//*[@cc:pid=$pid],
          (:akorát musíme pracovat s $ms_n+1, protože zadaný milestone ještě chceme:)
          $ms:=$structural_element//tei:milestone[@unit=$ms_unit and @n=number($ms_n)+1]
          return if ($ms) then $ms else $structural_element
        )
        return 
        (
          for $e in $element1/preceding::node() let $h:=$e/ancestor-or-self::tei:head where count($h)=0 or contains($h/@cc:pid,$first_step_after_lcp)=false()  return 
          (:smažeme všechno, kromě hlaviček vyšších divů až po příp. nejmenšího společného jmenovatele: toho už ne (viz případ bibl. synopse, S:Nehemnjáš->V:Esdráš+Nehemjáš: chceme nadpisy "Esdras" i "Nehemjas", ale už ne "Vetus testamentum" (tj. nejmenší společný předek):)
            delete node $e
          ,
          for $e in $element2/following::node() return 
            (
              delete node $e
            ),
            if (local-name($element2)="milestone") then delete node $element2
        )
      )
      return $tmp2_xml
      )
      
    
  )
  else (:anebo nemá:)
    <result><text><restricted_access>{cc:accessibility_info($T/availability/text())}</restricted_access></text></result>
  return
  let $table_of_contents:=
    if ($table_of_contents_too=true()) then cc:get_table_of_contents("",$xml)
  let $meta:=
  <meta>
    {$author_and_work/*}
    {$xml/meta/*}
    {$table_of_contents}
    {cc:fetch_tei_header($text_idno)}
  </meta>
  return
  copy $xml2:=$xml modify
  (
    if ($xml2/meta) then
      replace node $xml2/meta with $meta
    else
      insert node $meta as first into $xml2
  )
  return  
  
  if ($transformation_mode="0") then
    $xml2
  else if ($transformation_mode="1") then
    data($xml2/text)
  else if ($transformation_mode="2") then
    copy $xml3:=$xml2 modify
    (
      for $paratext in $xml3//*[@cc:paratext] return
        replace node $paratext with ()
    )return $xml3

};

declare function cc:fetch_text_section($parent,$complete_path,$step_nr,$prev_heads)
{
  (:complete_path může obsahovat i určení milestonu: ^[unit_milestonu]:n_milestonu:)
  (:a také může sestávat z bodu od a bodu do, oddělených pomocí ~:)
  
  
  
  let $path:=
    if (substring-before($complete_path,"^")="") then 
      $complete_path
    else
      substring-before($complete_path,"^"),
  $milestone:=substring-after($complete_path,"^") return
  let $steps:=analyze-string($path,"[0-9A-Za-z]+"),
  $cc_idno:=data($steps/fn:match[1]),
  $last_element_path:=
    if (substring-before($path,",")="") then
      $path
    else
      substring-before($path,","),
  $sentence_nr:=substring-after($path,",")
  return
  let $text_el:=
      $cc:data/tdata[@cc:idno=$cc_idno]/cc:text/tei:text,
  $n:=
  
    if ($text_el/@cc:pid!=$path) then
    $text_el//*[@cc:pid=$last_element_path]
  else
    $text_el,
    
   $n2:=
  if ($milestone="") then
  (
    $n
  )
  else
  (
    (:pokud chceme vybrat text mezi dvěma milestones (např. verše v bibli...
    Necháme si vrátit nejprve celý rodičovský úsek těchto milst. a poté z něj odstraníme vše, co předchází prvnímu požadovanému milst. a vše, co následuje po posledním požadovaném milst.
    Pomocí window to nejde, protože to komplikují případy jako Vulg. Gen. 1. 25-26, kdy verš 25 sahá přes hranu odstavce: při windowingu bychom tedy dostali i celý ten druhý odstavec, který bychom pak museli složitě odstraňovat. Takto je to elegantní a jednoduché a spolehlivé.
  :)
    let $ms_unit:=substring-before($milestone,"="),
    $ms_n_range:=substring-after($milestone,"="),
    $ms_n_start:=if(contains($ms_n_range,"-")) then xs:integer(substring-before($ms_n_range,"-")) else xs:integer($ms_n_range),
    $ms_n_end:=if(contains($ms_n_range,"-")) then xs:integer(substring-after($ms_n_range,"-")) else xs:integer($ms_n_range)
    return
     
    copy $tmp1:=$n modify
    (
      let $m1:=$tmp1//tei:milestone[@unit=$ms_unit and @n=$ms_n_start] return
      for $p in $m1/preceding::node() let $h:=$p/ancestor-or-self::tei:head where count($h)=0 return delete node $p
    )
    return
    copy $tmp2:=$tmp1 modify
    (
      let $m2:=$tmp2//tei:milestone[@unit=$ms_unit and @n=($ms_n_end+1)] return
      (
        for $p in $m2/following::node() return (delete node $p),
        delete node $m2
      )
    )
    return $tmp2
  )  
  
  return 
  <result>
    <meta>
    <heads>
      {
        let $ancestors:=$n2/ancestor::*[namespace-uri(.)!="http://mlat.uzh.ch/2.0"] return
        for $a in $ancestors where local-name($a)!="text" return
        (            
            <head pid="{$a/@cc:pid}">{$a=>cc:get_section_head()}</head>
        )
      }
    </heads>
    </meta>
    <text>
    {
      if ($sentence_nr="") then
        $n2
      else
        cc:get_sentence2($n2,$sentence_nr)
    }
    </text>
    <pid>{$path}</pid>
  </result>
};



declare function cc:fetch_text_section3($parent,$path,$step_nr,$prev_heads)
{ (: Recursive function, which gets the piece of text on the given $path together with all headers met on the path.:)
  let $steps:=analyze-string($path,"[0-9A-Za-z]+") return
  let $ac_path:=string-join(data($steps/child::fn:match[$step_nr]/(self::*|preceding-sibling::*))) return
  if ($step_nr=1) then
  ( (:first step: we get the root element of the text, which is the /cc:tdata/cc:text element :)
    let $text_root:=$cc:data/tdata[@cc:idno=$ac_path]/cc:text return
    if ($text_root/tei:text/@cc:pid=$ac_path) then    
    (:there's only one tei:text (with the same pid as the root):)
    (
      let $text_section:=$text_root/tei:text[@cc:pid=$ac_path] return
      if ($text_section/tei:body/@cc:pid=$text_section/@cc:pid) then 
      (
        
      (:there is only body, no front or back:)
       if ($step_nr<count($steps/fn:match)) then
          cc:fetch_text_section($text_section/tei:body,$path,$step_nr+1,$prev_heads)
       else
          <result><meta>{$prev_heads}</meta><text>{$text_section}</text></result>
      )      
      
      else if ($text_section/tei:group) then
      (
        if ($step_nr<count($steps/fn:match)) then
          cc:fetch_text_section($text_section/tei:group,$path,$step_nr+1,$prev_heads)
        else
          <result><meta>{$prev_heads}</meta><text>{$text_section}</text></result>
      )
      else(:divs, p, lg...:)
      (
        if ($step_nr<count($steps/fn:match)) then
        (
          let $heads:=
            if (local-name($text_section)="div") then
            (
              if($prev_heads!="") then
                <heads>
                  {$prev_heads/*}
                  <head pid="{$text_section/@cc:pid}">{data($text_section/tei:head[1])}</head>
                </heads>
              else
                <heads>
                  <head pid="{$text_section/@cc:pid}">{data($text_section/tei:head[1])}</head>
                </heads>
            )
            
            return
          cc:fetch_text_section($text_section,$path,$step_nr+1,$heads)
        )
        else
          <result><meta>{$prev_heads}</meta><text>{$text_section}</text></result>
      )
    )
    else
    ( (:more tei:texts:)
      let $text_section:=$text_root return
      if ($step_nr<count($steps/fn:match)) then
      cc:fetch_text_section($text_section,$path,$step_nr+1,$prev_heads)
        else
      <result><meta>{$prev_heads}</meta><text>{$text_section}</text></result>
    )
  )
  else(:not the first step:)
  (  
  
    if ($step_nr=count($steps/fn:match) and $steps/fn:non-match[last()]/text()=",") then
    ( (:it's the last step and we want a sentence:)
    
      let $ss:=$parent//cc:s[@n=$steps/fn:match[last()]/text()] return
      <result>
        <meta>{$prev_heads}</meta>
        <text>{(: cc:get_sentence($ss) :)cc:get_sentence2($parent,$steps/fn:match[last()]/text())}</text>
      </result>
    )
    else (:it's not the last step or it may be, but we don't want any sentence anyway:)
    (
      (: error(QName("","error"),$steps/fn:match[2]) :)
      let $text_section:=$parent/*[@cc:pid=$ac_path] return
      let $heads:=
        if (local-name($text_section)="div") then (:A1:)
        (
          if($prev_heads!="") then (:B1:)
            if (data($text_section/tei:head[1])!="") then 
              <heads>
                {$prev_heads/*}
                <head pid="{$text_section/@cc:pid}">{data($text_section/tei:head[1])}</head>
              </heads>     
              (:concat $prev_heads,", ",data$text_section/tei:head[1]  we take only the first head for the case there are more:) 
            else if ($text_section/@n!="") then
              <heads>
                {$prev_heads/*}
                <head pid="{$text_section/@cc:pid}">{$text_section/@n}</head>
              </heads> 
              (:concat($prev_heads,", ",$text_section/@n) :) (:no head, we try, if there is @n:)
            else (:if not, we take the number from pid:)
              <heads>
                {$prev_heads/*}
                <head pid="{$text_section/@cc:pid}">{$steps/fn:match[$step_nr]/text()}</head>
              </heads>
              (:$steps/fn:match[$step_nr]/text() :)
              
          else (:B2:)
            <heads>
              <head pid="{$text_section/@cc:pid}">{data($text_section/tei:head[1])}</head>
            </heads>
            
        )(:A1:)
        else
          $prev_heads(:its not div, we can't have any head, so we return, what we have:)
        return
      if ($step_nr<count($steps/fn:match)) then
        cc:fetch_text_section($text_section,$path,$step_nr+1,$heads)
      else
        <result><meta>{$heads}</meta><text>{$text_section}</text></result>
    )
  )  
};


declare function cc:get_incipit($path,$section)
{
  
   let $xml1:=
    if ($section="" or $section=()) then 
      cc:fetch_text_section("",$path,1,"")
    else
      $section
  return
  let $s:=$xml1//cc:s[not(./ancestor::tei:head)]
  return 
  let $sentence:=cc:get_sentence2($s[1]/parent::*,$s[1]/@n) return 
  $sentence
  
};

declare function cc:get_table_of_contents($path)
(:web_accessible:)
{
    cc:get_table_of_contents($path,"")
};

declare function cc:get_table_of_contents($path,$section)
{
  (:data jsme buď dostali, nebo ne: pokud ne, vezmeme si je:)
  
  let $xml1:=
    if ($section="" or $section=()) then 
      cc:fetch_text_section("",$path,1,"")
    else
      $section
  return
  let $xml2:=
    $xml1/*[node-name(.)!=QName("http://mlat.uzh.ch/2.0","meta")][1](:as result of cc:fetch_text_section 
    receive we <result><meta/><*any*textual*data/></result>, so we must ensure to get rid of the meta element:)
  return
  let $xml3:=
    if (node-name($xml2)=QName("http://mlat.uzh.ch/2.0","tdata")) then
      $xml2/text/*[1]
    else if (node-name($xml2)=QName("http://mlat.uzh.ch/2.0","text")) then
      $xml2/*[1]
    else
      $xml2
  return
 
  <table_of_contents pid="{$path}" head="{$xml3/tei:head[1]/text()}">
  {cc:get_contents($xml3,-1)}
  </table_of_contents>
};

declare function cc:get_contents($text_node,$depth)
{
  if (local-name($text_node)="text" or local-name($text_node)="body") then
  (
    for $section in $text_node/(tei:div,tei:text,tei:body,tei:group,tei:front,tei:back) return
    (
      cc:get_contents($section,0)
    )
  )
  else
  (
    if ($depth>-1) then 
    (:nechceme i hlavičku sekce, jejíž obsah chceme - chceme jen hlavičky sekcí v ní obsažených
    Pokud máme např. v divu 123:1 hlavičku <head>ABC</head> a pak poddivy 123:1.1, .2, .3 atd. s vlastními heady,
    chceme pouze jejich <head/> - nikoliv <head>ABC</head>.
    :)
    (
    <contents pid="{$text_node/@cc:pid}" type="{local-name($text_node)}" depth="{$depth+1}" length="{string-length(data($text_node))}">
    <head>{$text_node/tei:head[1]/text()}</head>
    {
      for $section in $text_node/(tei:div,tei:text,tei:body,tei:group,tei:front,tei:back) return
      (
        cc:get_contents($section,$depth+1)
      )
    }
    </contents>
    )
    else
      for $section in $text_node/(tei:div,tei:text,tei:body,tei:group,tei:front,tei:back) return
        (
          cc:get_contents($section,$depth+1)
        )
  )
};


declare function cc:expand_paths($node,$flags)
{
  
  for $pid in $node/path return
  (
    concat($cc:data/cc_works/item[cc_idno=$pid/work_idno]/name_data/name/text(),"<br/>"),
    if ($pid/work_idno) then
    "a",
    "n"
  )
  
};

declare function cc:translate_PL($pl_path)
{
  let $steps:=analyze-string($pl_path,"^PL[^0-9]{0,2}([0-9]+)[^0-9A-Z]{1,2}([0-9]+)([A-Z])?") return
  let $volume:=$steps/fn:match/fn:group[@nr="1"],
  $column:=number($steps/fn:match/fn:group[@nr="2"]),
  $letter:=$steps/fn:match/fn:group[@nr="3"]
  return 
  (
    let $PL_corpus_idno:=$cc:root/cc_corpora/item[name_data/name="Patrologia Latina"]/cc_idno/text(),
    $Tv:=$cc:root/cc_texts/item[corpus/text()=$PL_corpus_idno and publication_data/volume=$volume] return
    let $Tc:=
      for $T in $Tv 
        let 
        $fc:=analyze-string($T/publication_data/pages/first,"([0-9]+)([A-Z])?"),
        $lc:=analyze-string($T/publication_data/pages/last,"([0-9]+)([A-Z])?")
      where $column>=number($fc/fn:match/fn:group[@nr="1"]) and $column<=number($lc/fn:match/fn:group[@nr="1"]) 
      return $T
    return 
    let $Tl:=
    if (count($Tc)>1 and $letter!="") then
    (
      for $T in $Tc
        let 
        $fc:=analyze-string($T/publication_data/pages/first,"([0-9]+)([A-Z])?")/fn:match/fn:group[@nr="2"],
        $lc:=analyze-string($T/publication_data/pages/last,"([0-9]+)([A-Z])?")/fn:match/fn:group[@nr="2"] 
      where $fc!="" and $lc!="" and (string-to-codepoints($letter)>= string-to-codepoints($fc) and string-to-codepoints($letter)<= string-to-codepoints($lc))
      return $T
    )
    else if (count($Tc)=1) then
    (
      $Tc
    )
    return 
    if (count($Tl)=1) then $Tl 
  )
  
};

declare function cc:get_text_structure($cc_idno)
{
  
};
declare function cc:get_section_head($section)
{
  let $text_chunks:=
    for $d in $section/(tei:head|tei:argument)/(node() except cc:s)/data() where normalize-space($d)!=""
    return $d,
    
    
    $h_a:=tokenize(string-join($text_chunks,": ")) 
      
  return
  
  
  let $heads:=
      if (count($h_a)>25) then
        concat(string-join(subsequence($h_a,1,23)," "),"...")
      else
        string-join($h_a," ")      
  return
  if (normalize-space($heads)="") then      
    let 
      $t:=tokenize(substring(string-join($section/(node() except cc:s)/data()),1,70)) return
      if (count($t)>25) then
        <t>{concat(string-join(subsequence($t,1,20)," "),"...")}</t>
      else
        <t>{string-join(subsequence($t,1,count($t)-1)," ")}</t>
  else
    $heads

};


