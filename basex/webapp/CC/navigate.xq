declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at "/opt/basex/bin/modules/mod_browsing.xq"; 
declare variable $path external;
declare variable $mode external;
declare variable $group_by external:="";
declare variable $get_search_results external:="";
declare variable $cc:accessibility external:="0";

if ($get_search_results="") then
    cc:navigate(<options><path>{$path}</path><mode>{$mode}</mode><group_by>{$group_by}</group_by><add_informations>true</add_informations></options>) 
else
    cc:get_search_results(parse-xml($path))
