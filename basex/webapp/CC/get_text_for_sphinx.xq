declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/sphinx.xq';

declare variable $index_type external:="s";
declare variable $cc_idno external;
declare variable $fb_too external:="true";
declare variable $start_index external:="0";
declare variable $cc:accessibility external:="0";

let $fb:= if ($fb_too="true" or $fb_too="1") then true() else false(),
$s_index:=number($start_index) 
return

cc:export_sentences_of_text_for_sphinx($cc_idno,$index_type,$fb,$s_index)
