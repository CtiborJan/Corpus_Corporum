declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/mod_browsing.xq';
declare variable $cc:path external:="";
declare variable $cc:group_by external:="";
declare variable $cc:accessibility external:="0";

cc:create_nasty_workaround($cc:path,$cc:group_by)
