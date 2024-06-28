module namespace cc="http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace html="http://www.w3.org/1999/xhtml/";
declare default element namespace "http://mlat.uzh.ch/2.0";
import module "http://mlat.uzh.ch/2.0" at "get_sentence.xq","mod_browsing.xq","general_functions.xq","text_manipulation.xq";

declare function cc:provide_document($opt)
{
    let $cc_idno:=
        if ($opt instance of xs:string) then $opt
        else if ($opt instance of map(*)) then $opt?idno
        else 
        (
          
          prof:dump($opt),
          error()
        )
    return
        db:open("corpus_corporum_data",$cc_idno)
};
declare function cc:get_sentence_NEW($opt)
{
  let 
    (: $d:=prof:dump($opt), :)
     $text_section:=
     if ($opt?text_section) then 
       $opt?text_section
     else
        db:attribute("corpus_corporum_data",$opt?pid,"cc:pid")[1]/parent::*
       ,
     $nr:=$opt?sentence_nr,
     $sentences:=
      for sliding window $sentence in $text_section//node()[./self::cc:s or ./self::tei:l or (local-name(.)="" and normalize-space(data(.))!=""and count(./ancestor::*[@cc:paratext])=0)]
        start $se when $se/self::cc:s and $se/@n=$nr
        end $ee when $ee/self::cc:s and not ($se is $ee)
        where data($sentence)!="" and $se/@parent_pid=$text_section/@cc:pid
      return
        <sentence parent_pid="{$se/@parent_pid/data()}" n="{$se/@n/data()}">
        {
          for $s in $sentence
            
          return
          (
            if ($s/self::tei:l) then
              <cc:lb type="verse"/>
            else if (local-name($s)="") then
              $s
          ) 
        }
        </sentence>
    return  
    $sentences
};

