declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $cc_idno external:="";
declare variable $cc:accessibility external:="0";

let $work_idno:=data((/cc_texts|/cc_temporary_data/cc_texts)/item[cc_idno=$cc_idno]/work_idno) return
(/cc_works|/cc_temporary_data/cc_works)/item[cc_idno=$work_idno]/main_language/text()
