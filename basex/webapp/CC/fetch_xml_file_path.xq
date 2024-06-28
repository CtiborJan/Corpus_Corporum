declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at "/opt/basex/bin/modules/general_functions.xq"; 
declare variable $idno external;
declare variable $cc:accessibility external:="0";


let $T:=/cc_texts/item[cc_idno/text()=$idno] return
if ($T/xml_file_downloadable/text()="false" or cc:check_accessibility($cc:accessibility,$T/availability/text())=0) then
    ""
else
    $T/xml_file_path/text()
