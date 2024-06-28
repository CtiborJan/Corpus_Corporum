declare namespace cc="http://mlat.uzh.ch/2.0";
declare default element namespace "http://mlat.uzh.ch/2.0";
declare namespace tei="http://www.tei-c.org/ns/1.0";
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';
declare variable $cc:accessibility external:="0";
<items>
{
    for $i in /cc_texts/item where number($i/cc_idno)>21304 return $i
}
</items>
