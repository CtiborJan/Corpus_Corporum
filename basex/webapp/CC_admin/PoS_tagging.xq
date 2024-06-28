declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/loading_texts.xq';
declare variable $cc:accessibility external:="0";
declare variable $idno external;
declare variable $mode external:="0";

if ($mode="0") then
    cc:PoS_tagging($idno)
else
    cc:PoS_tagging_MySQL($idno)
