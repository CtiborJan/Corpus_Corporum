<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:php="http://php.net/xsl"
    xmlns:cc="http://mlat.uzh.ch/2.0"
    xmlns:ccXfn="http://mlat.uzh.ch/2.0/cc-xml-functions"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0">
    <xsl:output method="xml" encoding="UTF-8"/> 
    <xsl:template match="/">
        <transform><pb n="supplied:BEGINNING"/><xsl:apply-templates/><pb n="supplied:END"/></transform>
    </xsl:template>
    <xsl:template match="tei:front">
        <front><xsl:apply-templates/></front>
    </xsl:template>
    <xsl:template match="tei:body">
        <body><xsl:apply-templates/></body>
    </xsl:template>
    <xsl:template match="tei:back">
        <back><xsl:apply-templates/></back>
    </xsl:template>
    <xsl:template match="tei:div">
        <div><xsl:apply-templates/></div>
    </xsl:template>
    <xsl:template match="tei:lg">
        <lg><xsl:apply-templates/></lg>
    </xsl:template>
    <xsl:template match="tei:head">
       <head><xsl:apply-templates/></head>
    </xsl:template>
    <xsl:template match="tei:p">
       <p><xsl:apply-templates/></p>
    </xsl:template>
    <xsl:template match="tei:l">
       <l><xsl:apply-templates/> </l>
    </xsl:template>
    <xsl:template match="tei:pb">
       <pb><xsl:attribute name="n"><xsl:value-of select="./@n"/></xsl:attribute></pb>
    </xsl:template>
    <xsl:template match="cc:paratext">
        <cc:paratext><xsl:attribute name="n"><xsl:value-of select="./@n"/></xsl:attribute></cc:paratext>
    </xsl:template>
</xsl:stylesheet>
