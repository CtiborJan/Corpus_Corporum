declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/admin_functions.xq';

declare variable $date external;
declare variable $total_visits external;
declare variable $total_visits_by_users external;
declare variable $total_visits_by_bots external;
declare variable $unique_users external;
declare variable $unique_bots external;

declare variable $cc:accessibility external:="0";


cc:summarize_stats($date,$total_visits,$total_visits_by_users,$total_visits_by_bots,$unique_users,$unique_bots)
