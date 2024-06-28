declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/mod_cc_data.xq';
declare variable $cc:accessibility external:="0";
declare variable $options external;

let $opt:= parse-xml($options)/* return 
cc:insert_file($opt)

 