declare function cc:provide_text($opt)
(:web_accessible:)
{
    let $path_id:=
        if ($opt instance of xs:string) then cc:translate_address($opt,true())
        else if ($opt instance of map(*)) then
            cc:translate_address($opt?path_id,true()),
    $p:=prof:dump($path_id),
    $basic_pid:=analyze-string($path_id,"^[^~\^]+")/fn:match/text(),
    $cc_idno:=analyze-string($basic_pid,"^[0-9]+")/fn:match/data(),
    $sentence:=analyze-string($basic_pid,"(.*),(.*)"),
    $section_pid:=if ($sentence/fn:match) then $sentence/fn:match/fn:group[@nr="1"]/data() else $basic_pid,
    $sentence_nr:=if ($sentence/fn:match) then $sentence/fn:match/fn:group[@nr="2"]/data() else "",
    $preserve_xeno_data:=if ($opt instance of map(*)) then $opt?preserve_xeno_data else false(),
    
    (: $doc:=db:open("corpus_corporum_data",$cc_idno), :)
    (: $clean_pid:=substring-before($section_pid,"~"), :)
    $text_section:=db:attribute("corpus_corporum_data",$section_pid,"cc:pid")[1]/parent::*,
    (: $void:=if ($text_section) then true() else error((),"wrong_idno " || $section_pid), :)
    $doc:=$text_section/ancestor::tei:TEI,
    $header:=
        if ($preserve_xeno_data=true()) then 
            $doc/tei:TEI/tei:teiHeader
        else
            $doc/tei:TEI/tei:teiHeader transform with {delete node ./tei:xenoData},
    
    $item:=cc:item($cc_idno),
    $cps:=cc:get_corpus_tree($item/corpus),
    $W:=cc:item($item/work_idno),
    $Wy:=cc:get_normalized_years($W)/*/data()=>max(),
    $A:=cc:item($W/author_data/primary_author_idno),
    $Ay:=cc:get_normalized_years($W)
    
    return
    if (cc:check_accessibility($cc:accessibility,$item/availability/text())=1) then
    (
      <result>
          <meta>
              {
                for $C at $i in $cps return
                  <corpus cc_idno="{$C/cc_idno}" nr="{$C/nr}" hierarchy_level="{$i}">{$C/name_data/name/text()}</corpus>,
                <text cc_idno="{$item/cc_idno/data()}">{$item/name_data/name/text()}</text>,
                <work cc_idno="{$W/cc_idno}" year="{$Wy}">{$W/name_data/name/text()}</work>,
                <author cc_idno="{$A/cc_idno}" year1="{$Ay/year1/data()}" year2="{$Ay/year2/data()}">{$A/name_data/name/text()}</author>,
                <loaded_section>{$path_id}</loaded_section>,
                <url>{$cc:server_url}</url>,
                <xml_file_url_base>{substring-before(substring-after($item/xml_file_path,"data/"),"/")}</xml_file_url_base>,
                <data_url>{concat($cc:server_url,$item/data_path)}</data_url>,
                <method>cc:provide_text()</method>
              }
                {$item}
                {$header}
                {cc:get_ancestors_heads_NEW($text_section)}
                {cc:get_table_of_contents_NEW(map{"xml":$text_section})}
            </meta>
            
            <text>
            {
              
              
              if (contains($path_id,"~")=false()) then
              ( (:jednoduchá situace,kdy nahráváme nějaký jeden strukturální prvek (a ne sekci jdoucí přes více takových prvků):)
                cc:provide_text_section(map{"path_id":$path_id,"node":$text_section})
              )
              else
              (
              (: pokud nahráváme nějakou sekci jdoucí napříč více prvky, musíme postupovat následovně: 
              Najdeme jejich strukturálně nejnižšího společného předka a necháme si vrátit ten. Pak z něj odstraníme vše, co je před požadovaným začátkem a vše, co je po požadovaném konci
              :)
                let
                $part1:=substring-before($path_id,"~"),
                $part2:=substring-after($path_id,"~"),
                $last_common_part:=cc:paths_common_part($part1,$part2,1),
                $first_step_after_lcp:=concat($last_common_part,analyze-string($part1,concat("^",replace($last_common_part,"\.","\\."),"([.,:][0-9A-Z]+)"))//fn:group/text()), (:potřebujeme najít první krok po "nejmenším společném předkovi", abychom pak mohli vyfiltrovat jenom ty heady, které chceme: hlavičku toho předka totiž nechceme.:)
                $tmp_xml:= cc:provide_text_section(map{"path_id":$last_common_part})
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
                      if ($element2/self::tei:milestone) then delete node $element2
                  )
                )
                return $tmp2_xml
              )
             
              
            }
            </text>
            <pid>{$path_id}</pid>
        </result>
      )
      else
      ( (:the user does not have rights to access the text:)
              <result>
                <text>
                  <restricted_access>{cc:accessibility_info($item/availability/text())}</restricted_access>
                </text>
                <pid>{$path_id}</pid>
              </result>
      )
    
};

declare function cc:provide_bare_text($path_id)
(:web_accessible:)
{
  let
  $text1:=cc:provide_text($path_id)/text
  return
  copy $text2:=$text1 modify
  (
    for $pt in $text2//*[@cc:paratext] return delete node $pt
  )
  return
    normalize-space
    (
      string-join
      (
        for $n in $text2//node()
        return
          if (local-name($n)="") then $n
          else if (local-name($n)="s" and $n/@parent_pid) then "<s/>"
      )
    )


  
};

declare function cc:provide_all_sentences($opt)
{
  let
  $text:= cc:provide_document($opt),
  $sentences:=
      for sliding window $sentence in $text//tei:text//node()[./self::cc:s or ./self::tei:l or (local-name(.)="" and normalize-space(data(.))!=""and count(./ancestor::*[@cc:paratext])=0)]
        start $se when $se/self::cc:s
        end $ee when $ee/self::cc:s and not ($se is $ee)
        where data($sentence)!=""
      return
        <sentence pid="{$se/@parent_pid || "," || $se/@n}">
        {
          for $s in $sentence where not ($s is $ee)
          return
            if ($s/self::tei:l) then <lb type="verse"/>
            else if ($s/self::cc:s) then element {"s"}{$s/*,$s/@*}
            else replace($s, "\n"," ")
        }
        </sentence>
  return $sentences
  
};

declare function cc:provide_text_section($opt)
(:web_accessible:)
{
  (:complete_path může obsahovat i určení milestonu: ^[unit_milestonu]:n_milestonu:)
  (:a také může sestávat z bodu od a bodu do, oddělených pomocí -, tj. od jednoho milestonu po druhý
  Pokud chceme úsek textu jdoucí přes různé strukturální sekce, tj. cesta obsahuje ~, pak se to řeší v fci provide_text
  :)
  
  
  let $path:=
    
    if (substring-before($opt?path_id,"^")="") then 
      $opt?path_id
    else
      substring-before($opt?path_id,"^"),
  $milestone:=substring-after($opt?path_id,"^") return
  let $steps:=analyze-string($path,"[0-9A-Za-z]+"),
  $cc_idno:=data($steps/fn:match[1]),
  $section_pid:=
    if (substring-before($path,",")="") then
      $path
    else
      substring-before($path,","),
  $sentence_nr:=substring-after($path,",")
  return
  (: let $text_el:=cc:provide_document($cc_idno), :)
  let
  $n:=
  
      if ($opt?node) then
        $opt?node
      else
        db:attribute("corpus_corporum_data",$section_pid,"cc:pid")[1]/parent::*,
      
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
  (: <result>
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
    { :)
      if ($sentence_nr="") then
      (
        copy $n3:=$n2 modify
        (
          for $s in $n3//cc:s return
          if ($s/@n) then
            replace node $s with <cc:s parent_pid="{$s/@parent_pid/data()}" n="{$s/@n/data()}"/>
          else 
            replace node $s with <cc:s/>
        )        
        return $n3
      )
      else
        cc:get_sentence_NEW(map{"text_section":$n2,"sentence_nr":$sentence_nr})
    (: }
    </text>
    <pid>{$path}</pid>
  </result> :)
};

declare function cc:get_ancestors_heads_NEW($text_node)
{
  <heads>
  {
    let $ancestors:=$text_node/ancestor::*[namespace-uri(.)!="http://mlat.uzh.ch/2.0"] return
    for $a in $ancestors where not($a/descendant-or-self::tei:text) return
    (            
        <head pid="{$a/@cc:pid}" t="{local-name($a)}">{$a=>cc:get_section_head()}</head>
    )
  }
  </heads>
  
};


declare function cc:get_table_of_contents_NEW($opt)
{
  (:data jsme buď dostali, nebo ne: pokud ne, vezmeme si je:)
  
  let $xml:=
    if ($opt instance of xs:string) then
      db:attribute("corpus_corporum_data",$opt,"cc:pid")/parent::*
    else if ($opt?xml) then 
      $opt?xml
     ,
    $path:=$xml/@pid      
  return


 
  <table_of_contents pid="{$path}" head="{normalize-space(string-join($xml/tei:head[1]/text()))}">
    {cc:get_contents_NEW($xml[1],-1)}
  </table_of_contents>
};

declare function cc:get_contents_NEW($text_node,$depth)
{
  if (local-name($text_node)="text" or local-name($text_node)="body") then
  (
    for $section in $text_node/(tei:div,tei:text,tei:body,tei:group,tei:front,tei:back) return
    (
      cc:get_contents_NEW($section,0)
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
        cc:get_contents_NEW($section,$depth+1)
      )
    }
    </contents>
    )
    else
      for $section in $text_node/(tei:div,tei:text,tei:body,tei:group,tei:front,tei:back) return
        (
          cc:get_contents_NEW($section,$depth+1)
        )
  )
};


declare function cc:provide_sentences($paths,$heads_too)
(:web_accessible:)
{
  (:nehotové - zkopírován starý kód:)
    <sentences>
    {
        for $p in $paths let $parent_pid:=substring-before($p,","),$n:=substring-after($p,",") return
        (
            let $ppids:=db:attribute("corpus_corporum",substring-before($p,",")) return
            
                for $ppid in $ppids 
                    let $s:=$ppid/parent::s,
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
                    
                where $s/@n=$n
                return
                
                
                <sentence pid="{$p}">
                    <meta><heads>{$heads}</heads></meta>    
                    <text>
                    {
                        let $starting_element:= $s/(ancestor::*[local-name(.)="div" or local-name(.)="lg" or local-name(.)="p" or local-name(.)="head"])[last()] return
                        cc:get_sentence2($starting_element,$n)/text()
                        
                        
                    }</text>
                </sentence>           
        )
    }
    </sentences>
};


declare function cc:pos_annotated_xml_file_path($cc_idno)
(:web_accessible:)
{
  let $T:=cc:item($cc_idno),
  $xml_path:=$T/xml_file_path
  return
  cc:get_state_path($xml_path,"POS")
};

declare function cc:xml_file_path($cc_idno)
(:web_accessible:)
{
  let $T:=cc:item($cc_idno),
  $xml_path:=$T/xml_file_path
  return
  cc:get_state_path($xml_path,"orig")
};


declare function cc:export_as_text($pid,$head,$apparatus_mode)
(:web_accessible:)
{
(:exporting a text as plain text:)
    let
    $page_width:=70,
    $nl:="
",    
    $mask_paratext:=
        function($n)
        {
            copy $n2:=$n modify
            (
                for $e at $i in $n2//*[@cc:paratext] return
                replace node $e with <paratext n="{$i}"/>
            )   
            return $n2
        },
    $remove_linebreaks:=
        function($e)
        {
            for $tn in $e/node()[local-name(.)=""] return 
                    replace value of node $tn with normalize-space(replace(replace($tn/data(),$nl," "),"\s+"," "))
        },
    $break_in_lines:=
        function($text,$break_after,$add_before)
        {
            let $analyze:=analyze-string($text,"(.{" || $break_after || ",}? )"),
            $lines:=
            for $l in $analyze/*/data() return $add_before || $l
            return
                string-join($lines,$nl)
        },
    $style:=doc("transform_to_plaintext.xsl"),
    $fetched_text_data:=cc:provide_text($pid),
    $meta:=$fetched_text_data/meta,
    $t:=$fetched_text_data/text,
    $masked_paratexts:=
    for $pt at $i in $t//*[@cc:paratext] return
        <paratext n="{$i}">{$pt}</paratext>,
    $t2:=$mask_paratext($t),
    $t3:=xslt:transform($t2,$style)
    return
    copy $t4:=$t3 modify
    (
        for $e in $t4//* let $en:=local-name($e) return
        (
            if ($en="p" or $en="l" or $en="head") then
                $remove_linebreaks($e)
                
        )
    )
    
    return
    copy $t5:=$t4 modify
    (
        for sliding window $w in $t5//*[local-name(.)="paratext" or local-name(.)="pb"]
        start $se when local-name($se)="pb"
        end $ee when local-name($ee)="pb" and $se/@n!=$ee/@n
        return
        (
            if (count($w)>2) then
            (
                let $paratexts:=
                    for $p in $w where local-name($p)="paratext" 
                        let $n:=$p/@n,
                        $pt_text:=$break_in_lines($n || ": " || replace($masked_paratexts[number($n)]/data(),$nl || "|\s+"," ") || $nl,$page_width - 20,"     ")
                    return $pt_text
                return 
                (insert node <paratext_section>{$nl || string-join(for $i in (1 to $page_width) return "_") || $nl || string-join($paratexts,$nl)}</paratext_section> before $ee)
            )
        )
    
    )
    return
    copy $t6:=$t5 modify
    (
        for $e in $t6//* let $en:=local-name($e) return
        (
           
            if ($en="pb") then
            (
                if ($e/@n="supplied:BEGINNING" or $e/@n="supplied:END") then
                    delete node $e
                else
                (
                    let 
                    $page_marker:="[page " || $e/@n || "]",
                    $pm_length:=string-length($page_marker),
                    $pwmpm:=xs:integer(($page_width - $pm_length) div 2)
                    return 
                
                    replace node $e with $nl || string-join(for $i in (1 to $pwmpm) return "-") || $page_marker || string-join(for $i in ($pwmpm + $pm_length to $page_width) return "-") || $nl
                )
            )
            else if ($en="paratext") then
            (
                replace node $e with "[" || $e/@n || "]"
            )
        )
    )
    return 
    copy $t7:=$t6 modify
    (
      for $l in $t7//*[local-name(.)="l"] return
      replace value of node $l with $l/text() || $nl
    )
    return
    let 
    $header:=
    (
        "Text downloaded from Corpus Corporum (mlat.uzh.ch) at " || cc:now() || $nl || $nl ||
        $meta/corpus/text() || " (Corpus " || $meta/corpus/@nr || ")" || $nl ||
        $meta/author/text() || $nl ||
        normalize-space($meta/work/text()) || $nl ||
        "cc_idno: " || $meta/item/cc_idno/text() || (if ($meta/item/cc_id) then (", cc_id: " || $meta/item/cc_id/text())) || $nl ||
        "permalink: " || 
        (
            if ($meta/item/cc_id and $meta/item/cc_id/text()!="") then 
                "https://mlat.uzh.ch/browser/" || $meta/item/cc_id
            else
                "https://mlat.uzh.ch/browser/" || $meta/item/cc_idno
        )
        || $nl ||
        "Downloaded part pid: " || (if ($meta/item/cc_id) then (replace($pid,"^" || $meta/item/cc_idno/text(), $meta/item/cc_id/text()) || " (" || $pid || ")") else $pid)
    ),
    $t_lines:=tokenize($t7/data(),$nl),
    $t_def:=
    for $line in $t_lines return
    (
        $break_in_lines($line,$page_width,"")
    )
    return 
    ($header || $nl ||  string-join(for $i in (1 to $page_width) return "#") || $nl || string-join($t_def,$nl))
    
};
