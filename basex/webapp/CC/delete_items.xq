declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/collection_manipulation.xq';

declare variable $cc_idno_sequence external;
declare variable $if_referenced_mode external;
declare variable $cc:accessibility external:="0";

let $cc_idno_seq:=xquery:eval($cc_idno_sequence) return

cc:delete_items($cc_idno_seq,$if_referenced_mode)
