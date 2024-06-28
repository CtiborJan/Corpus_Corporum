declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
import module 'http://mlat.uzh.ch/2.0' at '/opt/basex/bin/modules/general_functions.xq';
declare variable $cc:accessibility external:="0";
(: funkce cc:get_bible_versions() vrací json (vygenerovaný z xml pomocí xml-to-json(), ale tady nemůžeme použít příkaz pro výstup ve formátu json, protože asi jak to jde přes php, vznikne z toho úplný guláš se spoustou uvozovek a žádnou strukturou... :)

cc:get_bible_versions()

