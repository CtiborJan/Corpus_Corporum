declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/sphinx.xq';

declare variable $index external;
declare variable $type external;
declare variable $path external;
declare variable $cc:accessibility external:="0";

cc:export_data_for_sphinx($index,$type,$path)
