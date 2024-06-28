declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
declare variable $text_idno external;
declare variable $cc:accessibility external:="0";

let $true_text_idno:=analyze-string($text_idno,"^[0-9]+")/fn:match/text() return
let $corpus_idno:=/cc_texts/item[cc_idno=$true_text_idno]/corpus/text() return
/cc_corpora/item[cc_idno=$corpus_idno]/nr/text()
