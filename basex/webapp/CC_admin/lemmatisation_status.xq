declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $cc_idno external:="";
declare variable $status external:="";
declare variable $fn external:="set";
declare variable $cc:accessibility external:="0";

if ($fn="set") then
    cc:set_lemmatisation_status_of_text($cc_idno,$status)
else if ($fn="get") then
    cc:get_lemmatisation_status_of_text($cc_idno)
    
