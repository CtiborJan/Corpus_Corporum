declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/todo_quee.xq';

declare variable $periodicity external;
declare variable $delete external;
declare variable $cc:accessibility external:="0";

if ($periodicity="" or $periodicity="all") then
    get_quee()
else
    cc:get_quee_by_periodicity($periodicity,$delete)
