declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/collection_manipulation.xq';

declare variable $cc:accessibility external:="0";
declare variable $cc_idno external;
declare variable $if_referenced_mode:="0";

let $cc_idnos:=tokenize($cc_idno,",") return

cc:delete_items($cc_idnos,$if_referenced_mode)
