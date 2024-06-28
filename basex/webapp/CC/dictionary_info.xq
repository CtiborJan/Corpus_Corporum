declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at "/opt/basex/bin/modules/mod_lexica.xq"; 
declare variable $type external:="basic_info";
declare variable $dictionary external:="";
declare variable $letter external:="";
declare variable $entry external:="";
declare variable $hom_nr external:="";
declare variable $entry_id external:="";
declare variable $cc:accessibility external:="0";

if ($type="basic_info") then
    cc:dictionary_info($dictionary,false())
else if ($type="about") then
    cc:dictionary_about($dictionary)
else if ($type="get_entries") then
    cc:dictionary_get_entries($dictionary,$letter)
else if ($type="get_entry") then
(
    if ($entry_id!="") then
        cc:get_one_dictionary_entry($dictionary,$entry_id)
    else
        cc:get_one_dictionary_entry($dictionary,$entry,$hom_nr)
)
