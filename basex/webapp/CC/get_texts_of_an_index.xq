declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/sphinx.xq';

declare variable $index external:="all";
declare variable $cc:accessibility external:="0";

cc:get_texts_of_index($index,true()) 