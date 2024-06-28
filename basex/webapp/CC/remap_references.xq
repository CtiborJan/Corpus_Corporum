declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/collection_manipulation.xq';

declare variable $references external;
declare variable $new_object_idno external;
declare variable $all external;
declare variable $cc:accessibility external:="0";

if ($all='true') then
    cc:remap_all_references($references,$new_object_idno)
else
    cc:remap_selected_references($references,$new_object_idno)
