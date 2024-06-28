declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/collection_manipulation.xq';
declare variable $cc_idno external:="";
declare variable $with_filesize external:="";
declare variable $cc:accessibility external:="0";

if ($with_filesize="true") then cc:get_items($cc_idno,true()) else cc:get_items($cc_idno) 
