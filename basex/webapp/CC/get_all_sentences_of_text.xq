declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/get_sentence.xq';

declare variable $cc_idno external;
declare variable $fb_too external:="true";
declare variable $cc:accessibility external:="0";
let $fb:= if ($fb_too="true" or $fb_too="1") then true() else false()
return

cc:get_all_sentences_of_text($cc_idno,$fb,true())
