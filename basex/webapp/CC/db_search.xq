declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at "/opt/basex/bin/modules/mod_db_search.xq"; 
declare variable $mode external:=0; (:0=simple 1=extended:)
declare variable $query_text external:="";
declare variable $subject external:="";
declare variable $query_xml external:="";
declare variable $cc:accessibility external:="0";

if ($query_xml="") then
(
    let $q:=<db_search_query><mode>{$mode}</mode><query_text>{$query_text}</query_text><subject>{$subject}</subject></db_search_query> return
    cc:search($q)
)
