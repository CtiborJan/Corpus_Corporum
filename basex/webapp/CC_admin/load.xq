declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/loading_texts.xq';
declare variable $cc:accessibility external:="0";
declare variable $options external;

let $options2:= parse-xml($options)/* return 

if ($options2/load_only_header/text()="true") then
    cc:load_header($options2)
else
    cc:load($options2)