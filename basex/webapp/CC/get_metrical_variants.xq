declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/mod_cc_wordlists.xq';

declare variable $options external;
declare variable $cc:accessibility external:="0";

let $options2:= parse-xml($options)/* return 

cc:get_metrical_forms($options2)
