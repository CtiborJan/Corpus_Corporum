declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at "/opt/basex/bin/modules/mod_get_text.xq"; 
declare variable $path external;
declare variable $table_of_contents_too external:="true";
declare variable $get_raw_XML external:="false";
declare variable $cc:accessibility external:="0";
declare variable $transformation external:="0";

let 
$table_of_contents_too2:=if ($table_of_contents_too="" or $table_of_contents_too="false") then false() else xs:boolean($table_of_contents_too),
$get_raw_XML2:=if ($get_raw_XML="" or $get_raw_XML="false") then false() else xs:boolean($get_raw_XML) return

if ($get_raw_XML2!=true()) then
    cc:fetch_text_data($path,$transformation,true(),$table_of_contents_too2) 
else
    cc:fetch_raw_text($path)
