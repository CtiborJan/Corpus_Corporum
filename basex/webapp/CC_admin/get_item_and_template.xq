declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq', '/opt/basex/bin/modules/collection_manipulation.xq';
declare variable $idno external:="";
declare variable $collection external:="";
declare variable $names_from_idnos external:="";
declare variable $cc:accessibility external:="0";

if ($idno!="") then
    cc:get_item_with_template($idno)
else if ($collection!="" and $names_from_idnos="") then
    cc:get_template($collection)
else if ($names_from_idnos!="") then
    cc:get_template($collection,$names_from_idnos)
