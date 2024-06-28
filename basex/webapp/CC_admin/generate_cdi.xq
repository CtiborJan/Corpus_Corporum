declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq', '/opt/basex/bin/modules/cdi.xq';
declare variable $cc_idno external;
declare variable $cc:accessibility external:="0";

let $obj:=//item[cc_idno=$cc_idno] return
cc:generate_cdi($obj,"all",true())
