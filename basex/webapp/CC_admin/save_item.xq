declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq', '/opt/basex/bin/modules/collection_manipulation.xq';
declare variable $data external:="";
declare variable $collection external:="";
declare variable $cc:accessibility external:="0";

let $coll:=cc:dynamic-path($cc:adminroot,$collection),
   
   $data2:=parse-xml-fragment($data) return
     if (count(tokenize($data2/cc_idno/text(),","))=1) then
        cc:save_collection_item($coll,$data2)
    else if (not($data2/cc_idno)) then
        cc:save_collection_item($coll,$data2)
    else if (count(tokenize($data2/cc_idno/text(),","))>1) then
        cc:save_collection_items_multiedit($coll,$data2)
