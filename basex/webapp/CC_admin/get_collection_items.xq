declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $collection_path external:="";
declare variable $filter_type external:="";
declare variable $filter_element external:="";
declare variable $filter_value external:="";
declare variable $cc:accessibility external:="0";

if ($filter_element="") then
    cc:get_collection_items($collection_path)
else
    cc:get_collection_items($collection_path,$filter_type,$filter_element,$filter_value)
