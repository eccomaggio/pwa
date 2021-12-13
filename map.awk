#!/usr/bin/awk -f
# run as sed 's/\r//g' words_gept_l.tsv | awk -f map.awk
# creates a map declaration
#
BEGIN { print "let wordList = new Map([" }
{print "[ \"" $1 "\", [ \"" $2 "\", " $3 ", \"" $4 "\" ]],"}
END { print "])"  }
