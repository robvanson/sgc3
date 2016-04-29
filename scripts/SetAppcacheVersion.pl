#!perl
my $file = shift(@ARGV);
$file = "SpeakGoodChinese3.appcache" unless($file);
my $header = `git log| head -3| sed 's/^/# /g'`;
open(APPCACHE, "<$file") || die "$file: $!\n";
my @appcache = <APPCACHE>;
close(APPCACHE);
open(APPCACHE, ">$file") || die "$file: $!\n";
while(my $line = shift(@appcache)) {
	if($line =~ m!<div id\=["']VERSION["'] style=["']([^"']+)["']\s*>[^<]*</div>!) {
		if($header =~ /\# Date\:\s+(.+)\n/s) {
			$date = $1;
			$date =~ s/\s*[\+\-]\d+\s*$//g;
		};
		if($header =~ /\# commit\s+(.+)\n/s) {
			$commit = substr($1, 0, 10);
		};
		
		$line =~ s!(<div id\=["']VERSION['"] style=["']([^"']+)["']\s*>)[^<]*(</div>)!\1V: $commit $date\3!gs;
	};
	print APPCACHE $line unless($line =~ /\# (commit|Author\:|Date\:  ) /);
	if($line =~ /\# Version 1/) {print APPCACHE $header;};
};

