declare namespace cc='http://mlat.uzh.ch/2.0';
declare namespace ccXfn='http://mlat.uzh.ch/2.0/cc-xml-functions';
declare namespace tei='http://www.tei-c.org/ns/1.0';
declare default element namespace 'http://mlat.uzh.ch/2.0';
declare variable $text_idno external;
declare variable $cc:accessibility external:="0";

let $T:=/cc_texts/item[cc_idno=$text_idno] return
if ($T/xslt_file) then
(
    if ($T/xslt_file/text()!="") then
    (
        $T/xslt_file/text()
    )
)
else
(
    let $C:=/cc_corpora/item[cc_idno=$T/corpus] return $C/xslt_file/text()
)
