declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/mod_get_text.xq';
declare variable $cc_idno external:="";
declare variable $cc:accessibility external:="0";
declare variable $cc:header_too external:=true();

<text cc_idno="{$cc_idno}">
{
    cc:fetch_raw_text($cc_idno,$cc:header_too)
}
</text>
