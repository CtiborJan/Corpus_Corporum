declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $cc:accessibility external:="0";
declare variable $from external:="";
declare variable $to external:="";

cc:user_stats($from,$to)
