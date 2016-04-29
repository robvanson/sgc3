#!perl
my $file = shift(@ARGV);
$file = "SpeakGoodChinese3.appcache" unless($file);
my $header = `git log| head -3| sed 's/^/# /g'`;
open(APPCACHE, "<$file") || die "$file: $!\n";
my @appcache = <APPCACHE>;
close(APPCACHE);
open(APPCACHE, ">$file") || die "$file: $!\n";
while(my $line = shift(@appcache)) {
	print APPCACHE $line unless($line =~ /\# (commit|Author\:|Date\:  ) /);
	if($line =~ /\# Version 1/) {print APPCACHE $header;};
};

