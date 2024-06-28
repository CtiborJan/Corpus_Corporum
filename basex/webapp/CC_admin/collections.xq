declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";

import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $cc:accessibility external:="0";
declare variable $type external:="";
declare variable $cname external:="";

if ($cname="") then
    cc:collections()
else
(
    let $c:=
    
        (:if ($type="csv") then
            "&#10;cc_idno\cc_id\name\wikidata_id\viaf_id\mirabile_id&#10;",:)
        for $i in /*[local-name(.)=$cname]/item return
        (
            if ($type="csv") then
                concat($i/cc_idno/text(),"	",$i/cc_id/text(),"	",normalize-space($i/name_data/name/text()),"	",string-join($i/wikidata_id),"	",string-join($i/viaf_id),"	",string-join($i/mirabile_id))
            else    
                <item>{$i/cc_idno,$i/cc_id,$i/name_data/name,$i/wikidata_id,$i/viaf_id,$i/mirabile_id}</item>
        )
    return 
    if ($type="csv") then
    (
        file:write-text-lines(concat("/var/www/html/data/PoS_tagged/",$cname,".csv"),("cc_idno	cc_id	name	wikidata_id	viaf_id	mirabile_id",$c))
    )
    
    
)

